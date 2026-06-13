"use client";

// Tarayıcı tarafı olay takibi: hem kendi DB'mize hem de Google Ads/Analytics'e gönderir.

type TrackPayload = {
  type: string;
  listingId?: string;
  district?: string;
};

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

function getSessionId(): string {
  try {
    let id = localStorage.getItem("ks_sid");
    if (!id) {
      id = Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem("ks_sid", id);
    }
    return id;
  } catch {
    return "anon";
  }
}

export function track(payload: TrackPayload) {
  try {
    const body = JSON.stringify({
      ...payload,
      pagePath: window.location.pathname,
      referrer: document.referrer || undefined,
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
export function trackConversion(payload: TrackPayload) {
  track({ ...payload, type: payload.type });
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
