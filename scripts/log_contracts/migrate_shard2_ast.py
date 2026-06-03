#!/usr/bin/env python3
"""AST migration for SHARD 2 Server logging."""

from __future__ import annotations

import ast
import sys
from copy import deepcopy
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent

SHARD_ROOTS = [
    ROOT / "Server/app/services/auth",
    ROOT / "Server/app/services/agent",
    ROOT / "Server/app/services/calendar",
    ROOT / "Server/app/services/chatbot",
]
SHARD_FILES = [ROOT / "Server/app/http/flask_runtime_routes.py"]

SKIP_REL = frozenset(
    {
        "Server/app/services/auth/user/delete_user.py",
        "Server/app/services/auth/user/reset_user_dev_data.py",
        "Server/app/services/auth/user/delete_user_external_cleanup.py",
        "Server/app/services/auth/user/user_s3_cleanup.py",
        "Server/app/services/agent/conversation_service.py",
        "Server/app/services/agent/conversation_list.py",
        "Server/app/services/agent/conversation_messages.py",
        "Server/app/services/agent/todo_service.py",
        "Server/app/services/agent/event_request_handlers.py",
        "Server/app/services/agent/messaging_realtime.py",
    }
)


def category_for(path: Path) -> str:
    p = path.as_posix()
    if "chatbot" in p:
        return "MESSAGES"
    if "calendar" in p:
        return "CALENDAR"
    if "auth" in p:
        return "AUTH"
    if "agent" in p:
        return "API"
    if "flask_runtime_routes" in path.name:
        return "API"
    return "API"


def _is_logger_receiver(node: ast.AST) -> bool:
    if isinstance(node, ast.Name) and node.id == "logger":
        return True
    if isinstance(node, ast.Attribute):
        if isinstance(node.value, ast.Name) and node.value.id == "current_app" and node.attr == "logger":
            return True
        if isinstance(node.value, ast.Name) and node.value.id == "app" and node.attr == "logger":
            return True
    return False


def _extract_extra(keywords: list[ast.keyword]) -> tuple[list[ast.keyword], ast.expr | None]:
    extra_val = None
    rest: list[ast.keyword] = []
    for kw in keywords:
        if kw.arg == "extra":
            extra_val = kw.value
        elif kw.arg != "exc_info":
            rest.append(kw)
    return rest, extra_val


def _format_message_from_printf(fmt: str, args: list[ast.expr]) -> ast.expr:
    if not args:
        return ast.Constant(fmt)
    if "%s" not in fmt and "%d" not in fmt:
        return ast.Constant(fmt)
    parts = fmt.split("%s")
    values: list[ast.expr] = []
    for i, part in enumerate(parts):
        if part:
            values.append(ast.Constant(part))
        if i < len(args):
            values.append(args[i])
    if len(values) == 1:
        return values[0]
    joined: list[ast.expr] = []
    for v in values:
        if isinstance(v, ast.Constant) and isinstance(v.value, str):
            joined.append(v)
        else:
            joined.append(ast.FormattedValue(v, conversion=-1))
    return ast.JoinedStr(joined)


