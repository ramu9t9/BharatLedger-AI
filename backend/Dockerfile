FROM python:3.11-slim

WORKDIR /app

# Install system deps for psycopg
RUN apt-get update && apt-get install -y --no-install-recommends libpq-dev && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy app and ai_engine (sibling in repo)
COPY app ./app
COPY alembic ./alembic
COPY alembic.ini .

# When building from repo root: COPY backend/... and COPY ai_engine/...
# so that PYTHONPATH can include ai_engine
ENV PYTHONPATH=/app
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
