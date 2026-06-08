# SilverKey — common dev commands (repo root). Run `make help`.
SHELL := /usr/bin/env bash
MAKEFLAGS += --no-print-directory

.DEFAULT_GOAL := help

ROOT := $(abspath $(dir $(lastword $(MAKEFILE_LIST))))
SERVER_VENV := $(ROOT)/Server/.venv
SERVER_PYTHON := $(SERVER_VENV)/bin/python3
SERVER_PYTEST := $(SERVER_VENV)/bin/pytest
SERVER_FLASK := $(SERVER_VENV)/bin/flask
PROD_PARITY_COMPOSE_SH := $(ROOT)/scripts/deploy/prod-parity/compose.sh
LOCAL_DATABASE_URL := postgresql://silverkey:silverkey@localhost:5432/silverkey_dev
REGION ?= us-east-2
PROFILE ?=
PYTEST_ARGS ?=

.PHONY: help setup setup-mcp refresh check-deps clean-caches secrets db-up db-down db-reset db-health dev-db-init migrate \
	test test-all test-fe test-be test-be-ci-parity test-frontend test-backend \
	dev dev-web dev-backend \
	pre-commit precommit pre-push-check \
	lint lint-all lint-client lint-server \
	typecheck check-client openapi openapi-verify openapi-verify-pre-push generate-api \
	format-client format-check mobile \
	routes-extract endpoints-check-dead routes-extract-verify endpoints-sync-posthog \
	log-contracts log-contracts-migrate log-contracts-migrate-check log-contracts-lint log-contracts-verify \
	prod-parity prod-parity-build prod-parity-smoke

help:
	@echo "SilverKey Makefile (see also ./scripts/setup/setup-local.sh and ./scripts/setup/refresh.sh)"
	@echo ""
	@echo "  make setup            First-time setup — see setup.md (optional: ARGS='--skip-secrets')"
	@echo "  make setup-mcp        Cursor MCP only (seed mcp.json, install uv/npx, verify)"
	@echo "  make refresh          After git pull: clear caches + pnpm + pip (ARGS='--secrets' | '--reset-db' | '--no-clean' | '--aggressive-clean')"
	@echo "  make check-deps       Scan node/pnpm/python/redis/libmagic (ARGS='--skip-secrets' | '--no-install')"
	@echo "  make clean-caches     Remove regenerable dev caches only (ARGS='--aggressive')"
	@echo "  make secrets          AWS Secrets Manager -> Server/.env (uses AWS_PROFILE / ~/.aws/config)"
	@echo "  make db-up            Start local Postgres for dev ($(LOCAL_DATABASE_URL))"
	@echo "  make db-down          Stop local Postgres and clear the local dev DB volume"
	@echo "  make db-reset         Reset local Postgres volume and restart it"
	@echo "  make db-health        Check local Postgres readiness"
	@echo "  make dev-db-init      Reset local DB, refresh non-DB secrets, and run migrations"
	@echo "  make migrate          flask db upgrade (operators only; see warning in recipe)"
	@echo "  make test / test-all Client + Server tests"
	@echo "  make test-fe          Client Vitest (pnpm test:run)"
	@echo "  make test-be          Server pytest"
	@echo "  make test-be-ci-parity  Server pytest with clean env (matches CI; no shell .env)"
	@echo "  make dev              Web + backend via scripts/run/run-web.sh"
	@echo "  make dev-web          Vite web only"
	@echo "  make dev-backend      Backend stack only"
	@echo "  make precommit        pre-commit run --all-files (manual; same hooks as git commit)"
	@echo "  make pre-push-check   typecheck + contract tests (blocking; git push is advisory only)"
	@echo "  make lint / lint-all  ./scripts/ci/run-all-linters.sh all"
	@echo "  make lint-client      cd Client && pnpm lint"
	@echo "  make lint-server      ./scripts/ci/run-all-linters.sh server"
	@echo "  make typecheck        cd Client && pnpm typecheck"
	@echo "  make check-client     cd Client && pnpm check"
	@echo "  make check-docs       script path refs + doc placement + internal .md link checks"
	@echo "  make openapi          Regenerate client + server types from openapi/ (bundle + codegen)"
	@echo "  make openapi-verify   Regenerate, fail if git drift, run contract tests + typecheck"
	@echo "  make openapi-verify-pre-push  Regen + drift only (manual; drift when OpenAPI paths commit)"
	@echo "  make format-client    cd Client && pnpm format"
	@echo "  make format-check     cd Client && pnpm format:check"
	@echo "  make mobile           cd Client && pnpm dev:mobile"
	@echo "  make routes-extract   Write Server/endpoints.json from Flask url_map"
	@echo "  make routes-extract-verify  Regenerate endpoints.json; fail if git drift (CI)"
	@echo "  make endpoints-check-dead  Print dead routes (7d HogQL diff; needs POSTHOG_QUERY_API_KEY)"
	@echo "  make endpoints-sync-posthog  POST inventory + endpoint_dead_route events (needs POSTHOG_PROJECT_TOKEN + POSTHOG_QUERY_API_KEY)"
	@echo "  make log-contracts        Regenerate Client/Server log category contracts"
	@echo "  make log-contracts-migrate  Migrate LOG_CATEGORIES call sites to dot-notation paths"
	@echo "  make log-contracts-migrate-check  Fail if LOG_CATEGORIES remains in log calls"
	@echo "  make log-contracts-lint           Lint log paths + legacy category usage (CI)"
	@echo "  make log-contracts-verify Regenerate log contracts; fail if git drift"
	@echo "  make prod-parity-build    Build local prod-parity Docker stack (app + Redis + Celery)"
	@echo "  make prod-parity          Run local prod-parity stack (requires Server/.env + Client/.env)"
	@echo "  make prod-parity-smoke    Build, boot, curl /livez+/readyz, tear down (pre-merge Docker check)"

