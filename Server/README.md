# SilverKey Server

Python/Flask backend. API, services, and business logic live under `app/`. Do not modify migrations or run migration commands unless you own that workflow.

## Testing

The Server uses [pytest](https://pytest.org/) for unit and integration testing with comprehensive coverage reporting.

### Running Tests

```bash
# From Server directory
cd Server

# Run all tests
pytest

# Run tests with verbose output
pytest -v

# Run tests in watch mode (requires pytest-watch)
pytest-watch

# Run specific test file
pytest tests/unit/test_property_type_multi.py

# Run tests matching pattern
pytest -k "property"

# Run only unit tests (fast)
pytest -m unit

# Run only integration tests
pytest -m integration
```

### Running Tests with Coverage

```bash
# Run tests with coverage (configured in pytest.ini)
pytest

# View coverage report in terminal
pytest --cov=app --cov-report=term-missing

# Generate HTML coverage report
pytest --cov=app --cov-report=html

# Open coverage report in browser
open coverage/html/index.html
```

### Coverage Configuration

Coverage thresholds are enforced via `pytest.ini` and `scripts/lint/check_coverage_thresholds.py`:

- **Overall**: 50% coverage required (fails if not met)
- **Services** (`app/services/`): 70% coverage required
- **Routes** (`app/routes/`): 50% coverage required
- **Models** (`app/models/`): 60% coverage required
- **Utils** (`app/utils/`): 70% coverage required

### Coverage Reports

After running tests, view reports at:

- **Terminal**: Summary shown in console
- **HTML**: `Server/coverage/html/index.html` (open in browser)
- **XML**: `Server/coverage/coverage.xml` (for CI/tools)
- **JSON**: `Server/coverage/coverage.json` (for scripts/CI)

### Writing Tests

Place test files in the `tests/` directory:

```
tests/
├── unit/                  # Fast, isolated tests
│   ├── test_preferences_canonical_keys.py
│   └── test_property_type_multi.py
├── integration/           # Tests with external services
└── conftest.py           # Shared fixtures
```

Use `test_*.py` naming convention. Mark tests with decorators:

```python
import pytest

@pytest.mark.unit
def test_fast_function():
    assert True

@pytest.mark.integration
@pytest.mark.slow
def test_external_service():
    assert True
```

### CI Integration

Tests run automatically in CI via `.github/workflows/test.yml`:

- Tests must pass before deployment
- Coverage thresholds must be met
- Coverage reports uploaded as artifacts
- PR comments show coverage summary

## Where to read more

- **Canonical server docs:** [documentation/server/](../documentation/server/README.md)
- **Backend rules:** `.cursor/rules/backend/`
- **Per-module:** READMEs under `app/` (e.g. `app/services/search/home_matching/`, `app/services/docusign/`).
