# Kütahya Satılık — Production Güncelleme Rehberi

Bu belge, hâlihazırda çalışan VPS kurulumunda web/API uygulamasını güncellemek
içindir. Sunucunun genel nginx, TLS, DNS veya diğer uygulama ayarlarını değiştirmez.

## Canlı mimari

| Bileşen | Değer |
| --- | --- |
| Git çalışma dizini | `/var/www/kutahyasatilik.com/app` |
| Kalıcı kullanıcı medyası | `/var/www/kutahyasatilik.com/uploads` |
| systemd servisi | `kutahyasatilik.service` |
| Standalone çalışma dizini | `/var/www/kutahyasatilik.com/app/.next/standalone` |
| Uygulama portu | `127.0.0.1:3003` |
| Yerel health endpoint | `http://127.0.0.1:3003/api/health` |

`uploads` uygulama dizininin dışındadır ve deploy sırasında kopyalanmaz, taşınmaz
veya silinmez. `.env` yalnız uygulama dizininde tutulur; Git'e veya standalone
çıktısına girmez.

Mevcut systemd unit'i şu sözleşmeyi korumalıdır:

- `WorkingDirectory=/var/www/kutahyasatilik.com/app/.next/standalone`
- `EnvironmentFile=/var/www/kutahyasatilik.com/app/.env`
- `NODE_ENV=production` ve `PORT=3003`
- başlangıç komutu standalone `server.js` dosyasını çalıştırır

Unit dosyasını değiştirmeden önce mevcut tanımı `systemctl cat
kutahyasatilik.service` ile inceleyin. Bu projeyi güncellerken başka servisleri
restart etmeyin.

## Deploy öncesi koşullar

- Uygulama dizini `main` branch'inde ve tamamen temiz olmalıdır. Kirli dosyaları
  otomatik silmeyin veya stash'e taşımayın; önce nedenini inceleyin.
- `/var/www/kutahyasatilik.com/app/.env` bulunmalı ve dosya izni `0600` olmalıdır.
- `.env` içindeki `UPLOAD_DIR`, `/var/www/kutahyasatilik.com/uploads` olmalıdır.
- `.env` içinde `PUSH_ENABLED` **açıkça** `true` ya da `false` olmalıdır (eksik
  bırakılmamalı). Push açılacaksa önce "Push'u açma" bölümüne bakın.
- `npm run build` artık önce `.next/standalone`'u siliyor (`scripts/clean-build.mjs`).
  Bu ADIM ATLANMAMALIDIR: Next, standalone altındaki ön-render edilmiş HTML'i her
  zaman yenilemiyor; bir önceki build'den kalan `index.html` artık üretilmeyen
  chunk adlarına işaret ediyor ve ana sayfada CSS/JS 404 veriyor. Sunucu 200
  döndüğü, health check geçtiği için sorun sessiz kalır — yalnız tarayıcıda
  stilsiz/işlevsiz bir sayfa olarak görünür.
- Kullanıcı trafiği açılmadan önce veritabanı yedeği ve geri yükleme tatbikatı
  ayrıca doğrulanmalıdır.
- Production'da `seed`, `setup:demo`, `seed:bulk`, `seed:media` veya `db:reset`
  komutlarından hiçbirini çalıştırmayın.

## Git geçmişi temizliğinden sonraki tek seferlik eşitleme

Git geçmişi güvenlik nedeniyle yeniden yazıldıysa VPS'deki eski `main`, yeni
`origin/main` ile fast-forward olmayabilir. Yalnız bu durumda ve çalışma ağacı
tamamen temizken aşağıdaki kontrollü eşitlemeyi bir kez uygulayın. Bu işlem
`.env` ve uygulama dışındaki kalıcı `uploads` dizinine dokunmaz:

```bash
set -Eeuo pipefail
APP="/var/www/kutahyasatilik.com/app"

test "$(realpath "$APP")" = "$APP"
cd "$APP"
test "$(git branch --show-current)" = "main"
test -z "$(git status --porcelain --untracked-files=all)"
git check-ignore -q .env
git fetch origin main
git reset --hard origin/main
test -z "$(git status --porcelain --untracked-files=all)"
```

Bundan sonraki güncellemelerde aşağıdaki normal `git pull --ff-only` akışı
kullanılır.

## Güncelleme

Aşağıdaki komutlar uygulama dizinini doğrular, yalnız fast-forward Git güncellemesi
yapar, bağımlılıkları kilit dosyasından kurar, migration ve idempotent firma
backfill'ini çalıştırır, standalone çıktıyı üretir ve yalnız ilgili servisi yeniden
başlatır.

