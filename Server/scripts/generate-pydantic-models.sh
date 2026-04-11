#!/usr/bin/env bash
set -euo pipefail

# Activate virtual environment if it exists
if [ -d ".venv" ]; then
    source .venv/bin/activate
fi

# Install datamodel-code-generator if needed
pip install datamodel-code-generator

# Generate Pydantic models from OpenAPI using Python module
# Note: Removed --use-union-operator to avoid Field() + union operator bug
python -m datamodel_code_generator \
  --input ../openapi/openapi.yaml \
  --output app/schemas/generated.py \
  --output-model-type pydantic_v2.BaseModel \
  --use-standard-collections \
  --use-schema-description \
  --target-python-version 3.10 \
  --collapse-root-models \
  --use-default

echo "✅ Pydantic models generated at Server/app/schemas/generated.py"
echo "🚨 DO NOT EDIT generated.py MANUALLY - regenerate from openapi/openapi.yaml"
