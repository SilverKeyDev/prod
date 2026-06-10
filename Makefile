# SilverKey — common dev commands (repo root). Run `make help`.
SHELL := /usr/bin/env bash
MAKEFLAGS += --no-print-directory

.DEFAULT_GOAL := help

ROOT := $(abspath $(dir $(lastword $(MAKEFILE_LIST))))
PROD_PARITY_COMPOSE := $(ROOT)/scripts/deploy/prod-parity/docker-compose.yml
REGION ?= us-east-2
PROFILE ?=
PYTEST_ARGS ?=

.PHONY: help setup setup-mcp refresh clean-caches secrets migrate \
	test test-all test-fe test-be test-be-ci-parity test-frontend test-backend \
	dev dev-web dev-backend \
	pre-commit precommit \
	lint lint-all lint-client lint-server \
	typecheck check-client openapi openapi-verify openapi-verify-pre-push generate-api \
	format-client format-check mobile \
	routes-extract endpoints-check-dead routes-extract-verify endpoints-sync-posthog \
	monitor-health-alert monitor-5xx-alert \
	log-contracts log-contracts-verify \
	prod-parity prod-parity-build

help:
	@echo "SilverKey Makefile (see also ./scripts/setup/setup-local.sh and ./scripts/setup/refresh.sh)"
	@echo ""
	@echo "  make setup            First-time setup — see setup.md (optional: ARGS='--skip-secrets')"
	@echo "  make setup-mcp        Cursor MCP only (seed mcp.json, install uv/npx, verify)"
	@echo "  make refresh          After git pull: clear caches + pnpm + pip (ARGS='--secrets' | '--no-clean' | '--aggressive-clean')"
	@echo "  make clean-caches     Remove regenerable dev caches only (ARGS='--aggressive')"
	@echo "  make secrets          AWS Secrets Manager -> Server/.env (uses AWS_PROFILE / ~/.aws/config)"
	@echo "  make migrate          flask db upgrade (operators only; see warning in recipe)"
	@echo "  make test / test-all Client + Server tests"
	@echo "  make test-fe          Client Vitest (pnpm test:run)"
	@echo "  make test-be          Server pytest"
	@echo "  make test-be-ci-parity  Server pytest with clean env (matches CI; no shell .env)"
	@echo "  make dev              Web + backend via scripts/run/run-web.sh"
	@echo "  make dev-web          Vite web only"
	@echo "  make dev-backend      Backend stack only"
	@echo "  make precommit        pre-commit run --all-files"
	@echo "  make lint / lint-all  ./scripts/ci/run-all-linters.sh all"
	@echo "  make lint-client      cd Client && pnpm lint"
	@echo "  make lint-server      ./scripts/ci/run-all-linters.sh server"
	@echo "  make typecheck        cd Client && pnpm typecheck"
	@echo "  make check-client     cd Client && pnpm check"
	@echo "  make check-docs       doc placement + internal .md link checks"
	@echo "  make openapi          Regenerate client + server types from openapi/ (bundle + codegen)"
	@echo "  make openapi-verify   Regenerate, fail if git drift, run contract tests + typecheck"
	@echo "  make openapi-verify-pre-push  Same without contract pytest (pre-push; test-be covers them)"
	@echo "  make format-client    cd Client && pnpm format"
	@echo "  make format-check     cd Client && pnpm format:check"
	@echo "  make mobile           cd Client && pnpm dev:mobile"
	@echo "  make routes-extract   Write Server/endpoints.json from Flask url_map"
	@echo "  make routes-extract-verify  Regenerate endpoints.json; fail if git drift (CI)"
	@echo "  make endpoints-check-dead  Diff inventory vs PostHog api_request (7d; needs POSTHOG_QUERY_API_KEY)"
	@echo "  make monitor-health-alert Check SILVERKEY_HEALTH_URL and alert Slack on failure"
	@echo "  make monitor-5xx-alert   Query PostHog api_request 5xx spikes and alert Slack"
	@echo "  make endpoints-sync-posthog  POST endpoint_inventory_sync to PostHog (needs POSTHOG_PROJECT_TOKEN)"
	@echo "  make log-contracts        Regenerate Client/Server log category contracts"
	@echo "  make log-contracts-verify Regenerate log contracts; fail if git drift"
	@echo "  make prod-parity-build    Build local prod-parity Docker stack (app + Redis + Celery)"
	@echo "  make prod-parity          Run local prod-parity stack (requires Server/.env)"

setup:
	bash "$(ROOT)/scripts/setup/setup-local.sh" $(ARGS)

setup-mcp:
	bash "$(ROOT)/scripts/setup/setup-mcp.sh"

refresh:
	bash "$(ROOT)/scripts/setup/refresh.sh" $(ARGS)

clean-caches:
	bash "$(ROOT)/scripts/lib/clean-caches.sh" $(ARGS)

secrets:
	bash "$(ROOT)/Server/scripts/secrets.sh" "$(REGION)" "$(PROFILE)"

migrate:
	@echo "-----------------------------------------------------------------"
	@echo "WARNING: Only run migrations if you own this workflow. Most contributors"
	@echo "should NOT run Alembic commands (see .cursor/rules/backend/database.mdc)."
	@echo "-----------------------------------------------------------------"
	cd "$(ROOT)/Server" && . .venv/bin/activate && export FLASK_APP=run:app && flask db upgrade

test: test-all

test-all: test-fe test-be

test-fe test-frontend:
	cd "$(ROOT)/Client" && pnpm test:run

test-be test-backend:
	cd "$(ROOT)/Server" && mkdir -p coverage && . .venv/bin/activate && TESTING=true APP_LOG_LEVEL=ERROR pytest $(PYTEST_ARGS)

test-be-ci-parity:
	cd "$(ROOT)/Server" && mkdir -p coverage && . .venv/bin/activate && \
	  env -i PATH="$$PATH" HOME="$$HOME" VIRTUAL_ENV="$$VIRTUAL_ENV" \
	    TESTING=true APP_LOG_LEVEL=ERROR \
	    pytest $(PYTEST_ARGS)

dev:
	bash "$(ROOT)/scripts/run/run-web.sh"

dev-web:
	cd "$(ROOT)/Client" && pnpm dev:web

dev-backend:
	bash "$(ROOT)/scripts/run/run-backend.sh"

pre-commit precommit:
	@bash "$(ROOT)/scripts/ci/run-pre-commit.sh"

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
	cd "$(ROOT)/Server" && . .venv/bin/activate && python3 scripts/endpoints/extract_routes.py

routes-extract-verify: routes-extract
	cd "$(ROOT)" && git diff --exit-code Server/endpoints.json

endpoints-check-dead:
	cd "$(ROOT)/Server" && . .venv/bin/activate && python3 scripts/endpoints/check_dead_endpoints.py

endpoints-sync-posthog:
	cd "$(ROOT)/Server" && . .venv/bin/activate && python3 scripts/endpoints/sync_inventory_posthog.py

monitor-health-alert:
	python3 "$(ROOT)/scripts/ops/check_health_alert.py" $(ARGS)

monitor-5xx-alert:
	cd "$(ROOT)/Server" && . .venv/bin/activate && python3 scripts/monitoring/alert_5xx_spike.py $(ARGS)

log-contracts:
	python3 "$(ROOT)/scripts/log_contracts/generate.py"

log-contracts-verify:
	bash "$(ROOT)/scripts/log_contracts/verify.sh"

prod-parity-build:
	docker compose -f "$(PROD_PARITY_COMPOSE)" build

prod-parity:
	docker compose -f "$(PROD_PARITY_COMPOSE)" up
