# Persona: openapi-contract

**Scope:** `openapi/` + generated types

## Do

1. Edit **`openapi/`** sources only — never hand-edit generated files.
2. `make openapi` then `make openapi-verify`.
3. Run contract tests if HTTP shapes changed: `Server/tests/contract/test_openapi_contracts.py`.

## Paths

- `openapi/**/*.yaml`
- Regenerates: `Client/packages/types/api.generated.ts`, `Server/app/schemas/generated.py`

## Do not

- Ship OpenAPI drift (verify must pass before done).

## Memory

Note spec files touched and whether client/server types regenerated in **Run log**.
