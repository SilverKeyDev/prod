#!/usr/bin/env python3
"""One-shot: group packages/utils domain folders into meta-folders and rewrite imports."""
from __future__ import annotations

import os
import re
import subprocess
from pathlib import Path

CLIENT = Path(__file__).resolve().parents[1]
UTILS = CLIENT / "packages" / "utils"

GROUPS: dict[str, list[str]] = {
    "core": [
        "array",
        "date",
        "dom",
        "errorHandling",
        "format",
        "platform",
        "storage",
        "typeGuards",
        "perf",
        "test",
        "ui",
        "layout",
    ],
    "auth": ["auth", "verification", "clientSettings"],
    "transaction": [
        "property",
        "propertyDetails",
        "agreement",
        "documents",
        "legal",
        "affordability",
        "saved",
        "viewing",
        "tour",
        "revShare",
    ],
    "comms": ["messaging", "calendar", "scheduling", "share"],
    "growth": ["partners", "admin", "agent"],
    "product": [
        "checklists",
        "dashboard",
        "search",
        "navigation",
        "routing",
        "workspace",
        "maps",
        "media",
        "web",
        "domain",
    ],
}

DOMAIN_TO_META: dict[str, str] = {
    domain: meta for meta, domains in GROUPS.items() for domain in domains
}


def move_domains() -> None:
    for meta, domains in GROUPS.items():
        meta_path = UTILS / meta
        meta_path.mkdir(exist_ok=True)
        for domain in domains:
            src = UTILS / domain
            dst = meta_path / domain
            if dst.exists():
                continue
            if not src.exists():
                # Already grouped under another meta path.
                if any((UTILS / m / domain).exists() for m in GROUPS):
                    continue
                raise SystemExit(f"missing domain folder: {src}")
            if meta == domain:
                temp = UTILS / f"__{domain}__"
                subprocess.run(
                    ["git", "mv", str(src), str(temp)], check=True, cwd=CLIENT.parent
                )
                subprocess.run(
                    ["git", "mv", str(temp), str(dst)], check=True, cwd=CLIENT.parent
                )
            else:
                subprocess.run(
                    ["git", "mv", str(src), str(dst)], check=True, cwd=CLIENT.parent
                )


def rewrite_file(path: Path, content: str) -> str | None:
    original = content
    # Longest domain names first to avoid partial matches (propertyDetails before property).
    for domain in sorted(DOMAIN_TO_META, key=len, reverse=True):
        meta = DOMAIN_TO_META[domain]
        old = f"packages/utils/{domain}"
        new = f"packages/utils/{meta}/{domain}"
        content = content.replace(old, new)

    # Relative import across meta folders (only known cross-meta ref).
    content = content.replace(
        'from "../agent/clientHubSlug"',
        'from "../../growth/agent/clientHubSlug"',
    )

    return content if content != original else None


def rewrite_tree(root: Path, globs: tuple[str, ...]) -> int:
    changed_files = 0
    for pattern in globs:
        for path in root.rglob(pattern):
            if not path.is_file():
                continue
            if "node_modules" in path.parts or path.name == "reorg-utils-meta.py":
                continue
            try:
                text = path.read_text(encoding="utf-8")
            except UnicodeDecodeError:
                continue
            updated = rewrite_file(path, text)
            if updated is not None:
                path.write_text(updated, encoding="utf-8")
                changed_files += 1
    return changed_files


def update_index_ts() -> None:
    index = UTILS / "index.ts"
    text = index.read_text(encoding="utf-8")
    replacements = {
        './array': './core/array',
        './errorHandling': './core/errorHandling',
        './format': './core/format',
        './platform': './core/platform',
        './saved': './transaction/saved',
        './storage/hash': './core/storage/hash',
        './storage/storage': './core/storage/storage',
        './typeGuards': './core/typeGuards',
    }
    for old, new in replacements.items():
        text = text.replace(old, new)
    index.write_text(text, encoding="utf-8")


