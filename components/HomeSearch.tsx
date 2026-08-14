"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { DISTRICTS } from "@/lib/constants";
import { CATEGORY_LIST } from "@/lib/categories";

/**
 * Ana sayfa araması.
 *
 * `kategori` zorunlu bir parametre: /ilanlar kategorisiz çağrıldığında liste
 * değil kategori seçim ekranı çiziyor, yani kategorisiz gönderilen bir arama
 * kullanıcıyı sonuca değil başa götürüyordu. Tür listesi de sabit emlak
 * dizisinden değil seçili kategorinin alt türlerinden üretiliyor.
 */
export default function HomeSearch() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [kategori, setKategori] = useState<string>(CATEGORY_LIST[0]?.key ?? "emlak");
  const [tur, setTur] = useState("");
  const [ilce, setIlce] = useState("");

  const subTypes = CATEGORY_LIST.find((c) => c.key === kategori)?.subTypes ?? [];

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const p = new URLSearchParams();
    p.set("kategori", kategori);
    if (q.trim()) p.set("q", q.trim());
    if (tur) p.set("tur", tur);
    if (ilce) p.set("ilce", ilce);
    router.push(`/ilanlar?${p.toString()}`);
  }

  const labelCls = "mb-2 block text-left text-[11px] font-bold uppercase tracking-[0.12em] text-muted";
  const fieldCls =
    "h-12 w-full rounded-control border border-stone bg-paper px-3.5 text-[15px] text-ink outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20";

  return (
    <form role="search" aria-label="İlan arama" onSubmit={submit} className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5 xl:items-end">
      <div className="xl:col-span-1">
        <label htmlFor="hs-q" className={labelCls}>Anahtar Kelime</label>
        <div className="relative">
          <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted/70" />
          <input
            id="hs-q"
            type="search"
            autoComplete="off"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="İlan no veya kelime"
            className={`${fieldCls} pl-10`}
          />
        </div>
      </div>
      <div>
        <label htmlFor="hs-kategori" className={labelCls}>Kategori</label>
        <select
          id="hs-kategori"
          value={kategori}
          onChange={(e) => { setKategori(e.target.value); setTur(""); }}
          className={fieldCls}
        >
          {CATEGORY_LIST.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor="hs-tur" className={labelCls}>Tür Seçiniz</label>
        <select id="hs-tur" value={tur} onChange={(e) => setTur(e.target.value)} className={fieldCls}>
          <option value="">Tüm Türler</option>
          {subTypes.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor="hs-ilce" className={labelCls}>İlçe Seçiniz</label>
        <select id="hs-ilce" value={ilce} onChange={(e) => setIlce(e.target.value)} className={fieldCls}>
          <option value="">Tüm İlçeler</option>
          {DISTRICTS.map((d) => <option key={d.slug} value={d.name}>{d.name}</option>)}
        </select>
      </div>
      <button
        type="submit"
        className="inline-flex h-12 items-center justify-center gap-2 rounded-control bg-brand-700 px-5 text-[15px] font-semibold text-white transition-colors hover:bg-brand-800"
      >
        <Search aria-hidden="true" className="h-5 w-5" /> Arama Yap
      </button>
    </form>
  );
}
