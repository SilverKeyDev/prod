# SQLAlchemy Patterns

## Model Definition

### Standard Model Structure

```python
from app import db
from datetime import datetime
from sqlalchemy import Index

class PropertyCache(db.Model):
    """
    Shared listing snapshot — one row per physical property.

    Relationships:
    - user_links: One-to-many with UserPropertyLink (per-user rank, like, current)
    """
    __tablename__ = 'property_cache'

    id = db.Column(db.String(36), primary_key=True)
    zpid = db.Column(db.String(64), unique=True, index=True)
    address = db.Column(db.String(500))
    city = db.Column(db.String(120))
    state = db.Column(db.String(64))
    price = db.Column(db.String(36))
    latitude = db.Column(db.Float)
    longitude = db.Column(db.Float)
    images = db.Column(db.JSON)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    user_links = db.relationship(
        'UserPropertyLink', back_populates='property', cascade='all, delete-orphan'
    )

class UserPropertyLink(db.Model):
    """Per-user relationship to a PropertyCache row (favorites, ranking, search state)."""
    __tablename__ = 'user_property_link'

    id = db.Column(db.String(36), primary_key=True)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False, index=True)
    property_id = db.Column(
        db.String(36), db.ForeignKey('property_cache.id'), nullable=False, index=True
    )
    is_liked = db.Column(db.Boolean, default=False)
    current = db.Column(db.Boolean, default=True)
    score = db.Column(db.Float)
    ranking = db.Column(db.Integer)

    property = db.relationship('PropertyCache', back_populates='user_links')

    __table_args__ = (
        Index('idx_user_property', 'user_id', 'property_id'),
    )
```

## Relationships

### One-to-One

```python
class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.String(36), primary_key=True)
    demographics = db.relationship('UserDemographics', back_populates='user', uselist=False)

class UserDemographics(db.Model):
    __tablename__ = 'user_demographics'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), unique=True, nullable=False)
    user = db.relationship('User', back_populates='demographics')
```

### One-to-Many

```python
class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.String(36), primary_key=True)
    saved_homes = db.relationship('SavedHome', back_populates='user', cascade='all, delete-orphan')

class SavedHome(db.Model):
    __tablename__ = 'saved_homes'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False, index=True)
    user = db.relationship('User', back_populates='saved_homes')
```

### Many-to-Many

```python
# Association table
property_tags = db.Table('property_tags',
    db.Column('property_id', db.String(50), db.ForeignKey('properties.id'), primary_key=True),
    db.Column('tag_id', db.Integer, db.ForeignKey('tags.id'), primary_key=True)
)

class Property(db.Model):
    tags = db.relationship('Tag', secondary=property_tags, back_populates='properties')

class Tag(db.Model):
    properties = db.relationship('Property', secondary=property_tags, back_populates='tags')
```

## Querying

### Basic Queries

```python
# Get by ID
user = User.query.get(user_id)

# Filter
properties = Property.query.filter(Property.price >= 300000).all()

# Multiple filters
properties = Property.query.filter(
    Property.price >= min_price,
    Property.price <= max_price,
    Property.bedrooms >= min_beds
).all()

# OR conditions
from sqlalchemy import or_
properties = Property.query.filter(
    or_(Property.city == 'Austin', Property.city == 'Dallas')
).all()

# Count
count = Property.query.filter(Property.price >= 300000).count()
```

### Eager Loading (Avoid N+1)

```python
from sqlalchemy.orm import joinedload, subqueryload

# Bad: N+1 queries
users = User.query.all()
for user in users:
    print(user.demographics.age_range)  # Separate query for each user

# Good: Eager load with joinedload
users = User.query.options(joinedload(User.demographics)).all()
for user in users:
    print(user.demographics.age_range)  # No additional queries

# For large collections, use subqueryload
users = User.query.options(subqueryload(User.saved_homes)).all()
```

### Pagination

```python
page = request.args.get('page', 1, type=int)
per_page = request.args.get('per_page', 20, type=int)

pagination = Property.query.paginate(page=page, per_page=per_page, error_out=False)

return jsonify({
    'success': True,
    'data': [p.to_dict() for p in pagination.items],
    'pagination': {
        'page': pagination.page,
        'per_page': pagination.per_page,
        'total': pagination.total,
        'pages': pagination.pages
    }
})
```

## Session Management

### Commit Pattern

```python
# Create
user = User(email='user@example.com', name='John Doe')
db.session.add(user)
db.session.commit()

# Update
user.name = 'Jane Doe'
db.session.commit()

# Delete
db.session.delete(user)
db.session.commit()
```

### Transaction Pattern

```python
from app.utils.common_patterns import db_transaction

# Atomic transaction
with db_transaction():
    user.name = 'New Name'
    user.email = 'new@example.com'
    # Auto-commits on success, auto-rolls back on exception
```

### Rollback on Error

```python
try:
    user.name = 'New Name'
    db.session.commit()
except Exception as e:
    db.session.rollback()
    raise
```

## Indexing

### When to Index

1. **Foreign keys**: Always (add `index=True`)
2. **WHERE clauses**: Columns used in filters
3. **ORDER BY**: Columns used in sorting
4. **Composite indexes**: Multi-column queries

### Index Examples

```python
# Single column index
email = db.Column(db.String(120), unique=True, nullable=False, index=True)

# Composite index
__table_args__ = (
    Index('idx_user_created', 'user_id', 'created_at'),
    Index('idx_location', 'city', 'state', 'zip_code'),
)

# Partial index (PostgreSQL)
Index('idx_active_users', 'user_id', postgresql_where=db.text("status = 'active'"))
```

## Hybrid Properties

```python
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy import select, func

class User(db.Model):
    first_name = db.Column(db.String(100))
    last_name = db.Column(db.String(100))

    @hybrid_property
    def full_name(self):
        """Python-level computed property"""
        return f"{self.first_name} {self.last_name}"

    @full_name.expression
    def full_name(cls):
        """SQL-level expression for queries"""
        return func.concat(cls.first_name, ' ', cls.last_name)

# Query using hybrid property
users = User.query.filter(User.full_name == 'John Doe').all()
```

## Common Pitfalls

1. **Forgetting to commit**: Always call `db.session.commit()`
2. **N+1 queries**: Use `joinedload()` or `subqueryload()`
3. **Large result sets**: Use pagination
4. **Stale data**: Call `db.session.refresh(obj)` after commit if needed
5. **Cascade confusion**: Understand cascade options to avoid accidental deletions

## Best Practices

1. **Use `back_populates`** instead of `backref` for clarity
2. **Index foreign keys** always
3. **Validate before commit** at application level
4. **Use DTOs** for HTTP serialization (see `app/dtos/`); avoid new `to_dict()` on models
5. **Lazy loading strategy**: Choose appropriate for each relationship
6. **Transaction isolation**: Use `db_transaction` for atomic operations

## Further Reading

- **SQLAlchemy patterns:** `.cursor/rules/backend/sqlalchemy-patterns.mdc`
- **Backend patterns:** `.cursor/rules/backend/backend-patterns.mdc`
- **Database rules:** `.cursor/rules/backend/database.mdc`
