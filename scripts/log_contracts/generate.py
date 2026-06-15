#!/usr/bin/env python3
"""
Purpose:  Generate Client/Server log contract files from scripts/log_contracts/categories.yaml.
Called by: make log-contracts; scripts/log_contracts/verify.sh
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

SCRIPTS_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(SCRIPTS_DIR))

from log_contracts.schema import (
    DEFAULT_YAML_PATH,
    SERVER_CORE_CONFIG_KEYS,
    CategoryDef,
    boolean_keys,
    load_categories_yaml,
)

ROOT = Path(__file__).resolve().parent.parent.parent
YAML_PATH = DEFAULT_YAML_PATH

HEADER_TS = """// AUTO-GENERATED FILE - DO NOT EDIT DIRECTLY.
// Modify scripts/log_contracts/categories.yaml, then run: make log-contracts
"""

HEADER_PY = '''"""AUTO-GENERATED FILE - DO NOT EDIT DIRECTLY.

Modify scripts/log_contracts/categories.yaml, then run: make log-contracts
"""
'''

def write(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")
    print(f"  wrote {path.relative_to(ROOT)}")


def generate_categories_ts(
    always_enabled: list[str], categories: list[CategoryDef]
) -> str:
    cat_names = [c.name for c in categories]
    api_cat = next(c for c in categories if c.name == "API")
    api_sub_names = [s[0] for s in api_cat.subcategories]

    log_category_union = "\n  | ".join(f'"{n}"' for n in cat_names)
    api_sub_union = "\n  | ".join(f'"{n}"' for n in api_sub_names)

    log_categories_obj = "\n".join(
        f'  {c.name}: "{c.name}",' for c in categories
    )
    api_sub_obj = "\n".join(
        f'  {name}: "{name}",' for name in api_sub_names
    )

    category_mapping = "\n".join(
        f'    {c.name}: "{c.config_key}",' for c in categories
    )
    api_sub_mapping = "\n".join(
        f'    {name}: "{key}",' for name, key in api_cat.subcategories
    )

    log_path_literals: list[str] = []
    for cat in categories:
        log_path_literals.append(cat.name)
        for sub_name, _ in cat.subcategories:
            log_path_literals.append(f"{cat.name}.{sub_name}")
    log_path_union = "\n  | ".join(f'"{p}"' for p in log_path_literals)

    always_set = set(always_enabled)
    always_checks = " || ".join(f'category === "{name}"' for name in always_enabled)

    return f"""{HEADER_TS}
export type LogCategory =
  | {log_category_union};

export type ApiSubcategory =
  | {api_sub_union};

export type LogPath =
  | {log_path_union};

export const LOG_CATEGORIES = {{
{log_categories_obj}
}} as const;

export const API_SUBCATEGORIES = {{
{api_sub_obj}
}} as const;

export const LOG_PATHS = [
{chr(10).join(f'  "{p}",' for p in log_path_literals)}
] as const;

export function apiSubcategoryToConfigKey(subcategory: ApiSubcategory): string {{
  const mapping: Record<ApiSubcategory, string> = {{
{api_sub_mapping}
  }};
  return mapping[subcategory];
}}

export function categoryToConfigKey(category: LogCategory): string {{
  const mapping: Record<LogCategory, string> = {{
{category_mapping}
  }};
  return mapping[category];
}}

export function isAlwaysEnabled(category: LogCategory): boolean {{
  return {always_checks};
}}

export const ALWAYS_ENABLED_CATEGORIES: ReadonlySet<LogCategory> = new Set([
{chr(10).join(f'  "{name}",' for name in always_enabled)}
]);
"""


def generate_logger_contract_ts(categories: list[CategoryDef]) -> str:
    keys = boolean_keys(categories)
    keys_ts = ",\n  ".join(f'"{k}"' for k in keys)

    default_fields = []
    for cat in categories:
        if cat.name == "API":
            default_fields.append(
                "  api: isProd ? { ...PROD_API_CONFIG } : { ...DEFAULT_API_CONFIG },"
            )
            continue
        key = cat.config_key
        if cat.name in ("ERRORS", "SECURITY"):
            default_fields.append(f"  {key}: true,")
        else:
            default_fields.append(f"  {key}: isProd ? true : false,")

    return f"""{HEADER_TS}
