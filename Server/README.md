# SilverKey Server

Python/Flask backend under `app/`. Do not run or author migrations unless you own that workflow.

## Python dependencies

Pins under **`requirements/`** (from `Server/`):

| File | Use |
| ---- | --- |
| `runtime.txt` | Production / full local (ML + geospatial) |
| `ci.txt` | CI import smoke |
| `lint.txt` | ruff + pyright (lint CI) |
| `test.txt` | Test CI (+ CPU torch) |
| `dev.txt` | Local pytest, pre-commit, mypy |
| `codegen.txt` | OpenAPI → Pydantic scripts |

Install: `bash Server/scripts/bootstrap-venv.sh` (or `--lint`, `--ci`, `--refresh-deps`). On Linux/WSL, that script pre-installs the CPU-only `torch` wheel before `runtime.txt` (bare `torch` on PyPI is CUDA).

### libmagic (uploads)

| OS | Install |
| -- | ------- |
| macOS | `brew install libmagic` |
| Debian/Ubuntu | `sudo apt install libmagic1` |
| Fedora | `sudo dnf install file-libs` |

Docker images include `libmagic1`.

## Testing

```bash
cd Server && source .venv/bin/activate
pytest                    # or: make test-be from repo root
pytest -v -k "pattern"
pytest -m unit            # / -m integration
pytest --cov=app --cov-report=html
```

Thresholds: `pytest.ini`, `pyproject.toml`, `scripts/misc/check_coverage_thresholds.py` (overall ~47%, per-area floors). `app/schemas/generated.py` omitted — regenerate via `make openapi`.

Tests live under `tests/` (`unit/`, `integration/`, `conftest.py`). CI: `.github/workflows/test.yml`.

## Where to read more

| Topic | Doc |
| ----- | --- |
| Server docs | [documentation/README.md](../documentation/README.md) |
| Ops | [documentation/runbooks/](../documentation/runbooks/postgres.md) |
| OpenAPI | [documentation/guides/openapi-workflow.md](../documentation/guides/openapi-workflow.md) |
| Backend rules | `.cursor/rules/backend/` |
| Module READMEs | `app/services/search/home_matching/`, `app/services/docusign/docs/`, … |
