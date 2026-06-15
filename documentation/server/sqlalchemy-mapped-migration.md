# SQLAlchemy 2.0 Type Hints Migration Guide

Guide for migrating SQLAlchemy models from legacy `db.Column` syntax to modern `Mapped[]` type hints.

## Overview

SQLAlchemy 2.0 introduces `Mapped[]` type annotations that provide:
- Better IDE autocomplete and type checking
- Catch type errors before runtime
- Self-documenting code through types
- Modern Python best practices

**This migration is purely additive - no runtime behavior changes.**

## Import Requirements

Add these imports to model files:

```python
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime  # If using DateTime columns
from typing import Optional  # For nullable fields (Python < 3.10)
```

For Python 3.10+, use union operator `|` instead of `Optional`:
```python
# Python 3.10+
column: Mapped[str | None]

# Python < 3.10
column: Mapped[Optional[str]]
```

## Basic Patterns

### String Columns

**Before:**
```python
title = db.Column(db.String(500), nullable=False)
description = db.Column(db.Text, nullable=True)
```

**After:**
```python
title: Mapped[str] = mapped_column(db.String(500))
description: Mapped[str | None] = mapped_column(db.Text)
```

### Integer Columns

**Before:**
```python
count = db.Column(db.Integer, nullable=False)
optional_count = db.Column(db.Integer, nullable=True)
```

**After:**
```python
count: Mapped[int] = mapped_column(db.Integer)
optional_count: Mapped[int | None] = mapped_column(db.Integer)
```

### Boolean Columns

**Before:**
```python
completed = db.Column(db.Boolean, default=False, nullable=False)
is_active = db.Column(db.Boolean, nullable=True)
```

**After:**
```python
completed: Mapped[bool] = mapped_column(default=False)
is_active: Mapped[bool | None] = mapped_column()
```

### DateTime Columns

**Before:**
```python
created_at = db.Column(db.DateTime, default=datetime.utcnow)
updated_at = db.Column(db.DateTime, nullable=True)
```

**After:**
```python
from datetime import datetime

created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
updated_at: Mapped[datetime | None] = mapped_column()
```

### Primary Keys

**Before:**
```python
id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
```

**After:**
```python
import uuid

id: Mapped[str] = mapped_column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
```

### Foreign Keys

**Before:**
```python
user_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False)
optional_user_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=True)
```

**After:**
```python
user_id: Mapped[str] = mapped_column(db.ForeignKey("users.id"))
optional_user_id: Mapped[str | None] = mapped_column(db.ForeignKey("users.id"))
```

## Advanced Patterns

### JSONB Columns (PostgreSQL)

**Before:**
```python
from sqlalchemy.dialects.postgresql import JSONB

data = db.Column(JSONB, nullable=True)
```

**After:**
```python
from sqlalchemy.dialects.postgresql import JSONB
from typing import Any

data: Mapped[dict[str, Any] | None] = mapped_column(JSONB)
```

### Enum Columns

**Before:**
```python
status = db.Column(db.String(20), nullable=False)  # "pending", "active", "completed"
```

**After:**
```python
from enum import Enum

class Status(str, Enum):
    PENDING = "pending"
    ACTIVE = "active"
    COMPLETED = "completed"

status: Mapped[str] = mapped_column(db.String(20))  # Type still str, enum enforced at app level
```

### Indexes

**Before:**
```python
email = db.Column(db.String(255), index=True, unique=True, nullable=False)
```

**After:**
```python
email: Mapped[str] = mapped_column(db.String(255), index=True, unique=True)
```

### Relationships

Relationships stay largely the same - no `Mapped` wrapper needed yet:

**Before:**
```python
agent = db.relationship("User", foreign_keys=[agent_id], backref=db.backref("todos", lazy=True))
```

**After (no change for now):**
```python
agent = db.relationship("User", foreign_keys=[agent_id], backref=db.backref("todos", lazy=True))
```

Note: Future SQLAlchemy versions will support `Mapped` for relationships, but it's not required yet.

## Complete Example: Todo Model

