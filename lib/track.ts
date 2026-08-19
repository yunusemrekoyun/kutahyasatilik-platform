"use client";

// Tarayıcı tarafı olay takibi: hem kendi DB'mize hem de Google Ads/Analytics'e gönderir.

type TrackPayload = {
  type: string;
  listingId?: string;
  postId?: string;
  district?: string;
};

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

/**
 * Analiz izni verildi mi? (AnalyticsConsent.tsx ile AYNI anahtar.)
 *
 * İzin eskiden yalnız Google Analytics/Ads script'ini kapatıyordu; birinci taraf
 * takibimiz "Reddet" diyen kullanıcıda da kalıcı bir kimlikle çalışmaya devam
 * ediyordu. Onay metni "anonim kullanım ölçümü" diyor — kalıcı bir tanımlayıcı
 * bu vaadi karşılamıyor.
 */
function analyticsGranted(): boolean {
  try {
    return globalThis.localStorage?.getItem("ks_analytics_consent") === "granted";
  } catch {
    return false;
  }
}

/**
 * Kalıcı oturum kimliği YALNIZ izin varken üretilir ve saklanır.
 *
 * İzin yoksa null döner ve daha önce yazılmış kimlik de silinir: kullanıcı
 * kabul edip sonra reddettiğinde eski kimliğin sürmesi, reddi anlamsız kılardı.
 * Olayın kendisi yine gönderilir — ilan görüntülenme sayacı buna bağlı ve bu,
 * onay metnindeki "zorunlu işlevler" tarafında kalan hizmet verisi. Sayaç artık
 * kime ait olduğu bilinmeyen, gerçekten anonim bir olaydan besleniyor.
 */
function getSessionId(): string | undefined {
  try {
    if (!analyticsGranted()) {
      localStorage.removeItem("ks_sid");
      return undefined;
    }
    let id = localStorage.getItem("ks_sid");
    if (!id) {
      id = Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem("ks_sid", id);
    }
    return id;
  } catch {
    return undefined;
  }
}

export function track(payload: TrackPayload) {
  try {
    const granted = analyticsGranted();
    const body = JSON.stringify({
      ...payload,
      pagePath: window.location.pathname,
      // Yönlendiren adres izne bağlı: kullanıcının hangi siteden geldiği,
      // ölçümü reddettiğinde saklamamız gereken bir bilgi değil.
      referrer: granted ? document.referrer || undefined : undefined,
      sessionId: getSessionId(),
    });
    // Sayfa kapanırken bile gitsin diye sendBeacon tercih edilir.
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/track", new Blob([body], { type: "application/json" }));
    } else {
      fetch("/api/track", { method: "POST", body, keepalive: true, headers: { "Content-Type": "application/json" } });
    }
  } catch {
    /* yut */
  }
}

// Google Ads dönüşüm + olay
// Yalnız Google Ads/Analytics'e dönüşüm gönderir; kendi DB'mize YAZMAZ.
// Form dönüşümlerinde (satıcı/talep/değerleme) AnalyticsEvent'i SUNUCU /api/leads yazar;
// istemci de yazarsa aynı dönüşüm İKİ kez sayılır. Bu yüzden formlar bunu kullanmalı.
export function trackAdsConversion(payload: TrackPayload) {
  try {
    if (window.gtag) {
      window.gtag("event", payload.type, {
        send_to: process.env.NEXT_PUBLIC_ADS_CONVERSION_LABEL || undefined,
        listing_id: payload.listingId,
        district: payload.district,
      });
    }
  } catch {
    /* yut */
  }
}

// DB event'i + Google Ads. Sunucuda loglanMAYAN olaylar (telefon/whatsapp tıklaması) için;
// bunların tek kaydı istemci olduğundan /api/track'e yazması gerekir.
export function trackConversion(payload: TrackPayload) {
  track({ ...payload, type: payload.type });
  trackAdsConversion(payload);
}
