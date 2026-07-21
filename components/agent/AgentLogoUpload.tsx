"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { mediaUrl } from "@/lib/media";

// Emlakçı profil logosu / avatarı yükleme alanı. Tek görsel seçer, /api/upload'a
// yükler, dönen URL'i gizli input (name="logo") içinde tutar; yuvarlak önizleme gösterir.
export default function AgentLogoUpload({ initialLogo }: { initialLogo?: string | null }) {
  const [logo, setLogo] = useState<string>(initialLogo ?? "");
  const [uploading, setUploading] = useState(false);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("files", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (data.ok && data.urls?.[0]) setLogo(data.urls[0]);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  return (
    <div className="flex items-center gap-4">
      <input type="hidden" name="logo" value={logo} />
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full ring-1 ring-stone">
        {logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={mediaUrl(logo)} alt="Logo" className="h-full w-full rounded-full object-cover" />
        ) : (
          <div className="grid h-full w-full place-items-center rounded-full bg-brand-50 text-xs text-brand-700">
            Logo
          </div>
        )}
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="inline-flex w-fit cursor-pointer items-center rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-brand-400 hover:text-brand-600">
          {uploading ? "Yükleniyor..." : logo ? "Değiştir" : "Logo Yükle"}
          <input type="file" accept="image/*" onChange={handleUpload} className="hidden" />
        </label>
        {logo && (
          <button
            type="button"
            onClick={() => setLogo("")}
            className="inline-flex w-fit items-center gap-1 text-xs text-red-600 hover:text-red-700"
          >
            <X className="h-3.5 w-3.5" /> Kaldır
          </button>
        )}
      </div>
    </div>
  );
}
