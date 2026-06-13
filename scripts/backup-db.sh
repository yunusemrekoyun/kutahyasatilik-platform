#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# Postgres yedeği: pg_dump -> gzip -> backups/ (+ opsiyonel R2).
# Cron ile günlük çalıştırın. Gereksinim: postgresql-client (pg_dump).
#
# Örnek cron (her gece 03:30):
#   30 3 * * * /path/proje/scripts/backup-db.sh >> /var/log/kutahya-backup.log 2>&1
#
# Ortam değişkenleri (.env'den veya cron ortamından):
#   DIRECT_URL / DATABASE_URL  -> kaynak veritabanı (DIRECT_URL tercih edilir)
#   BACKUP_DIR                 -> yedek klasörü (varsayılan: <proje>/backups)
#   RETENTION_DAYS             -> yerel saklama (varsayılan: 7 gün)
#   R2_REMOTE                  -> rclone remote'u, örn "r2:kutahya-backups" (opsiyonel)
# ---------------------------------------------------------------------------
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
if [ -f "$ROOT/.env" ]; then set -a; . "$ROOT/.env"; set +a; fi

DB_URL="${DIRECT_URL:-${DATABASE_URL:-}}"
if [ -z "$DB_URL" ]; then echo "HATA: DIRECT_URL/DATABASE_URL tanımlı değil." >&2; exit 1; fi

BACKUP_DIR="${BACKUP_DIR:-$ROOT/backups}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"
mkdir -p "$BACKUP_DIR"

STAMP="$(date +%Y%m%d-%H%M%S)"
FILE="$BACKUP_DIR/kutahya-$STAMP.sql.gz"

echo "[$(date '+%F %T')] Yedek alınıyor -> $FILE"
pg_dump --schema=public --no-owner --no-privileges --clean --if-exists "$DB_URL" \
  | gzip -9 > "$FILE"
echo "[$(date '+%F %T')] Boyut: $(du -h "$FILE" | cut -f1)"

# Opsiyonel: R2'ye (veya herhangi bir rclone remote'una) yükle.
if [ -n "${R2_REMOTE:-}" ]; then
  if command -v rclone >/dev/null 2>&1; then
    rclone copy "$FILE" "$R2_REMOTE/" && echo "[$(date '+%F %T')] R2'ye yüklendi: $R2_REMOTE"
  else
    echo "UYARI: R2_REMOTE tanımlı ama rclone kurulu değil; offsite yedek atlandı." >&2
  fi
fi

# Yerel saklama: eski yedekleri temizle.
find "$BACKUP_DIR" -name 'kutahya-*.sql.gz' -mtime "+$RETENTION_DAYS" -delete 2>/dev/null || true
echo "[$(date '+%F %T')] Tamamlandı."
