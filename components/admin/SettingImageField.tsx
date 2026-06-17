"use client";

import { useState } from "react";
import { Upload, X } from "lucide-react";

export default function SettingImageField({
  name,
  defaultValue = "",
}: {
  name: string;
  defaultValue?: string;
}) {
  const [url, setUrl] = useState(defaultValue);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setErr("");
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("files", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok || !data.ok || !data.urls?.[0]) throw new Error(data.error || "Yükleme başarısız");
      setUrl(data.urls[0] as string);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Yükleme hatası");
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  }

  return (
    <div>
      {/* Form ile gönderilen değer */}
      <input type="hidden" name={name} value={url} />

      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="/uploads/... veya https://..."
          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
        />
        <label className="inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-lg bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-800">
          <Upload className="h-4 w-4" /> {busy ? "Yükleniyor..." : "Görsel Seç"}
          <input type="file" accept="image/*" className="hidden" onChange={onPick} disabled={busy} />
        </label>
      </div>

      {err && <p className="mt-1.5 text-xs font-medium text-red-600">{err}</p>}

      {url && (
        <div className="relative mt-2 inline-block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt="Önizleme" className="h-28 w-full rounded-lg object-cover ring-1 ring-slate-200 sm:w-72" />
          <button
            type="button"
            onClick={() => setUrl("")}
            aria-label="Görseli kaldır"
            className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-black/60 text-white hover:bg-black/80"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
