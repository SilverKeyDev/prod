"""Shared schema loader for log contract codegen."""

from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_YAML_PATH = REPO_ROOT / "scripts" / "log_contracts" / "categories.yaml"

SERVER_CORE_CONFIG_KEYS = (
    "polling",
    "pages",
    "hooks",
    "auth",
    "http",
    "api",
    "errors",
    "security",
)


@dataclass
class CategoryDef:
    name: str
    config_key: str
    subcategories: list[tuple[str, str]] = field(default_factory=list)


def snake_to_camel(name: str) -> str:
    parts = name.lower().split("_")
    return parts[0] + "".join(part.capitalize() for part in parts[1:])


def load_categories_yaml(path: Path = DEFAULT_YAML_PATH) -> tuple[list[str], list[CategoryDef]]:
    """Minimal YAML loader for the restricted categories.yaml schema."""
    always_enabled: list[str] = []
    categories: list[CategoryDef] = []
    section: str | None = None
    current: CategoryDef | None = None
    in_subcategories = False

    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.split("#", 1)[0].rstrip()
        if not line.strip():
            continue
        stripped = line.strip()
        indent = len(line) - len(line.lstrip())

        if stripped == "alwaysEnabled:":
            section = "alwaysEnabled"
            in_subcategories = False
            current = None
            continue
        if stripped == "categories:":
            section = "categories"
            in_subcategories = False
            current = None
            continue

        if section == "categories" and stripped == "subcategories:":
            in_subcategories = True
            continue

        if section == "alwaysEnabled" and stripped.startswith("- "):
            always_enabled.append(stripped[2:].strip())
            continue

        if section == "categories":
            if stripped.startswith("- name:"):
                name = stripped.split(":", 1)[1].strip()
                if in_subcategories and current is not None and indent > 4:
                    current.subcategories.append((name, snake_to_camel(name)))
                    continue
                current = CategoryDef(name=name, config_key=snake_to_camel(name))
                categories.append(current)
                in_subcategories = False
                continue
            if stripped == "subcategories:":
                in_subcategories = True
                continue

    if not always_enabled:
        raise ValueError("categories.yaml must define alwaysEnabled")
    if not categories:
        raise ValueError("categories.yaml must define categories")

    return always_enabled, categories


def boolean_keys(categories: list[CategoryDef]) -> list[str]:
    keys: list[str] = []
    for cat in categories:
        if cat.name == "API":
            continue
        keys.append(cat.config_key)
    return keys
