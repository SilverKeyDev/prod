# Known Issues with Pydantic Schema Generation

## Issue: Circular Reference Initialization Error

**Status**: Known issue with `datamodel-code-generator` 0.25.0 and complex OpenAPI schemas

**Symptoms**:
- Generated `schemas/generated.py` file causes `RecursionError` or infinite loop during import
- Error occurs in `CodeDelivery` class initialization (line 64)
- Pydantic's internal `__repr__` gets stuck in circular reference loop

**Root Cause**:
The OpenAPI specification contains circular schema references that `datamodel-code-generator` 0.25.0 doesn't handle correctly. The generated Pydantic v2 models don't include `model_rebuild()` calls or `defer_build=True` configurations needed to break the circular dependency during initialization.

**Workarounds**:

### Option 1: Use datamodel-code-generator 0.26+ (when available)
```bash
pip install 'datamodel-code-generator>=0.26'
bash scripts/generate-pydantic-models.sh
```

### Option 2: Manually add model_rebuild() calls
Add at the end of `schemas/generated.py`:
```python
# Rebuild models to resolve forward references
CodeDelivery.model_rebuild()
AuthResponse.model_rebuild()
# ... (add for all models with forward refs)
```

### Option 3: Simplify OpenAPI circular references
Review `openapi.yaml` and break circular dependencies by using `$ref` more strategically or flattening nested schemas.

### Option 4: Generate per-domain schemas
Instead of generating all schemas at once, generate them in batches by domain to reduce circular reference complexity.

## Impact

- **SQLAlchemy models**: ✅ **NOT AFFECTED** - All 42 models successfully migrated to `Mapped[]` type hints
- **Backend API**: ✅ **NOT AFFECTED** - Continues to use SQLAlchemy models for database operations
- **Request validation**: ⚠️ **AFFECTED** - Cannot import Pydantic schemas for runtime validation until fixed
- **TypeScript types**: ✅ **NOT AFFECTED** - Frontend uses `openapi-typescript` which works correctly

## Recommended Next Steps

1. **Short term**: Use SQLAlchemy models for database operations (already working)
2. **Medium term**: Try upgrading `datamodel-code-generator` to latest version
3. **Long term**: Review and simplify OpenAPI schema circular dependencies

## Related Files

- Generation script: `Server/scripts/generate-pydantic-models.sh`
- Generated output: `Server/app/schemas/generated.py`
- OpenAPI spec: `openapi.yaml` (repo root)
