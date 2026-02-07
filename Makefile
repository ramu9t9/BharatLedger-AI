# BharatLedger AI - Common commands
# Usage: make <target>

.PHONY: help up down logs venv install test start

help:
	@echo "BharatLedger AI - Available targets:"
	@echo "  make start   - Start all: Docker + backend + frontend (single command)"
	@echo "  make up      - Start Postgres and Redis (docker-compose up -d)"
	@echo "  make down    - Stop services (docker-compose down)"
	@echo "  make logs    - Tail docker-compose logs"
	@echo "  make venv    - Create Python venv (python -m venv venv)"
	@echo "  make install - Install backend deps (pip install -r backend/requirements.txt)"
	@echo "  make test    - Run backend tests (pytest backend/tests)"

start:
	py start.py

up:
	docker-compose up -d

down:
	docker-compose down

logs:
	docker-compose logs -f

venv:
	python -m venv venv
	@echo "Activate with: .\\venv\\Scripts\\Activate.ps1 (Windows) or source venv/bin/activate (Unix)"

install:
	pip install -r backend/requirements.txt

test:
	pytest backend/tests -v
