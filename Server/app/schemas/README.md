# Pydantic Validation Schemas

Auto-generated Pydantic models from `openapi.yaml` for runtime request/response validation.

## Overview

This package contains Pydantic v2 models that match the OpenAPI specification at the repo root. These models provide:

- Runtime validation for API requests/responses
- Type-safe contract between Flask routes and OpenAPI spec
- Auto-completion in IDEs for request/response shapes
- Prevention of client/server drift

## Usage

### Basic Import

```python
from app.schemas import TodoItem, CreateTodoRequest, GetTodosResponse
```

### Validating Requests

```python
from app.schemas import CreateTodoRequest
from flask import request

@app.route("/api/v1/agent/todos", methods=["POST"])
def create_todo():
    # Validate request with Pydantic (raises ValidationError if invalid)
    data = CreateTodoRequest(**request.json)

    # data.title, data.description, data.type are now validated
    # and have proper types
    ...
```

### Validating Responses

```python
from app.schemas import TodoItem
from app.models import Todo

@app.route("/api/v1/agent/todos/<todo_id>")
def get_todo(todo_id):
    todo = Todo.query.get_or_404(todo_id)

    # Validate response with Pydantic
    response = TodoItem(**todo.to_dict())

    # Return validated JSON
    return response.model_dump()
```

### Full Example: Create Todo Endpoint

```python
from app.schemas import CreateTodoRequest, CreateTodoResponse, TodoItem
from app.models import Todo
from flask import request, jsonify
from pydantic import ValidationError

@app.route("/api/v1/agent/todos", methods=["POST"])
def create_todo():
    try:
        # 1. Validate request with Pydantic
        data = CreateTodoRequest(**request.json)

        # 2. Create SQLAlchemy model
        todo = Todo(
            agent_id=current_user.id,
            title=data.title,
            description=data.description,
            type=data.type,
            due_date=data.due_date,
            priority=data.priority
        )
        db.session.add(todo)
        db.session.commit()

        # 3. Return validated response
        todo_item = TodoItem(**todo.to_dict())
        response = CreateTodoResponse(
            success=True,
            todo=todo_item
        )
        return response.model_dump()

    except ValidationError as e:
        return jsonify({
            "success": False,
            "error": "Validation error",
            "details": e.errors()
        }), 400
```

## Relationship to SQLAlchemy Models

- **SQLAlchemy models** (`app.models.*`) - Database ORM layer
- **Pydantic schemas** (`app.schemas.*`) - API validation layer

```
Request JSON → Pydantic validation → SQLAlchemy model → Database
Database → SQLAlchemy model → to_dict() → Pydantic validation → Response JSON
```

The models serve different purposes:
- SQLAlchemy: Database persistence, relationships, queries
- Pydantic: API contracts, runtime validation, type safety

## Regenerating Models

When the OpenAPI spec changes:

```bash
cd Server
bash scripts/generate-pydantic-models.sh
```

This regenerates `app/schemas/generated.py` from `openapi.yaml`.

**DO NOT** edit `generated.py` manually - changes will be overwritten.

## Adding New Schemas

1. Edit `openapi.yaml` (repo root):
   ```yaml
   components:
     schemas:
       MyNewSchema:
         type: object
         required:
           - field1
         properties:
           field1:
             type: string
           field2:
             type: integer
             nullable: true
   ```

2. Regenerate:
   ```bash
   cd Server
   bash scripts/generate-pydantic-models.sh
   ```

3. Use in code:
   ```python
   from app.schemas import MyNewSchema

   data = MyNewSchema(field1="test", field2=None)
   ```

## Available Schemas

All schemas from `openapi.yaml` are available, organized by domain:

### Common
- `SuccessResponse`, `ErrorResponse`, `PaginatedResponse`

### Auth & User
- `User`, `UserProfile`, `UserResponse`
- `AuthResponse`, `LoginData`, `SignupData`
- `SavedHome`, `FavoriteHomesResponse`

### Agent
- `TodoItem`, `CreateTodoRequest`, `UpdateTodoRequest`, `GetTodosResponse`
- `AgentClient`, `AgentConversation`, `AgentChatMessage`
- `AgentConnectionRequest`, `CreateConnectionRequestRequest`

### Calendar
- `GoogleCalendar`, `GoogleEvent`, `GoogleEventDateTime`
- `GoogleCalendarListResponse`, `GoogleEventListResponse`

### Documents
- `Document`, `Agreement`, `AgreementParticipant`, `AgreementRevision`
- `CreateAgreementRequest`, `GetAgreementResponse`
- `DocusignTemplate`, `ListTemplatesResponse`

### Property & Search
- `PropertySearchResult`, `SearchByPolygonRequest`
- `PropertyCompsRequest`, `PropertyResearchOptions`

### And more...

See `openapi.yaml` for complete schema definitions.

## Validation Features

Pydantic provides:

- **Type validation**: Ensures correct types (str, int, bool, datetime, etc.)
- **Required fields**: Raises error if required field missing
- **Nullable fields**: Properly handles `None` values
- **Enums**: Validates against allowed values
- **Nested objects**: Validates complex nested structures
- **Custom validators**: Can add custom validation logic if needed

## Error Handling

```python
from pydantic import ValidationError

try:
    data = CreateTodoRequest(**request.json)
except ValidationError as e:
    # e.errors() returns list of validation errors
    # [{'loc': ('title',), 'msg': 'field required', 'type': 'value_error.missing'}]
    return jsonify({
        "success": False,
        "error": "Validation error",
        "details": e.errors()
    }), 400
```

## Testing

```python
from app.schemas import TodoItem
from pydantic import ValidationError

def test_todo_item_valid():
    # Valid data
    todo = TodoItem(
        id="123",
        agent_id="456",
        title="Test todo",
        completed=False,
        type="manual"
    )
    assert todo.title == "Test todo"

def test_todo_item_invalid():
    # Invalid data (id should be string, not int)
    with pytest.raises(ValidationError):
        TodoItem(id=123, title="Test")
```

## References

- OpenAPI spec: [`openapi.yaml`](../../../openapi.yaml)
- Generation script: [`Server/scripts/generate-pydantic-models.sh`](../../scripts/generate-pydantic-models.sh)
- SQLAlchemy models: [`Server/app/models/`](../models/)
- Pydantic docs: https://docs.pydantic.dev/latest/
