"use client";

export default function ConsentSettingsLink() {
  return (
    <button type="button" onClick={() => globalThis.dispatchEvent(new Event("ks-consent-open"))} className="hover:text-gold-300">
      Çerez tercihleri
    </button>
  );
}