import type {{ ApiSubcategoryConfig, LoggerConfig, LogLevel }} from "packages/logger/core/loggerTypes";

export const LOGGER_BOOLEAN_KEYS = [
  {keys_ts},
] as const;

export type LoggerBooleanKey = (typeof LOGGER_BOOLEAN_KEYS)[number];

const DEFAULT_API_CONFIG: ApiSubcategoryConfig = {{
  initialLoad: false,
  polling: false,
  pageMount: false,
  other: false,
}};

const PROD_API_CONFIG: ApiSubcategoryConfig = {{
  initialLoad: true,
  polling: true,
  pageMount: true,
  other: true,
}};

export function buildEnvironmentDefaults(isProd: boolean): LoggerConfig {{
  return {{
{chr(10).join(default_fields)}
    logLevel: (isProd ? "INFO" : "ERROR") as LogLevel,
  }};
}}

export function buildProductionApiConfig(): ApiSubcategoryConfig {{
  return {{ ...PROD_API_CONFIG }};
}}

export function buildDefaultApiConfig(): ApiSubcategoryConfig {{
  return {{ ...DEFAULT_API_CONFIG }};
}}

export const DEFAULT_API_CONFIG_EXPORT = DEFAULT_API_CONFIG;
"""


def generate_admin_keys_ts(categories: list[CategoryDef]) -> str:
    keys = boolean_keys(categories)
    frontend_keys = keys  # includes errors/security

    server_extra = [k for k in keys if k not in SERVER_CORE_CONFIG_KEYS]

    def fmt(keys_list: list[str]) -> str:
        return ",\n  ".join(f'"{k}"' for k in keys_list)

    return f"""{HEADER_TS}
export const FRONTEND_LOGGER_BOOLEAN_KEYS = [
  {fmt(frontend_keys)},
] as const;

export type FrontendLoggerBooleanKey = (typeof FRONTEND_LOGGER_BOOLEAN_KEYS)[number];

export const SERVER_CORE_LOGGER_BOOLEAN_KEYS = [
  {fmt(list(SERVER_CORE_CONFIG_KEYS))},
] as const;

export const SERVER_EXTRA_LOGGER_BOOLEAN_KEYS = [
  {fmt(server_extra)},
] as const;

export const API_SUBCATEGORY_CONFIG_KEYS = [
  "initialLoad",
  "polling",
  "pageMount",
  "other",
] as const;

