"use client";

export default function ConsentSettingsLink() {
  return (
    <button
      id="consent-settings-link"
      type="button"
      onClick={() => globalThis.dispatchEvent(new Event("ks-consent-open"))}
      className="inline-flex min-h-11 items-center hover:text-gold-300"
    >
      Çerez tercihleri
    </button>
  );
}
