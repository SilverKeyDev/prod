# User Preferences Architecture

## Overview

User preferences are the core of SilverKey's personalization engine. They power property search, recommendations, and agent-client matching.

## Data Model

### Normalized Storage

Preferences are split across domain-specific tables:

```
users
├── user_demographics (1:1)
├── user_financials (1:1)
├── user_search_intent (1:1)
├── user_intent_attributes (1:many)
└── user_important_locations (1:many)
```

### Tables and Fields

#### `user_demographics`
- `age_range`: e.g., "25-34", "35-44"
- `household_size`: Number of people
- `household_income_range`: e.g., "75k-100k"
- `move_in_timeline`: e.g., "0-3 months", "3-6 months"
- `current_housing_situation`: e.g., "renting", "owning"
- `primary_residence`: Boolean

#### `user_financials`
- `budget_min`: Minimum home price
- `budget_max`: Maximum home price
- `down_payment_percentage`: e.g., 20
- `credit_score_range`: e.g., "700-749"
- `loan_pre_approval`: Boolean
- `monthly_payment_max`: Maximum monthly payment

#### `user_search_intent`
- `preferred_bedrooms`: Minimum bedrooms
- `preferred_bathrooms`: Minimum bathrooms
- `preferred_bedrooms_max`: Maximum bedrooms
- `preferred_bathrooms_max`: Maximum bathrooms
- `preferred_housing_type`: e.g., "single_family", "condo"
- `preferred_home_age`: e.g., "new", "5-10 years"
- `preferred_home_age_min`: Minimum age in years
- `preferred_home_age_max`: Maximum age in years
- `preferred_sqft_min`: Minimum square feet
- `preferred_sqft_max`: Maximum square feet
- `preferred_lot_size_min`: Minimum lot size (acres)
- `preferred_lot_size_max`: Maximum lot size (acres)
- `must_have`: JSON array of required features (e.g., ["pool", "garage"])
- `deal_breakers`: JSON array of disqualifying features
- `listing_type`: e.g., ["for_sale", "pending"]
- `days_on_market_min`: Minimum days on market
- `days_on_market_max`: Maximum days on market
- `extended_buyer_preferences`: JSON for additional v1+ fields

#### `user_intent_attribute`
- `feature`: e.g., "pool", "garage", "hardwood_floors"
- `importance`: e.g., "must_have", "nice_to_have", "dont_care"

#### `user_important_location`
- `address`: Full address string
- `lat`: Latitude
- `lng`: Longitude
- `commute_tolerance`: Maximum commute time in minutes
- `location_type`: e.g., "work", "school", "family"

## API Contract

### Write Endpoint

**POST** `/api/v1/user/preferences`

```json
{
  "home_budget_min": 300000,
  "home_budget_max": 500000,
  "preferred_bedrooms": 3,
  "preferred_bathrooms": 2,
  "preferred_housing_type": "single_family",
  "must_have": ["pool", "garage"],
  "deal_breakers": ["hoa"],
  "important_locations": [
    {
      "address": "123 Main St, Austin, TX",
      "lat": 30.2672,
      "lng": -97.7431,
      "commute_tolerance": 30,
      "location_type": "work"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Preferences saved successfully"
}
```

### Read Endpoint

**GET** `/api/v1/user/preferences`

**Response:**
```json
{
  "success": true,
  "preferences": {
    "home_budget_min": 300000,
    "home_budget_max": 500000,
    "preferred_bedrooms": 3,
    "preferred_bathrooms": 2,
    "preferred_housing_type": "single_family",
    "must_have": ["pool", "garage"],
    "deal_breakers": ["hoa"],
    "important_locations": [...]
  }
}
```

## Write Pipeline

### Entry Point

**Service:** `app/services/aggregation/preferences_aggregation_write.py`

**Function:** `write_preferences_from_payload(user_id, payload) -> User`

### Process Flow

1. **Parse payload**: Extract fields by domain
2. **Upsert domain models**:
   - Create or update `UserFinancials`
   - Create or update `UserDemographics`
   - Create or update `UserSearchIntent`
   - Delete and recreate `UserIntentAttribute` entries
   - Delete and recreate `UserImportantLocation` entries
3. **Set metadata**:
   - `user.has_preferences = True`
   - `user.preferences_version = "v1"`
4. **Commit transaction**

### Example Implementation

