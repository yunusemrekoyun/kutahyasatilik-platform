"use client";

import { useEffect, useState } from "react";

export type UtmData = {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  referrer?: string;
  pagePath?: string;
};

// Google Ads / kaynak takibi: ilk girişte URL'den UTM'leri yakalar ve saklar.
export function useUtm(): UtmData {
  const [utm, setUtm] = useState<UtmData>({});

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      try {
        const params = new URLSearchParams(window.location.search);
        const fromUrl = {
          utmSource: params.get("utm_source") || params.get("gclid") ? (params.get("utm_source") || "google-ads") : undefined,
          utmMedium: params.get("utm_medium") || undefined,
          utmCampaign: params.get("utm_campaign") || undefined,
        };
        // Sakla (oturum boyunca)
        const stored = JSON.parse(sessionStorage.getItem("ks_utm") || "{}");
        const merged = {
          utmSource: fromUrl.utmSource || stored.utmSource,
          utmMedium: fromUrl.utmMedium || stored.utmMedium,
          utmCampaign: fromUrl.utmCampaign || stored.utmCampaign,
        };
        if (fromUrl.utmSource || fromUrl.utmMedium || fromUrl.utmCampaign) {
          sessionStorage.setItem("ks_utm", JSON.stringify(merged));
        }
        setUtm({
          ...merged,
          referrer: document.referrer || undefined,
          pagePath: window.location.pathname,
        });
      } catch {
        setUtm({ pagePath: typeof window !== "undefined" ? window.location.pathname : undefined });
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return utm;
}