export type ApiSubcategoryConfigKey = (typeof API_SUBCATEGORY_CONFIG_KEYS)[number];
"""


def generate_client_json(categories: list[CategoryDef]) -> dict:
    data: dict = {}
    for cat in categories:
        if cat.name == "API":
            data["api"] = {key: False for _, key in cat.subcategories}
        else:
            data[cat.config_key] = False
    data["logLevel"] = "ERROR"
    return data


def generate_server_json(categories: list[CategoryDef]) -> dict:
    data: dict = {}
    for cat in categories:
        data[cat.config_key] = False
    data["logLevel"] = "ERROR"
    return data


def generate_categories_py(always_enabled: list[str], categories: list[CategoryDef]) -> str:
    enum_members = "\n    ".join(f'{c.name} = "{c.name}"' for c in categories)
    log_categories_dict = "\n    ".join(
        f'"{c.name}": LogCategory.{c.name},' for c in categories
    )
    mapping = "\n        ".join(
        f"LogCategory.{c.name}: \"{c.config_key}\"," for c in categories
    )
    log_paths = []
    for cat in categories:
        log_paths.append(cat.name)
        for sub_name, _ in cat.subcategories:
            log_paths.append(f"{cat.name}.{sub_name}")

    always_tuple = ", ".join(f"LogCategory.{name}" for name in always_enabled)

    return f'''{HEADER_PY}
from enum import Enum

try:
    from enum import StrEnum
except ImportError:

    class StrEnum(str, Enum):  # noqa: UP042
        """StrEnum fallback for Python < 3.11."""

        pass


class LogCategory(StrEnum):
    """Log category enumeration matching frontend categories."""

    {enum_members}


LOG_CATEGORIES: dict[str, LogCategory] = {{
    {log_categories_dict}
}}

LOG_PATHS: tuple[str, ...] = (
    {", ".join(repr(p) for p in log_paths)},
)


def category_to_config_key(category: LogCategory) -> str:
    mapping: dict[LogCategory, str] = {{
        {mapping}
    }}
    return mapping[category]


def is_always_enabled(category: LogCategory) -> bool:
    return category in ({always_tuple})


ALWAYS_ENABLED_CATEGORIES: frozenset[LogCategory] = frozenset(
    ({always_tuple})
)
'''


def generate_logger_contract_py(categories: list[CategoryDef]) -> str:
    keys = boolean_keys(categories)
    keys_py = ",\n    ".join(f'"{k}"' for k in keys)

    fields = []
    for cat in categories:
        key = cat.config_key
        if cat.name in ("ERRORS", "SECURITY"):
            fields.append(f'        "{key}": True,')
        else:
            fields.append(f'        "{key}": bool_value,')
    fields.append('        "logLevel": "INFO" if is_prod else "ERROR",')

    return f'''{HEADER_PY}
from typing import Any

LOGGER_BOOLEAN_KEYS: tuple[str, ...] = (
    {keys_py},
)


def build_environment_defaults(is_prod: bool) -> dict[str, Any]:
    bool_value = is_prod
    return {{
{chr(10).join(fields)}
    }}
'''


def generate_config_model_py(categories: list[CategoryDef]) -> str:
    init_lines = []
    dict_lines = []
    for cat in categories:
        key = cat.config_key
        default = "True" if cat.name in ("ERRORS", "SECURITY") else "False"
        init_lines.append(f'        self.{key}: bool = config_dict.get("{key}", {default})')
        dict_lines.append(f'            "{key}": self.{key},')

    return f'''{HEADER_PY}
from typing import Any

LogLevel = str  # "DEBUG" | "INFO" | "WARN" | "ERROR"

LOG_LEVELS: dict[LogLevel, int] = {{
    "DEBUG": 0,
    "INFO": 1,
    "WARN": 2,
    "ERROR": 3,
}}


class LoggerConfig:
    """Logger configuration dataclass."""

    def __init__(self, config_dict: dict[str, Any]):
{chr(10).join(init_lines)}
        self.logLevel: LogLevel = config_dict.get("logLevel", "ERROR")

    def to_dict(self) -> dict[str, Any]:
        return {{
{chr(10).join(dict_lines)}
            "logLevel": self.logLevel,
        }}

    def update(self, updates: dict[str, Any]) -> None:
        for key, value in updates.items():
            if hasattr(self, key):
                setattr(self, key, value)
'''


def generate_allowed_keys_py(categories: list[CategoryDef]) -> str:
    keys = [c.config_key for c in categories] + ["logLevel"]
    keys_formatted = ",\n        ".join(f'"{k}"' for k in keys)
    return f'''{HEADER_PY}
ALLOWED_LOGGER_CONFIG_KEYS: frozenset[str] = frozenset(
    {{
        {keys_formatted},
    }}
)
'''


def generate_categories_shim_ts() -> str:
    return f"""{HEADER_TS}
export type {{
  ApiSubcategory,
  LogCategory,
  LogPath,
}} from "./categories.generated";
export {{
  API_SUBCATEGORIES,
  ALWAYS_ENABLED_CATEGORIES,
  LOG_CATEGORIES,
  LOG_PATHS,
  apiSubcategoryToConfigKey,
  categoryToConfigKey,
  isAlwaysEnabled,
}} from "./categories.generated";
"""


OPENAPI_LOGGER_DIR = ROOT / "openapi/components/schemas/shared/logger"

OPENAPI_HEADER = (
    "# AUTO-GENERATED FILE - DO NOT EDIT DIRECTLY.\n"
    "# Modify scripts/log_contracts/categories.yaml, then run: make log-contracts\n"
)


def _yaml_bool_prop(key: str, indent: int = 2) -> str:
    pad = " " * indent
    return f"{pad}{key}:\n{pad}  type: boolean\n"


def _all_config_keys(categories: list[CategoryDef]) -> list[str]:
    return [cat.config_key for cat in categories]


def generate_openapi_client_api_subcategory_yaml(categories: list[CategoryDef]) -> str:
    api_cat = next(c for c in categories if c.name == "API")
    required = [key for _, key in api_cat.subcategories]
    props = "".join(_yaml_bool_prop(key, 2) for key in required)
    req_block = "\n".join(f"  - {key}" for key in required)
    return f"""{OPENAPI_HEADER}type: object