```python
def write_preferences_from_payload(user_id: str, payload: dict) -> User:
    user = User.query.get(user_id)
    if not user:
        raise ValueError("User not found")

    # Financials
    financials = UserFinancials.query.filter_by(user_id=user_id).first()
    if not financials:
        financials = UserFinancials(user_id=user_id)
        db.session.add(financials)

    financials.budget_min = payload.get('home_budget_min')
    financials.budget_max = payload.get('home_budget_max')
    # ... more fields

    # Search intent
    search_intent = UserSearchIntent.query.filter_by(user_id=user_id).first()
    if not search_intent:
        search_intent = UserSearchIntent(user_id=user_id)
        db.session.add(search_intent)

    search_intent.preferred_bedrooms = payload.get('preferred_bedrooms')
    search_intent.must_have = payload.get('must_have')
    # ... more fields

    # Important locations
    UserImportantLocation.query.filter_by(user_id=user_id).delete()
    for loc in payload.get('important_locations', []):
        location = UserImportantLocation(
            user_id=user_id,
            address=loc['address'],
            lat=loc.get('lat'),
            lng=loc.get('lng'),
            commute_tolerance=loc.get('commute_tolerance')
        )
        db.session.add(location)

    # Metadata
    user.has_preferences = True
    user.preferences_version = 'v1'

    db.session.commit()
    return user
```

## Read Pipeline

### Database to API

Read all related models and flatten to API shape:

```python
def get_preferences(user_id: str) -> dict:
    user = User.query.get(user_id)
    if not user or not user.has_preferences:
        return {}

    financials = UserFinancials.query.filter_by(user_id=user_id).first()
    search_intent = UserSearchIntent.query.filter_by(user_id=user_id).first()
    locations = UserImportantLocation.query.filter_by(user_id=user_id).all()

    return {
        'home_budget_min': financials.budget_min if financials else None,
        'home_budget_max': financials.budget_max if financials else None,
        'preferred_bedrooms': search_intent.preferred_bedrooms if search_intent else None,
        'must_have': search_intent.must_have if search_intent else [],
        'important_locations': [loc.to_dict() for loc in locations],
        # ... more fields
    }
```

## Usage in Search

### Polygon Search

Preferences power post-filtering and scoring:

```python
# app/services/search/polygon_search_runner.py
def run_polygon_search(user_id, viewport_polygon, force_search=False):
    # Get user preferences
    user = User.query.get(user_id)
    search_intent = UserSearchIntent.query.filter_by(user_id=user_id).first()

    # Apply preference filters
    results = apply_polygon_search_post_filters(
        properties=raw_results,
        search_intent=search_intent
    )

    # Score results based on preferences
    scored_results = score_properties_by_preferences(results, user)

    return scored_results
```

### Isochrone Search

Preferences determine commute boundaries:

```python
def calculate_isochrone(user_id):
    locations = UserImportantLocation.query.filter_by(user_id=user_id).all()

    polygons = []
    for loc in locations:
        polygon = generate_isochrone_polygon(
            lat=loc.lat,
            lng=loc.lng,
            time_limit=loc.commute_tolerance
        )
        polygons.append(polygon)

    # Intersection of all commute areas
    return intersect_polygons(polygons)
```

## Versioning

### Current: v1

- `user.preferences_version = "v1"`
- New fields added to `extended_buyer_preferences` JSON

### Future: v2+

When schema changes:
1. Add migration for new columns or tables
2. Update `preferences_version` on write
3. Read pipeline checks version and maps accordingly
4. Client remains backward-compatible

## Validation

### Client-Side

Form validation in `Client/packages/features/profile/`:

```typescript
const validatePreferences = (data: UserPreferencesData) => {
  const errors = {};

  if (data.home_budget_min && data.home_budget_max) {
    if (data.home_budget_min > data.home_budget_max) {
      errors.budget = "Min must be less than max";
    }
  }

  return errors;
};
```

### Server-Side

Field validation in write pipeline:

```python
def validate_preferences(payload: dict):
    if 'home_budget_min' in payload and 'home_budget_max' in payload:
        if payload['home_budget_min'] > payload['home_budget_max']:
            raise ValueError("Min budget must be less than max budget")

    if 'must_have' in payload:
        if not isinstance(payload['must_have'], list):
            raise ValueError("must_have must be an array")
```

## Agent Access

Agents can search on behalf of clients using their preferences:

```python
@search_bp.route('/properties', methods=['POST'])
@require_agent_access
def agent_search_for_client(user):
    # Agent searches for client
    client_id = request.json.get('preferences_user_id')

    # Verify agent has access to client
    if not agent_has_access(user.id, client_id):
        return jsonify({'success': False, 'error': 'Unauthorized'}), 403

    # Use client's preferences
    results = run_polygon_search(
        user_id=client_id,
        viewport_polygon=request.json['viewport_polygon']
    )

    return jsonify({'success': True, 'properties': results})
```

## Best Practices

1. **Atomic writes**: Use `db_transaction` for preference updates
2. **Validation**: Validate ranges (min < max) and types
3. **Defaults**: Provide sensible defaults for missing fields
4. **Versioning**: Set `preferences_version` on every write
5. **PII handling**: Mask sensitive data in logs (centralized logger handles this)
6. **Agent access**: Always verify agent-client relationship before using client preferences

## Further Reading

- **User preferences schema:** `.cursor/rules/shared/user-preferences-schema.mdc`
- **SQLAlchemy patterns:** `.cursor/rules/backend/sqlalchemy-patterns.mdc`
- **API conventions:** `documentation/server/api-conventions.md`
