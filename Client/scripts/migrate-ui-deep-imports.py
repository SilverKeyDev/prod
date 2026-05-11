#!/usr/bin/env python3
"""Migrate packages/ui/components/{button,form}/ deep imports to the packages/ui barrel."""

from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]  # Client/

STRING_SUBSTS: list[tuple[str, str]] = [
    # Longest / most specific first
    (
        'import Dropdown, { type DropdownOption } from "packages/ui/components/form/dropdown";',
        'import { Dropdown, type DropdownOption } from "packages/ui";',
    ),
    (
        "import Dropdown, { type DropdownOption } from 'packages/ui/components/form/dropdown';",
        "import { Dropdown, type DropdownOption } from 'packages/ui';",
    ),
    (
        'import FormField, { Textarea } from "packages/ui/components/form/FormField";',
        'import { FormField, Textarea } from "packages/ui";',
    ),
    (
        'import { GooglePlacesAutocompleteField } from "packages/ui/components/form/GooglePlacesAutocompleteField";',
        'import { GooglePlacesAutocompleteField } from "packages/ui";',
    ),
    (
        'import type { AddressData } from "packages/ui/components/form/AddressInput";',
        'import type { AddressData } from "packages/ui";',
    ),
    (
        'import { AddressInput } from "packages/ui/components/form/AddressInput";',
        'import { AddressInput } from "packages/ui";',
    ),
    (
        'import type { AddressData } from "packages/ui/components/form/AddressInput/AddressInput";',
        'import type { AddressData } from "packages/ui";',
    ),
    (
        'import { AddressInput } from "packages/ui/components/form/AddressInput/AddressInput";',
        'import { AddressInput } from "packages/ui";',
    ),
    (
        'import { LOCATION_INPUT_CONTAINER } from "packages/ui/components/form/fileUploadStyles";',
        'import { LOCATION_INPUT_CONTAINER } from "packages/ui";',
    ),
    (
        'import { DROP_ZONE_BORDER_BASE } from "packages/ui/components/form/fileUploadStyles";',
        'import { DROP_ZONE_BORDER_BASE } from "packages/ui";',
    ),
    (
        'import type { ChecklistItem } from "packages/ui/components/form/checkbox/ChecklistCheckbox";',
        'import type { ChecklistItem } from "packages/ui";',
    ),
]

