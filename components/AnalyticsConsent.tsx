"use client";

import Script from "next/script";
import { useEffect, useRef, useSyncExternalStore } from "react";

const KEY = "ks_analytics_consent";
const CHANGE_EVENT = "ks-consent-change";
type Consent = "granted" | "denied" | "unknown" | "loading";
let forcePanelOpen = false;
let focusPanelOnOpen = false;
let panelOpenedFromSettings = false;

function subscribe(onStoreChange: () => void) {
  const handleOpen = () => {
    forcePanelOpen = true;
    focusPanelOnOpen = true;
    panelOpenedFromSettings = true;
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
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (consent !== "unknown" || !focusPanelOnOpen) return;
    focusPanelOnOpen = false;
    panelRef.current?.focus();
  }, [consent]);

  function choose(value: "granted" | "denied") {
    const restoreSettingsFocus = panelOpenedFromSettings;
    forcePanelOpen = false;
    panelOpenedFromSettings = false;
    globalThis.localStorage?.setItem(KEY, value);
    globalThis.dispatchEvent(new Event(CHANGE_EVENT));
    if (restoreSettingsFocus) {
      requestAnimationFrame(() => document.getElementById("consent-settings-link")?.focus());
    }
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
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="false"
          aria-labelledby="analytics-consent-title"
          aria-describedby="analytics-consent-description"
          tabIndex={-1}
          className="fixed inset-x-3 bottom-3 z-[100] mx-auto max-w-3xl rounded-control bg-brand-950 p-4 text-white shadow-2xl ring-1 ring-white/15 outline-none sm:flex sm:items-center sm:gap-5 sm:p-5"
        >
          <h2 id="analytics-consent-title" className="sr-only">Çerez ve analiz tercihi</h2>
          <p id="analytics-consent-description" className="flex-1 text-sm leading-relaxed text-brand-100">
            Siteyi geliştirmek için anonim kullanım ölçümü yapmak istiyoruz. Zorunlu işlevler analiz izninden bağımsız çalışır.
          </p>
          <div className="mt-3 flex shrink-0 gap-2 sm:mt-0">
            <button type="button" onClick={() => choose("denied")} className="min-h-11 flex-1 rounded-control border border-white/30 px-4 text-sm font-semibold sm:flex-none">Reddet</button>
            <button type="button" onClick={() => choose("granted")} className="min-h-11 flex-1 rounded-control bg-paper px-4 text-sm font-semibold text-brand-900 sm:flex-none">Kabul et</button>
          </div>
        </div>
      ) : null}
    </>
  );
}