**Before:**
```python
import uuid
from datetime import datetime
from app import db

class Todo(db.Model):
    __tablename__ = "todos"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    agent_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False)
    client_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=True)

    title = db.Column(db.String(500), nullable=False)
    description = db.Column(db.Text, nullable=True)

    priority = db.Column(db.String(20), nullable=True)
    type = db.Column(db.String(50), nullable=False, default="manual")

    due_date = db.Column(db.DateTime, nullable=True)
    completed = db.Column(db.Boolean, default=False, nullable=False)
    completed_at = db.Column(db.DateTime, nullable=True)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    agent = db.relationship("User", foreign_keys=[agent_id], backref=db.backref("todos", lazy=True))
    client = db.relationship("User", foreign_keys=[client_id], backref=db.backref("client_todos", lazy=True))
```

**After:**
```python
import uuid
from datetime import datetime
from sqlalchemy.orm import Mapped, mapped_column
from app import db

class Todo(db.Model):
    __tablename__ = "todos"

    id: Mapped[str] = mapped_column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    agent_id: Mapped[str] = mapped_column(db.ForeignKey("users.id"))
    client_id: Mapped[str | None] = mapped_column(db.ForeignKey("users.id"))

    title: Mapped[str] = mapped_column(db.String(500))
    description: Mapped[str | None] = mapped_column(db.Text)

    priority: Mapped[str | None] = mapped_column(db.String(20))
    type: Mapped[str] = mapped_column(db.String(50), default="manual")

    due_date: Mapped[datetime | None] = mapped_column(db.DateTime)
    completed: Mapped[bool] = mapped_column(default=False)
    completed_at: Mapped[datetime | None] = mapped_column(db.DateTime)

    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships stay the same (no Mapped wrapper needed yet)
    agent = db.relationship("User", foreign_keys=[agent_id], backref=db.backref("todos", lazy=True))
    client = db.relationship("User", foreign_keys=[client_id], backref=db.backref("client_todos", lazy=True))
```

## Key Rules

1. **nullable=False** → `Mapped[T]`
2. **nullable=True** → `Mapped[T | None]`
3. **Keep `mapped_column()`** for constraints, defaults, indexes
4. **Relationships** - no change (yet)
5. **__tablename__** - no change (still required)

## Migration Checklist

For each model file:

- [ ] Add imports: `from sqlalchemy.orm import Mapped, mapped_column`
- [ ] Add datetime import if needed: `from datetime import datetime`
- [ ] Convert each column:
  - [ ] Add `Mapped[type]` annotation
  - [ ] Replace `db.Column()` with `mapped_column()`
  - [ ] Use `type | None` for nullable columns
  - [ ] Keep all other arguments (default, unique, index, etc.)
- [ ] Leave relationships unchanged
- [ ] Test import: `python -c "from app.models.agent import Todo"`
- [ ] Verify no runtime changes (existing tests pass)

## Common Mistakes

### ❌ Wrong: Removing constraints

```python
# WRONG - loses String(500) constraint
title: Mapped[str] = mapped_column()
```

```python
# CORRECT - keeps String(500) constraint
title: Mapped[str] = mapped_column(db.String(500))
```

### ❌ Wrong: Not handling nullable correctly

```python
# WRONG - nullable=True but type says non-null
description: Mapped[str] = mapped_column(db.Text)  # Should be Mapped[str | None]
```

```python
# CORRECT
description: Mapped[str | None] = mapped_column(db.Text)
```

### ❌ Wrong: Adding Mapped to relationships (not yet supported)

```python
# WRONG - relationships don't use Mapped yet
agent: Mapped["User"] = db.relationship(...)
```

```python
# CORRECT - no Mapped for relationships
agent = db.relationship("User", foreign_keys=[agent_id])
```

## Testing After Migration

### Import Test
```bash
python -c "from app.models import Todo, User, Document"
# Should succeed with no errors
```

### Type Check (Optional)
```bash
mypy app/models/ --ignore-missing-imports
# Should show improved type coverage
```

### Runtime Test
```bash
pytest tests/
# All existing tests should pass (no behavior changes)
```

## Benefits

After migration:

- **IDE autocomplete**: Type hints enable better autocomplete
- **Static type checking**: Catch type errors before runtime
- **Documentation**: Types document expected data types
- **Future-proof**: Aligns with SQLAlchemy 2.0+ best practices
- **No runtime cost**: Pure Python annotations (zero overhead)

## References

- SQLAlchemy 2.0 docs: https://docs.sqlalchemy.org/en/20/
- Mapped type docs: https://docs.sqlalchemy.org/en/20/orm/mapping_api.html#sqlalchemy.orm.Mapped
- PEP 604 union syntax: https://peps.python.org/pep-0604/

## Questions?

See existing migrated models in `Server/app/models/agent/` for examples.
