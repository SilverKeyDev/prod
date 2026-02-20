"""
Flexible environment variable validator that auto-detects API keys and critical variables.
"""

import os
import re
from dataclasses import dataclass
from typing import Any


@dataclass
class EnvVarInfo:
    """Information about an environment variable."""

    name: str
    value: str | None
    is_sensitive: bool
    is_critical: bool
    category: str


class FlexibleEnvValidator:
    """
    Flexible environment validator that automatically detects API keys and critical variables
    without requiring manual configuration updates.
    """

    # Patterns that indicate sensitive/API key variables
    SENSITIVE_PATTERNS = [
        r".*API[_-]?KEY.*",
        r".*SECRET.*",
        r".*TOKEN.*",
        r".*PASSWORD.*",
        r".*PRIVATE[_-]?KEY.*",
        r".*ACCESS[_-]?KEY.*",
        r".*AUTH.*",
        r".*CREDENTIAL.*",
        r".*JWT.*",
    ]

    # Patterns that indicate critical variables (app won't work without them)
    CRITICAL_PATTERNS = [
        r".*DATABASE[_-]?URL.*",
        r".*DB[_-]?URL.*",
        r".*SECRET[_-]?KEY.*",
        r".*JWT[_-]?SECRET.*",
        r".*API[_-]?KEY.*",
        r".*COGNITO.*",
        r".*AWS.*",
    ]

    # Known variable categories for better organization
    CATEGORY_PATTERNS = {
        "Database": [r".*DATABASE.*", r".*DB[_-]?URL.*", r".*POSTGRES.*", r".*MYSQL.*"],
        "Authentication": [r".*JWT.*", r".*SECRET[_-]?KEY.*", r".*COGNITO.*", r".*AUTH.*"],
        "AWS Services": [r".*AWS.*", r".*S3.*", r".*BUCKET.*"],
        "External APIs": [
            r".*API[_-]?KEY.*",
            r".*RAPIDAPI.*",
            r".*GOOGLE.*",
            r".*PERPLEXITY.*",
            r".*CENSUS.*",
        ],
        "Background Tasks": [r".*CELERY.*", r".*REDIS.*", r".*BROKER.*"],
        "Application": [r".*FLASK.*", r".*DEBUG.*", r".*ENV.*", r".*PORT.*"],
        "Frontend": [r".*FRONTEND.*", r".*CORS.*", r".*URL.*"],
    }

    @classmethod
    def scan_environment(cls) -> dict[str, EnvVarInfo]:
        """
        Scan all environment variables and categorize them.

        Returns:
            Dictionary mapping variable names to EnvVarInfo objects
        """
        env_vars = {}

        for name, value in os.environ.items():
            # Skip system variables that aren't relevant to the app
            if cls._is_system_variable(name):
                continue

            is_sensitive = cls._is_sensitive(name)
            is_critical = cls._is_critical(name)
            category = cls._get_category(name)

            env_vars[name] = EnvVarInfo(
                name=name,
                value=value if value else None,
                is_sensitive=is_sensitive,
                is_critical=is_critical,
                category=category,
            )

        return env_vars

    @classmethod
    def _is_system_variable(cls, name: str) -> bool:
        """Check if this is a system variable we should ignore."""
        system_prefixes = [
            "PATH",
            "HOME",
            "USER",
            "SHELL",
            "TERM",
            "LANG",
            "LC_",
            "XDG_",
            "DISPLAY",
            "SSH_",
            "TMPDIR",
            "PWD",
            "OLDPWD",
            "CONDA_",
            "VIRTUAL_ENV",
            "PYTHONPATH",
            "PIP_",
            "npm_",
            "NODE_",
            "VSCODE_",
            "EDITOR",
            "PAGER",
        ]

        return any(name.startswith(prefix) for prefix in system_prefixes)

    @classmethod
    def _is_sensitive(cls, name: str) -> bool:
        """Check if variable name indicates sensitive data."""
        return any(re.match(pattern, name, re.IGNORECASE) for pattern in cls.SENSITIVE_PATTERNS)

    @classmethod
    def _is_critical(cls, name: str) -> bool:
        """Check if variable name indicates critical application data."""
        return any(re.match(pattern, name, re.IGNORECASE) for pattern in cls.CRITICAL_PATTERNS)

    @classmethod
    def _get_category(cls, name: str) -> str:
        """Determine the category of an environment variable."""
        for category, patterns in cls.CATEGORY_PATTERNS.items():
            if any(re.match(pattern, name, re.IGNORECASE) for pattern in patterns):
                return category
        return "Other"

    @classmethod
    def validate_critical_variables(cls, raise_on_missing: bool = False) -> dict[str, Any]:
        """
        Validate that all critical environment variables are set.

        Args:
            raise_on_missing: Whether to raise exception on missing critical variables

        Returns:
            Dictionary with validation results
        """
        env_vars = cls.scan_environment()

        critical_vars = {name: info for name, info in env_vars.items() if info.is_critical}
        missing_critical = [name for name, info in critical_vars.items() if not info.value]

        results = {
            "valid": len(missing_critical) == 0,
            "total_variables": len(env_vars),
            "critical_variables": len(critical_vars),
            "missing_critical": missing_critical,
            "sensitive_count": len([v for v in env_vars.values() if v.is_sensitive]),
            "categories": cls._group_by_category(env_vars),
        }

        if missing_critical and raise_on_missing:
            raise ValueError(
                f"Missing critical environment variables: {', '.join(missing_critical)}"
            )

        return results

    @classmethod
    def _group_by_category(cls, env_vars: dict[str, EnvVarInfo]) -> dict[str, list[str]]:
        """Group environment variables by category."""
        categories = {}
        for name, info in env_vars.items():
            if info.category not in categories:
                categories[info.category] = []
            categories[info.category].append(name)
        return categories

    @classmethod
    def get_env_var(
        cls, name: str, default: str | None = None, required: bool = False
    ) -> str | None:
        """
        Safely get environment variable with validation.

        Args:
            name: Environment variable name
            default: Default value if not found
            required: Whether the variable is required

        Returns:
            Environment variable value or default

        Raises:
            ValueError: If required variable is missing
        """
        value = os.getenv(name, default)

        if required and not value:
            raise ValueError(f"Required environment variable {name} is not set")

        return value

    @classmethod
    def validate_startup(cls):
        """
        Validate environment at application startup.
        Should be called early in application initialization.
        """
        try:
            results = cls.validate_critical_variables(raise_on_missing=False)
            return results

        except Exception as e:
            raise ValueError(f"Environment validation failed: {str(e)}") from e

    @classmethod
    def check_api_keys(cls) -> dict[str, bool]:
        """
        Check status of all detected API keys.

        Returns:
            Dictionary mapping API key names to their availability status
        """
        env_vars = cls.scan_environment()
        api_keys = {}

        for name, info in env_vars.items():
            if "API" in name.upper() and "KEY" in name.upper():
                api_keys[name] = bool(info.value)

        return api_keys

    @classmethod
    def generate_env_template(cls) -> str:
        """
        Generate a .env template based on detected patterns.

        Returns:
            Template content as string
        """
        env_vars = cls.scan_environment()
        categories = cls._group_by_category(env_vars)

        template_lines = [
            "# SilverKey Environment Configuration",
            "# Auto-generated template based on detected variables",
            "# Copy this file to .env and fill in the actual values",
            "# DO NOT commit .env files to version control",
            "",
        ]

        for category, var_names in categories.items():
            if var_names:
                template_lines.append(f"# {category}")

                for var_name in sorted(var_names):
                    env_info = cls.scan_environment()[var_name]

                    if env_info.is_sensitive:
                        template_lines.append(f"{var_name}=your_{var_name.lower()}_here")
                    else:
                        current_value = env_info.value or ""
                        template_lines.append(f"{var_name}={current_value}")

                    if env_info.is_critical:
                        template_lines.append(
                            f"# ⚠️ CRITICAL: {var_name} is required for application to function"
                        )

                    template_lines.append("")

        return "\n".join(template_lines)


# Convenience functions for easy import
def validate_environment():
    """Validate environment variables at startup."""
    return FlexibleEnvValidator.validate_startup()


def get_env_var(name: str, default: str | None = None, required: bool = False) -> str | None:
    """Get environment variable safely."""
    return FlexibleEnvValidator.get_env_var(name, default, required)


def check_api_keys() -> dict[str, bool]:
    """Check status of all API keys."""
    return FlexibleEnvValidator.check_api_keys()