class Shard2Migrator(ast.NodeTransformer):
    def __init__(self, default_cat: str) -> None:
        self.default_cat = default_cat
        self.changed = False

    def visit_Import(self, node: ast.Import) -> ast.AST | None:
        if any(a.name == "logging" for a in node.names):
            self.changed = True
            return None
        return node

    def visit_ImportFrom(self, node: ast.ImportFrom) -> ast.AST | None:
        if node.module == "logging":
            self.changed = True
            return None
        if node.module == "app.utils.security.app_logging":
            self.changed = True
            return None
        if node.module == "flask":
            new = []
            for a in node.names:
                if a.name == "current_app":
                    self.changed = True
                    continue
                new.append(a)
            if not new:
                return None
            node.names = new
            return node
        return node

    def visit_Assign(self, node: ast.Assign) -> ast.AST | None:
        if len(node.targets) != 1 or not isinstance(node.targets[0], ast.Name):
            return node
        if node.targets[0].id != "logger":
            return node
        val = node.value
        if isinstance(val, ast.Call):
            fn = val.func
            if isinstance(fn, ast.Attribute) and isinstance(fn.value, ast.Name):
                if fn.value.id == "logging" and fn.attr == "getLogger":
                    self.changed = True
                    return None
            if isinstance(fn, ast.Name) and fn.id == "get_logger":
                self.changed = True
                return None
        return node

    def visit_Expr(self, node: ast.Expr) -> ast.AST | None:
        node = self.generic_visit(node)  # type: ignore[assignment]
        if isinstance(node, ast.Expr) and isinstance(node.value, ast.Call):
            call = node.value
            if (
                isinstance(call.func, ast.Attribute)
                and isinstance(call.func.value, ast.Name)
                and call.func.value.id == "logger"
                and call.func.attr == "setLevel"
            ):
                self.changed = True
                return None
        return node

    def _build_log_call(
        self, level: str, category: str, message: ast.expr, data: ast.expr | None
    ) -> ast.Call:
        self.changed = True
        args: list[ast.expr] = [ast.Constant(category), message]
        if data is not None:
            args.append(data)
        return ast.Call(
            func=ast.Attribute(value=ast.Name(id="log", ctx=ast.Load()), attr=level),
            args=args,
            keywords=[],
        )

    def visit_Call(self, node: ast.Call) -> ast.AST:
        self.generic_visit(node)
        if not isinstance(node.func, ast.Attribute):
            return node
        if not _is_logger_receiver(node.func.value):
            return node

        method = node.func.attr
        level_map = {
            "debug": ("debug", "default"),
            "info": ("info", "default"),
            "warning": ("warn", "default"),
            "warn": ("warn", "default"),
            "error": ("error", "errors"),
            "security": ("security", "security"),
        }
        if method not in level_map:
            return node
        py_level, cat_kind = level_map[method]
        category = (
            "ERRORS"
            if cat_kind == "errors"
            else "SECURITY"
            if cat_kind == "security"
            else self.default_cat
        )

        args = list(node.args)
        keywords, extra = _extract_extra(list(node.keywords))

        if method == "security" and args:
            c0 = args[0]
            if isinstance(c0, ast.Constant) and isinstance(c0.value, str):
                if c0.value in ("SECURITY", "AUTH", "CALENDAR", "MESSAGES", "API", "ERRORS"):
                    self.changed = True
                    return ast.Call(
                        func=ast.Attribute(value=ast.Name("log", ast.Load()), attr="security"),
                        args=args,
                        keywords=keywords,
                    )

        message: ast.expr
        data: ast.expr | None = extra

        if not args:
            message = ast.Constant("")
        elif len(args) == 1:
            message = args[0]
        elif len(args) == 2 and isinstance(args[0], ast.Constant) and isinstance(args[0].value, str):
            if "%" in args[0].value:
                message = _format_message_from_printf(args[0].value, [args[1]])
                if py_level == "error" and isinstance(args[1], ast.Name):
                    data = args[1]
            else:
                message = args[0]
                data = args[1] if extra is None else extra
        else:
            if isinstance(args[0], ast.Constant) and isinstance(args[0].value, str) and "%" in args[0].value:
                message = _format_message_from_printf(args[0].value, args[1:])
            else:
                message = args[0]
            if extra is None and len(args) > 1 and py_level == "error":
                data = args[-1]

        if py_level == "error" and data is None and extra is not None:
            data = extra
        elif py_level != "error" and extra is not None:
            data = extra

        return self._build_log_call(py_level, category, message, data)


def has_legacy_logging(src: str) -> bool:
    markers = (
        "import logging",
        "app_logging",
        "current_app.logger",
        "get_logger()",
        "app.logger",
    )
    if any(m in src for m in markers):
        return True
    return bool(
        __import__("re").search(r"(?<![.\w])logger\.(info|warning|error|debug|warn)\(", src)
    )


def ensure_log_import(tree: ast.Module) -> None:
    for n in tree.body:
        if isinstance(n, ast.ImportFrom) and n.module == "logger":
            if any(a.name == "log" for a in n.names):
                return
    idx = 0
    for i, n in enumerate(tree.body):
        if isinstance(n, (ast.Import, ast.ImportFrom)):
            idx = i + 1
    tree.body.insert(idx, ast.ImportFrom(module="logger", names=[ast.alias(name="log")], level=0))


def migrate_file(path: Path) -> bool:
    rel = path.relative_to(ROOT).as_posix()
    if rel in SKIP_REL:
        return False
    src = path.read_text(encoding="utf-8")
    if not has_legacy_logging(src):
        return False
    try:
        tree = ast.parse(src)
    except SyntaxError as exc:
        print(f"SKIP syntax {rel}: {exc}", file=sys.stderr)
        return False
    migrator = Shard2Migrator(category_for(path))
    new_tree = migrator.visit(deepcopy(tree))
    if not migrator.changed:
        return False
    ast.fix_missing_locations(new_tree)
    ensure_log_import(new_tree)
    new_src = ast.unparse(new_tree) + "\n"
    path.write_text(new_src, encoding="utf-8")
    return True


def main() -> int:
    paths: list[Path] = []
    for root in SHARD_ROOTS:
        paths.extend(sorted(root.rglob("*.py")))
    paths.extend(SHARD_FILES)
    changed = [p for p in paths if migrate_file(p)]
    print(f"Changed {len(changed)}")
    for p in changed:
        print(p.relative_to(ROOT))
    return 0


if __name__ == "__main__":
    sys.exit(main())
