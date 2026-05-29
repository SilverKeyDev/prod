# DTO layer (ORM → OpenAPI)

DTOs convert SQLAlchemy models into Pydantic models generated from `openapi/openapi.yaml` (`app.schemas.generated`). That keeps HTTP responses aligned with the documented contract and surfaces drift at runtime when `@validate_response` is enabled.

## When to use DTOs

- **Returning JSON from route handlers** that have (or should have) an OpenAPI response schema.
- **Any replacement for `model.to_dict()`** on critical entities (`User`, saved homes, agreements, documents, todos).

Prefer DTO entry points (`UserDTO.to_response`, `SavedHomeDTO.from_orm`, etc.) so payloads are validated against `app.schemas.generated` before they reach `jsonify`.

## Pattern

```python
from app.dtos.user import UserDTO
from app.schemas import UserResponse
from app.utils.validation import validate_response

@validate_response(UserResponse)
def get_me(user):
    user_data = UserDTO.to_response(user, include_roles=True, presign_profile_pic=True)
    return jsonify({"success": True, "data": user_data})
```

For list-style user payloads without roles or presigned URLs, use `UserDTO.to_list_response(user)`. For favorites rows, use `SavedHomeDTO.from_orm(home).model_dump(mode="json")` or the compatibility wrapper `PropertyDTO.to_saved_home(home)`.

## `to_dict()` on models

Legacy `to_dict()` methods remain for incremental migration but emit `DeprecationWarning`. New code should go through DTOs.

## Modules

| Module               | ORM model         | OpenAPI schema                    |
|----------------------|-------------------|-----------------------------------|
| `dtos/user.py`       | `User`            | `User` / `UserProfile`            |
| `dtos/saved_home.py` | `PropertyCache` + `UserPropertyLink` | `SavedHome`                       |
| `dtos/property.py`   | (alias)           | Same as `SavedHomeDTO` (compat)   |
| `dtos/agreement.py`  | `Agreement` (+ nested) | `Agreement`                |
| `dtos/document.py`   | `Document`        | `WorkflowDocumentRecord`          |
| `dtos/todo.py`       | `Todo`            | `TodoItem`                        |
| `dtos/agent_conversation.py` | `AgentConnections` | (conversation metadata dict) |

`WorkflowDocumentDTO.from_document` maps pipeline `Document` rows to `WorkflowDocumentRecord` using defaults for fields not stored on the table; pass `overrides=` for offer id, expiry, etc., when assembling dashboard payloads.