required:
{req_block}
properties:
{props}"""


def generate_openapi_client_api_subcategory_patch_yaml(categories: list[CategoryDef]) -> str:
    api_cat = next(c for c in categories if c.name == "API")
    props = "".join(_yaml_bool_prop(key, 2) for _, key in api_cat.subcategories)
    return f"""{OPENAPI_HEADER}type: object
description: Partial API subcategory toggles for admin logger config updates.
properties:
{props}"""


def generate_openapi_client_logger_config_yaml(
    categories: list[CategoryDef], *, patch: bool
) -> str:
    keys = _all_config_keys(categories)
    props_lines: list[str] = []
    for cat in categories:
        key = cat.config_key
        if cat.name == "API":
            if patch:
                props_lines.append(
                    "  api:\n"
                    "    oneOf:\n"
                    "      - type: boolean\n"
                    "      - $ref: './ClientApiSubcategoryConfigPatch.yaml'\n"
                )
            else:
                props_lines.append(
                    "  api:\n"
                    "    oneOf:\n"
                    "      - type: boolean\n"
                    "      - $ref: './ClientApiSubcategoryConfig.yaml'\n"
                )
        else:
            props_lines.append(_yaml_bool_prop(key, 2).rstrip() + "\n")
    props_lines.append(
        "  logLevel:\n"
        "    type: string\n"
        "    enum: [DEBUG, INFO, WARN, ERROR]\n"
    )
    props = "".join(props_lines)

    if patch:
        return f"""{OPENAPI_HEADER}type: object
description: >
  Partial frontend logger config for admin updates. All fields optional; server deep-merges
  into stored deployment overrides.
additionalProperties: false
properties:
{props}"""

    required = "\n".join(f"  - {key}" for key in keys + ["logLevel"])
    return f"""{OPENAPI_HEADER}type: object
description: >
  Resolved frontend logger category toggles with nested API subcategories plus logLevel.
additionalProperties: false
required:
{required}
properties:
{props}"""


def generate_openapi_server_logger_config_yaml(
    categories: list[CategoryDef], *, patch: bool
) -> str:
    keys = _all_config_keys(categories)
    props = "".join(_yaml_bool_prop(key, 2) for key in keys)
    props += (
        "  logLevel:\n"
        "    type: string\n"
        "    enum: [DEBUG, INFO, WARN, ERROR]\n"
    )

    if patch:
        return f"""{OPENAPI_HEADER}type: object
description: >
  Partial server logger config for admin updates. All fields optional; server deep-merges
  into stored deployment overrides.
additionalProperties: false
properties:
{props}"""

    required = "\n".join(f"  - {key}" for key in keys + ["logLevel"])
    return f"""{OPENAPI_HEADER}type: object
description: >
  Resolved server logger category toggles plus logLevel.
additionalProperties: false
required:
{required}
properties:
{props}"""


def generate_openapi_deployment_logger_config_updates_yaml() -> str:
    return f"""{OPENAPI_HEADER}type: object
properties:
  client:
    $ref: './ClientLoggerConfigPatch.yaml'
  server:
    $ref: './ServerLoggerConfigPatch.yaml'
"""


def generate_admin_ui_meta_ts(
    always_enabled: list[str], categories: list[CategoryDef]
) -> str:
    always_set = set(always_enabled)
    core_names = ("POLLING", "PAGES", "HOOKS", "AUTH", "HTTP")
    core_keys = [c.config_key for c in categories if c.name in core_names]
    always_keys = [c.config_key for c in categories if c.name in always_set]
    feature_keys = [
        c.config_key
        for c in categories
        if c.name not in always_set
        and c.name != "API"
        and c.name not in core_names
    ]

    def fmt_keys(keys: list[str]) -> str:
        return ",\n  ".join(f'"{k}"' for k in keys)

    key_to_path = ",\n  ".join(f'  {c.config_key}: "{c.name}"' for c in categories)
    api_cat = next(c for c in categories if c.name == "API")
    api_sub_paths = ",\n  ".join(
        f'  {key}: "API.{name}"' for name, key in api_cat.subcategories
    )

    return f"""{HEADER_TS}