def patch_tsconfig_and_bundler() -> None:
    path_pairs: list[tuple[tuple[str, str], ...]] = [
        (
            (
                '"packages/utils/error": ["packages/utils/errorHandling/error"]',
                '"packages/utils/error": ["packages/utils/core/errorHandling/error"]',
            ),
            (
                '"packages/utils/date": ["packages/utils/date"]',
                '"packages/utils/date": ["packages/utils/core/date"]',
            ),
            (
                '"packages/utils/date/*": ["packages/utils/date/*"]',
                '"packages/utils/date/*": ["packages/utils/core/date/*"]',
            ),
            (
                '"packages/utils/platform": ["packages/utils/platform"]',
                '"packages/utils/platform": ["packages/utils/core/platform"]',
            ),
            (
                '"packages/utils/storage/platformStorage": ["packages/utils/storage/platformStorage"]',
                '"packages/utils/storage/platformStorage": ["packages/utils/core/storage/platformStorage"]',
            ),
        ),
        (
            (
                '"packages/utils/error": "packages/utils/errorHandling/error"',
                '"packages/utils/error": "packages/utils/core/errorHandling/error"',
            ),
            (
                '"packages/utils/date": "packages/utils/date"',
                '"packages/utils/date": "packages/utils/core/date"',
            ),
            (
                '"packages/utils/date/*": "packages/utils/date/*"',
                '"packages/utils/date/*": "packages/utils/core/date/*"',
            ),
            (
                '"packages/utils/platform": "packages/utils/platform"',
                '"packages/utils/platform": "packages/utils/core/platform"',
            ),
            (
                '"packages/utils/storage/platformStorage": "packages/utils/storage/platformStorage"',
                '"packages/utils/storage/platformStorage": "packages/utils/core/storage/platformStorage"',
            ),
        ),
    ]
    paths = [
        CLIENT / "tsconfig.base.json",
        CLIENT / "packages/config/bundler-path-manifest.json",
    ]
    patches = list(zip(paths, path_pairs, strict=True))
    for path, pairs in patches:
        text = path.read_text(encoding="utf-8")
        for old, new in pairs:
            if old not in text:
                raise SystemExit(f"patch miss in {path}: {old[:60]}")
            text = text.replace(old, new)
        path.write_text(text, encoding="utf-8")


def patch_vite_and_variants() -> None:
    vite = CLIENT / "apps/web/vite.config.resolve.js"
    text = vite.read_text(encoding="utf-8")
    text = text.replace(
        'find: "packages/utils/domain/compare"',
        'find: "packages/utils/product/domain/compare"',
    )
    text = text.replace(
        'find: "packages/utils/domain/compare/csvUtils"',
        'find: "packages/utils/product/domain/compare/csvUtils"',
    )
    text = text.replace(
        'find: "packages/utils/domain/compare/types"',
        'find: "packages/utils/product/domain/compare/types"',
    )
    vite.write_text(text, encoding="utf-8")

    variants = CLIENT / "packages/config/platform/variants.json"
    vtext = variants.read_text(encoding="utf-8")
    vtext = vtext.replace("packages/utils/platform/", "packages/utils/core/platform/")
    vtext = vtext.replace("packages/utils/maps/", "packages/utils/product/maps/")
    variants.write_text(vtext, encoding="utf-8")


def patch_eslint_paths() -> None:
    files = [
        CLIENT
        / "packages/config/eslint/eslint-plugin-silverkey/rules/ui/no-native-date.js",
        CLIENT / "packages/config/eslint/eslint-overrides/file-exceptions-overrides.js",
        CLIENT
        / "packages/config/eslint/eslint-overrides/silverkey-components-and-features.js",
        CLIENT
        / "packages/config/eslint/eslint-plugin-silverkey/rules/security/no-unsafe-innerhtml.js",
        CLIENT
        / "packages/config/eslint/eslint-plugin-silverkey/rules/platform/prefer-use-window-dimensions.js",
    ]
    for path in files:
        if not path.exists():
            continue
        text = path.read_text(encoding="utf-8")
        updated = rewrite_file(path, text)
        if updated is not None:
            path.write_text(updated, encoding="utf-8")


def count_utils_children() -> int:
    return sum(1 for p in UTILS.iterdir() if p.is_dir())


def main() -> None:
    print("Moving domain folders into meta-folders...")
    move_domains()
    print(f"Direct children under packages/utils: {count_utils_children()}")
    update_index_ts()
    patch_tsconfig_and_bundler()
    patch_vite_and_variants()
    patch_eslint_paths()
    n = rewrite_tree(
        CLIENT,
        ("*.ts", "*.tsx", "*.js", "*.jsx", "*.json", "*.css", "*.md", "*.cjs", "*.mjs"),
    )
    print(f"Rewrote imports in {n} files")


if __name__ == "__main__":
    main()
