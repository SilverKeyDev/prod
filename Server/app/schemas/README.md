# Pydantic validation schemas

Runtime request/response models generated from **`openapi/`**. Production routes use `@validate_request` / `@validate_response` with these types.

## Files

| File | Notes |
| ---- | ----- |
| `generated.py` | **Auto-generated** — `make openapi` / `Server/scripts/generate-pydantic-models.sh` |
| Hand-maintained modules | Domain-specific additions alongside generated exports |

**Do not edit `generated.py` by hand.**

## Usage (summary)

```python
from app.schemas import CreateTodoRequest, TodoItem

data = CreateTodoRequest(**request.json)   # raises ValidationError if invalid
return TodoItem(**todo.to_dict()).model_dump()
```

**Layers:** Request JSON → Pydantic → SQLAlchemy → DB → `to_dict()` → Pydantic → response JSON.

## Workflow

1. Change schemas in **`openapi/`** (repo root).
2. `make openapi` (or `bash Server/scripts/generate-pydantic-models.sh`).
3. Import from `app.schemas` in routes/services.

## Further reading

- [documentation/server/openapi-workflow.md](../../../../documentation/server/openapi-workflow.md)
- [openapi-workflow.mdc](../../../../.cursor/rules/shared/openapi-workflow.mdc)
- [Server/app/models/](../models/) — SQLAlchemy ORM
- [openapi.yaml](../../../../openapi.yaml) — schema source of truth
