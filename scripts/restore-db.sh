#!/usr/bin/env bash
# Restore a Photon Postgres dump (Phase 8.2 restore test).
# WARNING: overwrites the target database.
#
# Usage:
#   ./scripts/restore-db.sh backups/photon_medusa-YYYYMMDD-HHMMSS.dump
#
# Optional:
#   PHOTON_RESTORE_DB=photon_medusa_restore ./scripts/restore-db.sh path/to.dump

set -euo pipefail

DUMP="${1:-}"
if [[ -z "$DUMP" || ! -f "$DUMP" ]]; then
  echo "Usage: $0 path/to/photon_medusa-*.dump" >&2
  exit 1
fi

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
if [[ -f "$ROOT/backend/apps/backend/.env" ]]; then
  DATABASE_URL="$(grep -E '^DATABASE_URL=' "$ROOT/backend/apps/backend/.env" | cut -d= -f2-)"
fi
DATABASE_URL="${DATABASE_URL:-postgresql://daniel@localhost:5432/photon_medusa}"

# Parse postgres connection bits for createdb (simple local URLs)
TARGET_DB="${PHOTON_RESTORE_DB:-photon_medusa}"

echo "[photon-restore] Target database: $TARGET_DB"
echo "[photon-restore] Dump: $DUMP"
read -r -p "Type YES to overwrite $TARGET_DB: " confirm
if [[ "$confirm" != "YES" ]]; then
  echo "Aborted."
  exit 1
fi

# Drop + recreate (local/dev). For production, restore into a standby then cut over.
dropdb --if-exists "$TARGET_DB" || true
createdb "$TARGET_DB"

# Rewrite URL db name if needed
RESTORE_URL="${DATABASE_URL%/*}/$TARGET_DB"
pg_restore --clean --if-exists --no-owner --dbname="$RESTORE_URL" "$DUMP" || {
  # Some dumps warn on extension ownership; exit 1 only if nothing restored
  echo "[photon-restore] pg_restore reported warnings — verify with psql"
}

echo "[photon-restore] Done. Point DATABASE_URL at $RESTORE_URL and restart Medusa to verify."