/** Admin Logging UI groups derived from categories.yaml (config key → log path label). */
export const LOGGER_CONFIG_KEY_TO_LOG_PATH: Record<string, string> = {{
{key_to_path}
}};

export const ADMIN_LOGGER_UI_GROUPS = {{
  core: {{
    title: "Core",
    keys: [
  {fmt_keys(core_keys)},
    ] as const,
  }},
  features: {{
    title: "Features",
    keys: [
  {fmt_keys(feature_keys)},
    ] as const,
  }},
  alwaysEnabled: {{
    title: "Always on",
    keys: [
  {fmt_keys(always_keys)},
    ] as const,
  }},
}} as const;

export type AdminLoggerUiGroupKey = keyof typeof ADMIN_LOGGER_UI_GROUPS;

export const API_SUBCATEGORY_CONFIG_KEY_TO_LOG_PATH: Record<string, string> = {{
{api_sub_paths}
}};
"""


def generate_categories_shim_py() -> str:
    return f'''{HEADER_PY}
from .categories_generated import (  # noqa: F401
    ALWAYS_ENABLED_CATEGORIES,
    LOG_CATEGORIES,
    LOG_PATHS,
    LogCategory,
    category_to_config_key,
    is_always_enabled,
)
'''


def main() -> int:
    if not YAML_PATH.is_file():
        print(f"error: missing {YAML_PATH}", file=sys.stderr)
        return 1

    always_enabled, categories = load_categories_yaml(YAML_PATH)
    print("Generating log contracts from categories.yaml...")

    write(
        ROOT / "Client/packages/logger/core/categories.generated.ts",
        generate_categories_ts(always_enabled, categories),
    )
    write(ROOT / "Client/packages/logger/core/categories.ts", generate_categories_shim_ts())
    write(
        ROOT / "Client/packages/logger/config/loggerContract.generated.ts",
        generate_logger_contract_ts(categories),
    )
    write(
        ROOT / "Client/packages/logger/config/adminLoggerKeys.generated.ts",
        generate_admin_keys_ts(categories),
    )

    write(
        ROOT / "Server/logger/core/categories_generated.py",
        generate_categories_py(always_enabled, categories),
    )
    write(ROOT / "Server/logger/core/categories.py", generate_categories_shim_py())
    write(
        ROOT / "Server/logger/config/logger_contract_generated.py",
        generate_logger_contract_py(categories),
    )
    write(ROOT / "Server/logger/config/config_model.py", generate_config_model_py(categories))
    write(
        ROOT / "Server/logger/config/allowed_logger_config_keys_generated.py",
        generate_allowed_keys_py(categories),
    )
    write(
        ROOT / "Client/packages/logger/config/adminLoggerUiMeta.generated.ts",
        generate_admin_ui_meta_ts(always_enabled, categories),
    )

    openapi_dir = OPENAPI_LOGGER_DIR
    write(
        openapi_dir / "ClientApiSubcategoryConfig.yaml",
        generate_openapi_client_api_subcategory_yaml(categories),
    )
    write(
        openapi_dir / "ClientApiSubcategoryConfigPatch.yaml",
        generate_openapi_client_api_subcategory_patch_yaml(categories),
    )
    write(
        openapi_dir / "ClientLoggerConfig.yaml",
        generate_openapi_client_logger_config_yaml(categories, patch=False),
    )
    write(
        openapi_dir / "ClientLoggerConfigPatch.yaml",
        generate_openapi_client_logger_config_yaml(categories, patch=True),
    )
    write(
        openapi_dir / "ServerLoggerConfig.yaml",
        generate_openapi_server_logger_config_yaml(categories, patch=False),
    )
    write(
        openapi_dir / "ServerLoggerConfigPatch.yaml",
        generate_openapi_server_logger_config_yaml(categories, patch=True),
    )
    write(
        openapi_dir / "DeploymentLoggerConfigUpdates.yaml",
        generate_openapi_deployment_logger_config_updates_yaml(),
    )

    print("Done.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