```bash
set -Eeuo pipefail
export LC_ALL=C

APP="/var/www/kutahyasatilik.com/app"
UPLOADS="/var/www/kutahyasatilik.com/uploads"
SERVICE="kutahyasatilik.service"
HEALTH_URL="http://127.0.0.1:3003/api/health"

fail() {
  echo "HATA: $*" >&2
  exit 1
}

test -d "$APP/.git" || fail "Uygulama dizini Git çalışma ağacı değil"
test -d "$UPLOADS" || fail "Kalıcı upload dizini bulunamadı"
test "$(realpath "$APP")" = "$APP" || fail "Uygulama yolu doğrulanamadı"
test "$(realpath "$UPLOADS")" = "$UPLOADS" || fail "Upload yolu doğrulanamadı"
test -f "$APP/.env" || fail "Production .env bulunamadı"
test "$(stat -c '%a' "$APP/.env")" = "600" || fail ".env izni 0600 değil"
grep -Eq '^UPLOAD_DIR="?/var/www/kutahyasatilik\.com/uploads"?[[:space:]]*$' "$APP/.env" \
  || fail "UPLOAD_DIR kalıcı dizini göstermiyor"
# PUSH_ENABLED bilinçli bir karar olmalı; kapı "false" dayatmıyor çünkü push
# açıldığı gün bu satır deploy'u kilitliyordu.
grep -Eq '^PUSH_ENABLED="?(true|false)"?[[:space:]]*$' "$APP/.env" \
  || fail "PUSH_ENABLED açıkça true ya da false olmalı"
# Push açıksa worker'ın kimliği ve zamanlayıcısı da yerinde olmalı.
if grep -Eq '^PUSH_ENABLED="?true"?[[:space:]]*$' "$APP/.env"; then
  grep -Eq '^CRON_SECRET=".{32,}"[[:space:]]*$' "$APP/.env" \
    || fail "PUSH_ENABLED=true ama CRON_SECRET yok/kısa (en az 32 karakter)"
  systemctl is-enabled --quiet kutahyasatilik-push.timer \
    || fail "PUSH_ENABLED=true ama kutahyasatilik-push.timer etkin değil"
fi

cd "$APP"
test "$(git branch --show-current)" = "main" || fail "Aktif branch main değil"
test -z "$(git status --porcelain --untracked-files=all)" \
  || fail "Git çalışma ağacı temiz değil"
git check-ignore -q .env || fail ".env Git tarafından ignore edilmiyor"
if git ls-files --error-unmatch .env >/dev/null 2>&1; then
  fail ".env Git tarafından izleniyor"
fi

systemctl is-active --quiet "$SERVICE" || fail "Canlı servis aktif değil"
SERVICE_CWD="$(systemctl show "$SERVICE" --property=WorkingDirectory --value)"
test "$SERVICE_CWD" = "$APP/.next/standalone" \
  || fail "Servisin standalone çalışma dizini beklenenden farklı"
curl --fail --silent --show-error --max-time 15 "$HEALTH_URL" >/dev/null \
  || fail "Deploy öncesi health kontrolü başarısız"

PREVIOUS_COMMIT="$(git rev-parse HEAD)"
printf "Deploy başlıyor. Geri dönüş commit'i: %s\n" "$PREVIOUS_COMMIT"
git fetch --prune origin main
git pull --ff-only origin main
test -z "$(git status --porcelain --untracked-files=all)" \
  || fail "Git güncellemesi sonrasında çalışma ağacı temiz değil"
DEPLOY_COMMIT="$(git rev-parse HEAD)"

npm ci
npx prisma migrate deploy
npm run backfill:agencies
npm run build
npm run prepare:standalone
npm run check:standalone

systemctl restart "$SERVICE"
systemctl is-active --quiet "$SERVICE" || fail "Servis restart sonrasında aktif değil"

# Health kontrolü BEKLEYEREK yapılır. systemctl restart, süreç doğar doğmaz
# döner; Next.js standalone ise portu bir-iki saniye sonra bağlıyor. Tek atışlık
# curl bu yüzden "Couldn't connect after 0 ms" ile düşüp çalışan bir deploy'u
# başarısız gösteriyordu — servis ayakta, sadece henüz dinlemiyor.
for attempt in $(seq 1 20); do
  if curl --fail --silent --max-time 5 "$HEALTH_URL" >/dev/null 2>&1; then
    echo "Health OK (${attempt}. denemede)"
    break
  fi
  test "$attempt" -lt 20 || fail "Deploy sonrası health kontrolü 20 denemede başarısız"
  sleep 2
done

printf 'Deploy tamamlandı. Önceki commit: %s, çalışan commit: %s\n' \
  "$PREVIOUS_COMMIT" "$DEPLOY_COMMIT"
```

`npm run build`, Next.js derlemesine ek olarak standalone sanitizer ve içerik/boyut
kontrolünü de çalıştırır. `npm run prepare:standalone` yalnız gerekli statik
dosyaları çıktıya ekler; kalıcı kullanıcı medyasını eklemez.

`npx prisma migrate deploy` yalnız kayıtlı migration'ları uygular.
`npm run backfill:agencies` yalnız eksik firma ilişkilerini idempotent biçimde
tamamlar; oluşturduğu firmaları otomatik onaylamaz veya kamuya açmaz.

## Deploy sonrası kontrol