# Regex line replacements (full line)
LINE_RES: list[tuple[str, str]] = [
    (
        r"^import\s+AccessibleRadioInput\s+from\s+[\"']packages/ui/components/form/AccessibleRadioInput[\"'];?\s*$",
        'import { AccessibleRadioInput } from "packages/ui";',
    ),
    (
        r"^import\s+AccessibleCheckboxInput\s+from\s+[\"']packages/ui/components/form/checkbox/AccessibleCheckboxInput[\"'];?\s*$",
        'import { AccessibleCheckboxInput } from "packages/ui";',
    ),
    (
        r"^import\s+Button\s+from\s+[\"']packages/ui/components/button/Button[\"'];?\s*$",
        'import { Button } from "packages/ui";',
    ),
    (
        r"^import\s+CancelButton\s+from\s+[\"']packages/ui/components/button/CancelButton[\"'];?\s*$",
        'import { CancelButton } from "packages/ui";',
    ),
    (
        r"^import\s+CloseButton\s+from\s+[\"']packages/ui/components/button/CloseButton[\"'];?\s*$",
        'import { CloseButton } from "packages/ui";',
    ),
    (
        r"^import\s+IconButton\s+from\s+[\"']packages/ui/components/button/IconButton[\"'];?\s*$",
        'import { IconButton } from "packages/ui";',
    ),
    (
        r"^import\s+ClientSelector\s+from\s+[\"']packages/ui/components/button/ClientSelector[\"'];?\s*$",
        'import { ClientSelector } from "packages/ui";',
    ),
    (
        r"^import\s+Dropdown\s+from\s+[\"']packages/ui/components/form/dropdown[\"'];?\s*$",
        'import { Dropdown } from "packages/ui";',
    ),
    (
        r"^import\s+ChecklistCheckbox\s+from\s+[\"']packages/ui/components/form/ChecklistCheckbox[\"'];?\s*$",
        'import { ChecklistCheckbox } from "packages/ui";',
    ),
    (
        r"^import\s+Input\s+from\s+[\"']packages/ui/components/form/Input[\"'];?\s*$",
        'import { Input } from "packages/ui";',
    ),
    (
        r"^import\s+\{\s*Input\s*\}\s+from\s+[\"']packages/ui/components/form/Input[\"'];?\s*$",
        'import { Input } from "packages/ui";',
    ),
    (
        r"^import\s+OliveCheckbox\s+from\s+[\"']packages/ui/components/form/OliveCheckbox[\"'];?\s*$",
        'import { OliveCheckbox } from "packages/ui";',
    ),
    (
        r"^import\s+RangeInput\s+from\s+[\"']packages/ui/components/form/RangeInput[\"'];?\s*$",
        'import { RangeInput } from "packages/ui";',
    ),
    (
        r"^import\s+\{\s*Textarea\s*\}\s+from\s+[\"']packages/ui/components/form/FormField[\"'];?\s*$",
        'import { Textarea } from "packages/ui";',
    ),
    (
        r"^import\s+\{\s*OliveCheckboxRowLabel\s*\}\s+from\s+[\"']packages/ui/components/form/checkbox/OliveCheckboxRowLabel[\"'];?\s*$",
        'import { OliveCheckboxRowLabel } from "packages/ui";',
    ),
    (
        r"^import\s+\{\s*ConnectedCardHeartSave\s*\}\s+from\s+[\"']packages/ui/components/button/ConnectedCardHeartSave[\"'];?\s*$",
        'import { ConnectedCardHeartSave } from "packages/ui";',
    ),
]


def merge_ui_imports(text: str) -> str:
    """Merge adjacent import { a } from 'packages/ui' and import { b } from 'packages/ui'."""
    changed = True
    while changed:
        changed = False
        lines = text.splitlines(keepends=True)
        out: list[str] = []
        i = 0
        merge_re = re.compile(
            r"^import\s+\{([^}]+)\}\s+from\s+[\"']packages/ui[\"'];?\s*$"
        )
        while i < len(lines):
            line = lines[i]
            m = merge_re.match(line.strip())
            if m and out:
                pm = merge_re.match(out[-1].strip())
                if pm:
                    parts_new = [p.strip() for p in m.group(1).split(",") if p.strip()]
                    parts_prev = [p.strip() for p in pm.group(1).split(",") if p.strip()]
                    merged = ", ".join(dict.fromkeys([*parts_prev, *parts_new]))
                    out[-1] = f'import {{ {merged} }} from "packages/ui";\n'
                    i += 1
                    changed = True
                    continue
            out.append(line)
            i += 1
        text = "".join(out)
    return text


def process(text: str) -> str:
    for old, new in STRING_SUBSTS:
        text = text.replace(old, new)
    for pat, repl in LINE_RES:
        text = re.sub(pat, repl, text, flags=re.MULTILINE)
    text = merge_ui_imports(text)
    return text


def main() -> int:
    exts = {".ts", ".tsx"}
    changed_n = 0
    for path in sorted(ROOT.rglob("*")):
        if path.suffix not in exts:
            continue
        if "node_modules" in path.parts:
            continue
        txt = path.read_text(encoding="utf-8")
        if "packages/ui/components/button/" not in txt and "packages/ui/components/form/" not in txt:
            continue
        new_txt = process(txt)
        if new_txt != txt:
            path.write_text(new_txt, encoding="utf-8")
            changed_n += 1
            print(path.relative_to(ROOT.parent))
    print(f"Updated {changed_n} files", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
