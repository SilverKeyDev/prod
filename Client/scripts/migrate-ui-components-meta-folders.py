#!/usr/bin/env python3
"""Rewrite packages/ui/components/* import paths after meta-folder reorg."""

from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]  # Client/

# Longest-prefix first (segment after components/)
PREFIX_MAP: list[tuple[str, str]] = [
    ("packages/ui/components/accessibility", "packages/ui/components/system/accessibility"),
    ("packages/ui/components/adapters", "packages/ui/components/system/adapters"),
    ("packages/ui/components/security", "packages/ui/components/system/security"),
    ("packages/ui/components/backgrounds", "packages/ui/components/surfaces/backgrounds"),
    ("packages/ui/components/feedback", "packages/ui/components/surfaces/feedback"),
    ("packages/ui/components/popover", "packages/ui/components/surfaces/popover"),
    ("packages/ui/components/patterns", "packages/ui/components/surfaces/patterns"),
    ("packages/ui/components/modals", "packages/ui/components/surfaces/modals"),
    ("packages/ui/components/cards", "packages/ui/components/surfaces/cards"),
    ("packages/ui/components/badge", "packages/ui/components/surfaces/badge"),
    ("packages/ui/components/match", "packages/ui/components/surfaces/match"),
    ("packages/ui/components/button", "packages/ui/components/actions/button"),
    ("packages/ui/components/form", "packages/ui/components/inputs/form"),
    ("packages/ui/components/primitives", "packages/ui/components/structure/primitives"),
    ("packages/ui/components/layout", "packages/ui/components/structure/layout"),
    ("packages/ui/components/sidebar", "packages/ui/components/structure/sidebar"),
    ("packages/ui/components/tabs", "packages/ui/components/structure/tabs"),
    ("packages/ui/components/portal", "packages/ui/components/structure/portal"),
    ("packages/ui/components/text", "packages/ui/components/structure/text"),
    ("packages/ui/components/asset", "packages/ui/components/media/asset"),
    ("packages/ui/components/avatar", "packages/ui/components/media/avatar"),
    ("packages/ui/components/icons", "packages/ui/components/media/icons"),
    ("packages/ui/components/ui", "packages/ui/components/media/ui"),
]

# Relative imports used inside packages/ui (from old flat layout)
RELATIVE_MAP: list[tuple[str, str]] = [
    ('from "./accessibility', 'from "./system/accessibility'),
    ('from "./backgrounds', 'from "./surfaces/backgrounds'),
    ('from "./feedback', 'from "./surfaces/feedback'),
    ('from "./primitives', 'from "./structure/primitives'),
    ('from "./text', 'from "./structure/text'),
    ('from "./form/', 'from "./inputs/form/'),
    ('from "./button/', 'from "./actions/button/'),
    ('from "./cards/', 'from "./surfaces/cards/'),
    ('from "./modals/', 'from "./surfaces/modals/'),
    ('from "./popover/', 'from "./surfaces/popover/'),
    ('from "./match', 'from "./surfaces/match'),
    ('from "./layout/', 'from "./structure/layout/'),
    ('from "./sidebar/', 'from "./structure/sidebar/'),
    ('from "./asset/', 'from "./media/asset/'),
    ('from "./avatar', 'from "./media/avatar'),
    ('from "../accessibility', 'from "../system/accessibility'),
    ('from "../primitives', 'from "../structure/primitives'),
    ('from "../text/', 'from "../structure/text/'),
    ('from "../button/', 'from "../actions/button/'),
    ('from "../form/', 'from "../inputs/form/'),
    ('from "../cards/', 'from "../surfaces/cards/'),
    ('from "../modals/', 'from "../surfaces/modals/'),
    ('from "../layout/', 'from "../structure/layout/'),
    ('from "../asset/', 'from "../media/asset/'),
    ('from "../adapters/', 'from "../system/adapters/'),
    ('from "../portal/', 'from "../structure/portal/'),
    ('from "../icons/', 'from "../media/icons/'),
    ('from "../../primitives', 'from "../../structure/primitives'),
    ('from "../../text/', 'from "../../structure/text/'),
    ('from "../../button/', 'from "../../actions/button/'),
    ('from "../../form/', 'from "../../inputs/form/'),
    ('from "../../cards/', 'from "../../surfaces/cards/'),
    ('from "../../modals/', 'from "../../surfaces/modals/'),
    ('from "../../layout/', 'from "../../structure/layout/'),
    ('from "../../asset/', 'from "../../media/asset/'),
    ('from "../../adapters/', 'from "../../system/adapters/'),
    ('from "../../../primitives', 'from "../../../structure/primitives'),
    ('from "../../../text/', 'from "../../../structure/text/'),
    ('from "../../../button/', 'from "../../../actions/button/'),
    ('from "../../../form/', 'from "../../../inputs/form/'),
    ('from "../../../cards/', 'from "../../../surfaces/cards/'),
    ('from "../../../modals/', 'from "../../../surfaces/modals/'),
]


def apply_maps(text: str) -> str:
    for old, new in PREFIX_MAP:
        text = text.replace(old, new)
    for old, new in RELATIVE_MAP:
        text = text.replace(old, new)
    return text


def main() -> int:
    exts = {".ts", ".tsx", ".js", ".jsx", ".cjs", ".mjs", ".json", ".md"}
    changed = 0
    needles = tuple(old for old, _ in PREFIX_MAP) + (
        'from "./form/',
        'from "./button/',
        'from "./primitives',
        'from "./cards/',
        'from "./modals/',
    )
    for path in sorted(ROOT.rglob("*")):
        if path.suffix not in exts and path.name not in ("metro.config.cjs",):
            continue
        if "node_modules" in path.parts or "dist" in path.parts:
            continue
        try:
            txt = path.read_text(encoding="utf-8")
        except (UnicodeDecodeError, OSError):
            continue
        if not any(n in txt for n in needles):
            continue
        new_txt = apply_maps(txt)
        if new_txt != txt:
            path.write_text(new_txt, encoding="utf-8")
            changed += 1
            print(path.relative_to(ROOT.parent))
    print(f"Updated {changed} files", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