setup:
	bash "$(ROOT)/scripts/setup/setup-local.sh" $(ARGS)

setup-mcp:
	bash "$(ROOT)/scripts/setup/setup-mcp.sh"

refresh:
	bash "$(ROOT)/scripts/setup/refresh.sh" $(ARGS)

check-deps:
	bash "$(ROOT)/scripts/setup/check-deps.sh" $(ARGS)

clean-caches:
	bash "$(ROOT)/scripts/lib/clean-caches.sh" $(ARGS)

secrets:
	bash "$(ROOT)/Server/scripts/secrets.sh" "$(REGION)" "$(PROFILE)"

db-up:
	docker compose up -d postgres

db-down:
	docker compose down --volumes --remove-orphans

db-reset:
	$(MAKE) db-down
	$(MAKE) db-up

db-health:
	docker compose exec -T postgres pg_isready -U silverkey -d silverkey_dev

dev-db-init:
	$(MAKE) db-reset
	$(MAKE) secrets
	$(MAKE) migrate

migrate:
	@echo "-----------------------------------------------------------------"
	@echo "WARNING: Only run migrations if you own this workflow. Most contributors"
	@echo "should NOT run Alembic commands (see .cursor/rules/backend/database.mdc)."
	@echo "-----------------------------------------------------------------"
	cd "$(ROOT)/Server" && FLASK_APP=run:app "$(SERVER_FLASK)" db upgrade

test: test-all

test-all: test-fe test-be

test-fe test-frontend:
	cd "$(ROOT)/Client" && pnpm test:run

test-be test-backend:
	cd "$(ROOT)/Server" && mkdir -p coverage && TESTING=true APP_LOG_LEVEL=ERROR "$(SERVER_PYTEST)" $(PYTEST_ARGS)

test-be-ci-parity:
	cd "$(ROOT)/Server" && mkdir -p coverage && \
	  env -i PATH="$(SERVER_VENV)/bin:$$PATH" HOME="$$HOME" \
	    TESTING=true APP_LOG_LEVEL=ERROR \
	    "$(SERVER_PYTEST)" $(PYTEST_ARGS)

dev:
	bash "$(ROOT)/scripts/run/run-web.sh"

dev-web:
	cd "$(ROOT)/Client" && pnpm dev:web

dev-backend:
	bash "$(ROOT)/scripts/run/run-backend.sh"

pre-commit precommit:
	@bash "$(ROOT)/scripts/ci/run-pre-commit.sh"

pre-push-check:
	bash "$(ROOT)/scripts/ci/pre-push-check.sh"

lint lint-all:
	bash "$(ROOT)/scripts/ci/run-all-linters.sh" all

lint-client:
	cd "$(ROOT)/Client" && pnpm lint

lint-server:
	bash "$(ROOT)/scripts/ci/run-all-linters.sh" server

typecheck:
	cd "$(ROOT)/Client" && pnpm typecheck

check-client:
	cd "$(ROOT)/Client" && pnpm check

check-docs:
	bash "$(ROOT)/scripts/ci/check-script-references.sh"
	bash "$(ROOT)/scripts/ci/check-doc-placement.sh"
	bash "$(ROOT)/scripts/ci/check-doc-links.sh"

openapi:
	npm run openapi:generate --prefix "$(ROOT)"

openapi-verify:
	bash "$(ROOT)/scripts/ci/sync-openapi.sh"

openapi-verify-pre-push:
	bash "$(ROOT)/scripts/ci/sync-openapi.sh" --skip-contract-tests

# Back-compat alias
generate-api: openapi

format-client:
	cd "$(ROOT)/Client" && pnpm format

format-check:
	cd "$(ROOT)/Client" && pnpm format:check

mobile:
	cd "$(ROOT)/Client" && pnpm dev:mobile

routes-extract:
	cd "$(ROOT)/Server" && "$(SERVER_PYTHON)" scripts/endpoints/extract_routes.py

routes-extract-verify: routes-extract
	cd "$(ROOT)" && git diff --exit-code Server/endpoints.json

endpoints-check-dead:
	cd "$(ROOT)/Server" && "$(SERVER_PYTHON)" scripts/endpoints/check_dead_endpoints.py

endpoints-sync-posthog:
	cd "$(ROOT)/Server" && "$(SERVER_PYTHON)" scripts/endpoints/sync_inventory_posthog.py

log-contracts:
	python3 "$(ROOT)/scripts/log_contracts/generate.py"

log-contracts-migrate:
	python3 "$(ROOT)/scripts/log_contracts/migrate_log_paths.py"

log-contracts-migrate-check:
	python3 "$(ROOT)/scripts/log_contracts/migrate_log_paths.py" --check

log-contracts-lint:
	python3 "$(ROOT)/scripts/log_contracts/lint_log_paths.py"

log-contracts-verify:
	bash "$(ROOT)/scripts/log_contracts/verify.sh"

prod-parity-build:
	bash "$(PROD_PARITY_COMPOSE_SH)" build

prod-parity:
	bash "$(PROD_PARITY_COMPOSE_SH)" up

prod-parity-smoke:
	bash "$(ROOT)/scripts/deploy/prod-parity/smoke.sh"
