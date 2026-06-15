#!/usr/bin/env bash
set -euo pipefail

# Activate virtual environment if it exists
if [ -d ".venv" ]; then
    source .venv/bin/activate
fi

# Install generators + Ruff (Ruff applies UP007: Optional/Union -> X | Y after codegen)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
QUIET="${OPENAPI_SYNC_QUIET:-0}"
if [[ "$QUIET" == "1" ]]; then
  pip install -q -r "${SCRIPT_DIR}/../requirements/codegen.txt"
else
  pip install -r "${SCRIPT_DIR}/../requirements/codegen.txt"
fi

# Generate Pydantic models from OpenAPI using Python module
# Note: Removed --use-union-operator from codegen; Ruff post-process matches pyproject UP rules.
CODEGEN_ARGS=(
  --input ../openapi/openapi.yaml
  --input-file-type openapi
  --output app/schemas/generated.py
  --output-model-type pydantic_v2.BaseModel
  --use-standard-collections
  --use-schema-description
  --target-python-version 3.10
  --collapse-root-models
  --use-default
  --disable-timestamp
)
if [[ "$QUIET" == "1" ]]; then
  python -W "ignore::DeprecationWarning" -W "ignore::FutureWarning" -m datamodel_code_generator "${CODEGEN_ARGS[@]}" >/dev/null
else
  python -m datamodel_code_generator "${CODEGEN_ARGS[@]}"
fi

ruff check app/schemas/generated.py --fix --unsafe-fixes --quiet
ruff format app/schemas/generated.py --quiet

if [[ "$QUIET" != "1" ]]; then
  echo "✅ Pydantic models generated at Server/app/schemas/generated.py"
  echo "🚨 DO NOT EDIT generated.py MANUALLY - regenerate from openapi/openapi.yaml"
fi
