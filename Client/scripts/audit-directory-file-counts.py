#!/usr/bin/env python3
"""
List directories under Client with at least N immediate child files.

Used for folder-decomposition audits. Skips build artifacts and dependencies.

Usage:
  python3 Client/scripts/audit-directory-file-counts.py
  python3 Client/scripts/audit-directory-file-counts.py --min-files 10 --exclude-app-roots
"""

from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path


SKIP_DIR_NAMES = frozenset(
    {
        "node_modules",
        "dist",
        "coverage",
        "Pods",
        "DerivedData",
        "build",
        ".turbo",
        ".cache",
    }
)


def prune_dirnames(dirnames: list[str]) -> None:
    dirnames[:] = [
        d for d in dirnames if not d.startswith(".") and d not in SKIP_DIR_NAMES
    ]


def parse_args() -> argparse.Namespace:
    client_root = Path(__file__).resolve().parent.parent
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--min-files",
        type=int,
        default=7,
        help="Minimum immediate file count per directory (default: 7)",
    )
    parser.add_argument(
        "--client-root",
        type=Path,
        default=client_root,
        help="Client workspace root",
    )
    parser.add_argument(
        "--exclude-app-roots",
        action="store_true",
        help="Omit apps/web and apps/mobile directory rows themselves",
    )
    parser.add_argument(
        "--exclude-eslint-rules",
        action="store_true",
        help="Omit paths under packages/config/eslint/",
    )
    parser.add_argument(
        "--exclude-ios-app",
        action="store_true",
        help="Omit paths under apps/mobile/ios/",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    client = args.client_root.resolve()
    roots = [
        client / "apps" / "web",
        client / "apps" / "mobile",
        client / "packages",
    ]

    rows: list[tuple[int, Path]] = []
    for root in roots:
        if not root.is_dir():
            continue
        for dirpath, dirnames, filenames in os.walk(root, topdown=True):
            prune_dirnames(dirnames)
            p = Path(dirpath).resolve()
            rel = p.relative_to(client)
            if args.exclude_app_roots and rel in {
                Path("apps/web"),
                Path("apps/mobile"),
            }:
                continue
            if args.exclude_eslint_rules and "packages/config/eslint" in rel.parts:
                continue
            if args.exclude_ios_app and rel.parts[:3] == ("apps", "mobile", "ios"):
                continue

            files = [f for f in filenames if not f.startswith(".")]
            if len(files) >= args.min_files:
                rows.append((len(files), rel))

    rows.sort(key=lambda x: (-x[0], str(x[1])))
    for count, rel in rows:
        print(f"{count}\t{rel}")
    print(f"\nTOTAL\t{len(rows)}", file=sys.stderr)


if __name__ == "__main__":
    main()
