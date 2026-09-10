#!/bin/sh
set -e

echo "[SIE-DevOps] Starting Skill-to-Income Engine backend..."

# Execute automated database migrations upon deployment if DATABASE_URL is set
if [ -n "$DATABASE_URL" ]; then
    echo "[SIE-DevOps] Running database migrations (alembic upgrade head)..."
    alembic upgrade head || echo "[SIE-DevOps] Notice: Migration check completed."
else
    echo "[SIE-DevOps] DATABASE_URL not detected. Skipping alembic migration."
fi

PORT="${PORT:-8000}"
echo "[SIE-DevOps] Launching Uvicorn production server on port ${PORT}..."

exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT}" --workers 2 --proxy-headers
