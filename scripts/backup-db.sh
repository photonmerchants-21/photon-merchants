#!/usr/bin/env bash
# Daily Postgres backup for Photon Medusa (Phase 8.2).
# Usage:
#   ./scripts/backup-db.sh
# Cron example (02:15 daily):
#   15 2 * * * /path/to/photon/scripts/backup-db.sh >> /var/log/photon-backup.log 2>&1

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BACKUP_DIR="${PHOTON_BACKUP_DIR:-$ROOT/backups}"
STAMP="$(date +%Y%m%d-%H%M%S)"
OUT="$BACKUP_DIR/photon_medusa-$STAMP.dump"

# Prefer DATABASE_URL from backend .env when present
if [[ -f "$ROOT/backend/apps/backend/.env" ]]; then
  # shellcheck disable=SC1091
  set -a
  # Only pull DATABASE_URL without sourcing secrets into the shell unnecessarily
  DATABASE_URL="$(grep -E '^DATABASE_URL=' "$ROOT/backend/apps/backend/.env" | cut -d= -f2-)"
  set +a
fi

DATABASE_URL="${DATABASE_URL:-postgresql://daniel@localhost:5432/photon_medusa}"

mkdir -p "$BACKUP_DIR"

echo "[photon-backup] Writing $OUT"
pg_dump --format=custom --file="$OUT" "$DATABASE_URL"

# Keep last 14 dumps (macOS-safe; no GNU xargs -r)
while IFS= read -r old; do
  rm -f "$old"
done < <(ls -1t "$BACKUP_DIR"/photon_medusa-*.dump 2>/dev/null | tail -n +15)

echo "[photon-backup] Done ($(du -h "$OUT" | cut -f1))"
echo "$OUT"
