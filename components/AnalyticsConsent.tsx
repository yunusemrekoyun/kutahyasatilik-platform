"use client";

import Script from "next/script";
import { useSyncExternalStore } from "react";

const KEY = "ks_analytics_consent";
const CHANGE_EVENT = "ks-consent-change";
type Consent = "granted" | "denied" | "unknown" | "loading";
let forcePanelOpen = false;

function subscribe(onStoreChange: () => void) {
  const handleOpen = () => {
    forcePanelOpen = true;
    onStoreChange();
  };
  globalThis.addEventListener("storage", onStoreChange);
  globalThis.addEventListener(CHANGE_EVENT, onStoreChange);
  globalThis.addEventListener("ks-consent-open", handleOpen);
  return () => {
    globalThis.removeEventListener("storage", onStoreChange);
    globalThis.removeEventListener(CHANGE_EVENT, onStoreChange);
    globalThis.removeEventListener("ks-consent-open", handleOpen);
  };
}

function getSnapshot(): Consent {
  if (forcePanelOpen) return "unknown";
  const stored = globalThis.localStorage?.getItem(KEY);
  return stored === "granted" || stored === "denied" ? stored : "unknown";
}

export default function AnalyticsConsent({ gaId, gtagId }: { gaId?: string; gtagId?: string }) {
  const consent = useSyncExternalStore(subscribe, getSnapshot, () => "loading");

  function choose(value: "granted" | "denied") {
    forcePanelOpen = false;
    globalThis.localStorage?.setItem(KEY, value);
    globalThis.dispatchEvent(new Event(CHANGE_EVENT));
  }

  const measurementId = gaId || gtagId;
  return (
    <>
      {consent === "granted" && measurementId ? (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`} strategy="afterInteractive" />
          <Script id="gtag-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              ${gaId ? `gtag('config', '${gaId}', { anonymize_ip: true });` : ""}
              ${gtagId ? `gtag('config', '${gtagId}', { anonymize_ip: true });` : ""}
            `}
          </Script>
        </>
      ) : null}
      {consent === "unknown" ? (
        <div role="dialog" aria-label="Çerez ve analiz tercihi" className="fixed inset-x-3 bottom-3 z-[100] mx-auto max-w-3xl rounded-lg bg-brand-950 p-4 text-white shadow-2xl ring-1 ring-white/15 sm:flex sm:items-center sm:gap-5 sm:p-5">
          <p className="flex-1 text-sm leading-relaxed text-brand-100">
            Siteyi geliştirmek için anonim kullanım ölçümü yapmak istiyoruz. Zorunlu işlevler analiz izninden bağımsız çalışır.
          </p>
          <div className="mt-3 flex shrink-0 gap-2 sm:mt-0">
            <button type="button" onClick={() => choose("denied")} className="min-h-11 flex-1 rounded-lg border border-white/30 px-4 text-sm font-semibold sm:flex-none">Reddet</button>
            <button type="button" onClick={() => choose("granted")} className="min-h-11 flex-1 rounded-lg bg-paper px-4 text-sm font-semibold text-brand-900 sm:flex-none">Kabul et</button>
          </div>
        </div>
      ) : null}
    </>
  );
}
