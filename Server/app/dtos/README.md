# DTO layer (ORM → OpenAPI)

DTOs convert SQLAlchemy models into Pydantic models generated from `openapi/openapi.yaml` (`app.schemas.generated`). That keeps HTTP responses aligned with the documented contract and surfaces drift at runtime when `@validate_response` is enabled.

## When to use DTOs

- **Returning JSON from route handlers** that have (or should have) an OpenAPI response schema.
- **Any replacement for `model.to_dict()`** on critical entities (`User`, saved homes, agreements, documents, todos).

Prefer DTO entry points (`UserDTO.to_response`, `SavedHomeDTO.from_orm`, `NotInterestedHomeDTO.to_response`, etc.) so payloads are validated against `app.schemas.generated` before they reach `jsonify`.

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

For list-style user payloads without roles or presigned URLs, use `UserDTO.to_list_response(user)`.

### Saved homes (favorites / listings)

- `SavedHomeDTO.from_orm(link)` — loads `PropertyCache` from `UserPropertyLink` and validates as `SavedHome`.
- `SavedHomeDTO.to_response(link)` — same, returns `model_dump(mode="json")` for `jsonify`.
- Compatibility: `PropertyDTO.to_saved_home(link)` delegates to `SavedHomeDTO`.

### Not-interested homes

- **HTTP:** `NotInterestedHomeDTO.to_response(row)` — only documented `NotInterestedHomeItem` fields (`id`, `address`, `latitude`, `longitude`, `zpid`, `mls_home_id`).
- **GDPR export:** `NotInterestedHomeDTO.to_export_row(row)` — full portability fields (`why`, `not_interested_history`, timestamps, etc.); not constrained to `NotInterestedHomeItem`.

## `to_dict()` on models

ORM models no longer define `to_dict()`. Use the DTO modules below.

## Modules

| Module               | ORM model         | OpenAPI schema                    |
|----------------------|-------------------|-----------------------------------|
| `dtos/user.py`       | `User`            | `User` / `UserProfile`            |
| `dtos/saved_home.py` | `PropertyCache` + `UserPropertyLink`; `HomeNotInterested` | `SavedHome`; `NotInterestedHomeItem` |
| `dtos/property.py`   | (alias)           | Same as `SavedHomeDTO` (compat)   |
| `dtos/agreement.py`  | `Agreement` (+ nested) | `Agreement`                |
| `dtos/checklist_form.py` | `ChecklistForm`   | `ChecklistForm` / `ChecklistFormWithDownload` |
| `dtos/docusign_template.py` | `DocusignTemplate` | `DocusignTemplateListItem` |
| `dtos/document.py`   | `Document`        | `WorkflowDocumentRecord`          |
| `dtos/todo.py`       | `Todo`            | `TodoItem`                        |
| `dtos/agent_conversation.py` | `AgentConnections` | (conversation metadata dict) |
| `dtos/agent_connection_request.py` | `AgentConnectionRequest` | `AgentConnectionRequest` |
| `dtos/partner.py`    | `Partner`, `BuyerStepView`, `RevShareLinkClick` | `Partner`, `BuyerStepView`, `RevShareRecentClick` |
| `dtos/google_oauth_token.py` | `GoogleOAuthToken` | (internal credentials only; not in OpenAPI) |
| `dtos/calendar_event.py` | `CalendarEvent` | `GoogleEvent` |

`WorkflowDocumentDTO.from_document` maps pipeline `Document` rows to `WorkflowDocumentRecord` using defaults for fields not stored on the table; pass `overrides=` for offer id, expiry, etc., when assembling dashboard payloads.

`GoogleOAuthTokenDTO.to_credentials` is for calendar token storage only — never return through HTTP.
