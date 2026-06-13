#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# Yedekten geri yükleme (kayıp durumunda zahmetsiz dönüş).
# Gereksinim: postgresql-client (psql), gunzip.
#
# Kullanım:
#   scripts/restore-db.sh                 # backups/ içindeki EN YENİ yedeği yükler
#   scripts/restore-db.sh yedek.sql.gz    # belirli bir yedeği yükler
#   FORCE=1 scripts/restore-db.sh ...      # onay sormadan (otomasyon için)
#
# Ortam: DIRECT_URL / DATABASE_URL -> hedef veritabanı. BACKUP_DIR -> yedek klasörü.
# Dump --clean --if-exists ile alındığı için mevcut public şema güvenle değiştirilir.
# ---------------------------------------------------------------------------
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
if [ -f "$ROOT/.env" ]; then set -a; . "$ROOT/.env"; set +a; fi

DB_URL="${DIRECT_URL:-${DATABASE_URL:-}}"
if [ -z "$DB_URL" ]; then echo "HATA: DIRECT_URL/DATABASE_URL tanımlı değil." >&2; exit 1; fi

BACKUP_DIR="${BACKUP_DIR:-$ROOT/backups}"
FILE="${1:-$(ls -t "$BACKUP_DIR"/kutahya-*.sql.gz 2>/dev/null | head -1 || true)}"
if [ -z "$FILE" ] || [ ! -f "$FILE" ]; then
  echo "HATA: Geri yüklenecek yedek bulunamadı ($BACKUP_DIR)." >&2; exit 1
fi

echo "!!! DİKKAT: Hedef veritabanı '$FILE' ile DEĞİŞTİRİLECEK."
if [ "${FORCE:-0}" != "1" ]; then
  printf "Devam etmek için EVET yazın: "
  read -r ans
  [ "$ans" = "EVET" ] || { echo "İptal edildi."; exit 1; }
fi

echo "[$(date '+%F %T')] Geri yükleniyor: $FILE"
gunzip -c "$FILE" | psql --quiet --set ON_ERROR_STOP=on "$DB_URL"
echo "[$(date '+%F %T')] Geri yükleme tamamlandı."
