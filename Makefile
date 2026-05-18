# SilverKey — common dev commands (repo root). Run `make help`.
SHELL := /usr/bin/env bash
MAKEFLAGS += --no-print-directory

.DEFAULT_GOAL := help

ROOT := $(abspath $(dir $(lastword $(MAKEFILE_LIST))))
REGION ?= us-east-2
PROFILE ?=
PYTEST_ARGS ?=

.PHONY: help setup refresh secrets migrate \
	test test-all test-fe test-be test-frontend test-backend \
	dev dev-web dev-backend \
	pre-commit precommit \
	lint lint-all lint-client lint-server \
	typecheck check-client openapi openapi-verify generate-api \
	format-client format-check mobile

help:
	@echo "SilverKey Makefile (see also ./scripts/setup-local.sh and ./scripts/refresh.sh)"
	@echo ""
	@echo "  make setup            First-time setup (optional: make setup ARGS='--skip-secrets')"
	@echo "  make refresh          After git pull: pnpm + pip refresh (optional: make refresh ARGS='--secrets')"
	@echo "  make secrets          AWS Secrets Manager -> Server/.env (REGION=$(REGION), PROFILE optional)"
	@echo "  make migrate          flask db upgrade (operators only; see warning in recipe)"
	@echo "  make test / test-all Client + Server tests"
	@echo "  make test-fe          Client Vitest (pnpm test:run)"
	@echo "  make test-be          Server pytest"
	@echo "  make dev              Web + backend via scripts/run/run-web.sh"
	@echo "  make dev-web          Vite web only"
	@echo "  make dev-backend      Backend stack only"
	@echo "  make precommit        pre-commit run --all-files"
	@echo "  make lint / lint-all  ./scripts/run-all-linters.sh all"
	@echo "  make lint-client      cd Client && pnpm lint"
	@echo "  make lint-server      ./scripts/run-all-linters.sh server"
	@echo "  make typecheck        cd Client && pnpm typecheck"
	@echo "  make check-client     cd Client && pnpm check"
	@echo "  make openapi          Regenerate client + server types from openapi/ (bundle + codegen)"
	@echo "  make openapi-verify   Regenerate, fail if git drift, run contract tests + typecheck"
	@echo "  make format-client    cd Client && pnpm format"
	@echo "  make format-check     cd Client && pnpm format:check"
	@echo "  make mobile           cd Client && pnpm dev:mobile"

setup:
	bash "$(ROOT)/scripts/setup-local.sh" $(ARGS)

refresh:
	bash "$(ROOT)/scripts/refresh.sh" $(ARGS)

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
	cd "$(ROOT)/Server" && . .venv/bin/activate && pytest $(PYTEST_ARGS)

dev:
	bash "$(ROOT)/scripts/run/run-web.sh"

dev-web:
	cd "$(ROOT)/Client" && pnpm dev:web

dev-backend:
	bash "$(ROOT)/scripts/run/run-backend.sh"

pre-commit precommit:
	@cd "$(ROOT)" && { \
		for pc in "$(ROOT)/Server/.venv/bin/pre-commit" "$(ROOT)/Server/venv/bin/pre-commit"; do \
			if [[ -x "$$pc" ]]; then "$$pc" run --all-files; exit $$?; fi; \
		done; \
		for py in "$(ROOT)/Server/.venv/bin/python3" "$(ROOT)/Server/.venv/bin/python"; do \
			if [[ -x "$$py" ]] && "$$py" -m pre_commit version >/dev/null 2>&1; then "$$py" -m pre_commit run --all-files; exit $$?; fi; \
		done; \
		if command -v pre-commit >/dev/null 2>&1; then pre-commit run --all-files; exit $$?; fi; \
		if python3 -m pre_commit version >/dev/null 2>&1; then python3 -m pre_commit run --all-files; exit $$?; fi; \
		echo "error: pre-commit not found. Run: make setup   (or: pip install pre-commit in Server/.venv — see Server/requirements/dev.txt)" >&2; \
		exit 127; \
	}

lint lint-all:
	bash "$(ROOT)/scripts/run-all-linters.sh" all

lint-client:
	cd "$(ROOT)/Client" && pnpm lint

lint-server:
	bash "$(ROOT)/scripts/run-all-linters.sh" server

typecheck:
	cd "$(ROOT)/Client" && pnpm typecheck

check-client:
	cd "$(ROOT)/Client" && pnpm check

openapi:
	npm run openapi:generate --prefix "$(ROOT)"

openapi-verify:
	bash "$(ROOT)/scripts/sync-openapi.sh"

# Back-compat alias
generate-api: openapi

format-client:
	cd "$(ROOT)/Client" && pnpm format

format-check:
	cd "$(ROOT)/Client" && pnpm format:check

mobile:
	cd "$(ROOT)/Client" && pnpm dev:mobile