Yerel health kontrolünden sonra public endpoint ve temel kullanıcı akışlarını
doğrulayın:

```bash
curl --fail --silent --show-error --max-time 15 \
  "https://kutahyasatilik.com/api/health"

systemctl status kutahyasatilik.service --no-pager
journalctl -u kutahyasatilik.service --since "10 minutes ago" --no-pager
```

Kontrol listesi:

- Ana sayfa, ilan listesi ve bir ilan detayı açılıyor.
- Görseller kalıcı upload dizininden yükleniyor.
- Giriş ve yalnız yetkili kullanıcıya açık ekranlar doğru davranıyor.
- `/api/health` hem localhost hem public URL üzerinden HTTP 200 dönüyor.
- `PUSH_ENABLED=false` olduğu sürece push worker gerçek gönderim yapmıyor.
- Push açıksa: `systemctl list-timers kutahyasatilik-push.timer` bir sonraki
  tetiklemeyi gösteriyor ve `journalctl -u kutahyasatilik-push -n 20` temiz.

Logları paylaşmadan önce erişim belirteci, e-posta, telefon ve diğer kişisel
verileri ayıklayın.

## Hata ve rollback

Build, migration veya backfill başarısız olursa servis restart edilmez; çalışan
proses değiştirilmeden kalır. Restart sonrasında health başarısızsa önce:

```bash
systemctl status kutahyasatilik.service --no-pager
journalctl -u kutahyasatilik.service -n 100 --no-pager
```

ile nedeni inceleyin.

Kod rollback'i yalnız deploy öncesinde ekrana yazılan kesin commit'e ve temiz
çalışma ağacında yapılmalıdır. Migration'lar otomatik geri alınmaz; veritabanı
rollback'i ayrı, kontrollü bir işlemdir. Yeni migration eski kodla geriye uyumlu
değilse önce veri planı hazırlamadan kod rollback'i yapmayın.

Geriye uyumlu bir değişiklikte uygulama kodunu önceki commit'ten çalıştırmak için:

```bash
cd /var/www/kutahyasatilik.com/app
test -z "$(git status --porcelain --untracked-files=all)"
ROLLBACK_COMMIT="DEPLOY_ONCESI_TAM_COMMIT_SHA"
git rev-parse --verify "${ROLLBACK_COMMIT}^{commit}" >/dev/null
git switch --detach "$ROLLBACK_COMMIT"
npm ci
npm run build
npm run prepare:standalone
npm run check:standalone
systemctl restart kutahyasatilik.service
curl --fail --silent --show-error --max-time 15 \
  "http://127.0.0.1:3003/api/health" >/dev/null
```

Olay giderildikten sonra tekrar `main` branch'ine dönün ve normal deploy akışını
uygulayın. Upload dizinini veya diğer VPS projelerini rollback kapsamında
değiştirmeyin.

## Push'u açma

Push altyapısının tamamı (outbox, retry, receipt, deep link) yazılı ve testli;
uzun süre eksik olan tek şey **tetikleyiciydi**. Sıra önemli:

1. **Kuyruğu kontrol et.** `PUSH_ENABLED` uzun süre kapalı kaldıysa outbox
   birikmiştir. `PUSH_MAX_QUEUE_AGE_HOURS` (varsayılan 72) bundan eski
   teslimatları göndermeden `failed` yapar. Açmadan önce bekleyen sayısına bak:

   ```sql
   SELECT count(*), min("createdAt") FROM "PushDelivery" WHERE status = 'pending';
   ```

   Bu filtre olmadan açmak, aylar öncesine ait bildirimleri kullanıcılara gönderir.

2. **Env değerlerini gir** (`.env`, `0600`):
   `CRON_SECRET` (≥32 karakter), `EXPO_ACCESS_TOKEN`, `PUSH_MAX_QUEUE_AGE_HOURS`,
   ve deep link için `APPLE_TEAM_ID` + `ANDROID_APP_LINK_SHA256_CERT_FINGERPRINTS`.
   Bunlar boşken `.well-known` dosyaları 404 döner ve bildirime tıklama
   universal link olarak çalışmaz (yalnız uygulama içi yönlendirme).

3. **Zamanlayıcıyı kur:**

   ```bash
   cp deploy/kutahyasatilik-push.* /etc/systemd/system/
   systemctl daemon-reload
   systemctl enable --now kutahyasatilik-push.timer
   systemctl list-timers kutahyasatilik-push.timer
   ```

4. **`PUSH_ENABLED=true`** yap ve servisi yeniden başlat.

5. **Doğrula:** worker kimliksiz çağrıda 401 dönmeli, kimlikli çağrıda sayaç:

   ```bash
   curl -s -o /dev/null -w '%{http_code}\n' -X POST \
     http://127.0.0.1:3003/api/internal/push/dispatch          # 401 bekleniyor
   ```

6. **Fiziksel cihazda** foreground / background / killed tıklama, izin reddi,
   çıkış ve geçersiz token senaryolarını çalıştır.
