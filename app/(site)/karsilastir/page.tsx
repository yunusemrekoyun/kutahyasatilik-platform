"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowLeftRight, X, ArrowRight } from "lucide-react";
import { useStore } from "@/components/store/StoreProvider";
import { formatPrice } from "@/lib/format";
import { PROPERTY_TYPE_LABELS } from "@/lib/constants";

export default function ComparePage() {
  const { compare, toggleCompare, clearCompare, hydrated } = useStore();

  const rows: { label: string; render: (l: (typeof compare)[number]) => React.ReactNode }[] = [
    { label: "Fiyat", render: (l) => <span className="font-display text-lg font-bold text-brand-700">{formatPrice(l.price, l.currency)}</span> },
    { label: "Tür", render: (l) => PROPERTY_TYPE_LABELS[l.propertyType] || l.propertyType },
    { label: "İlçe", render: (l) => l.district },
    { label: "Mahalle", render: (l) => l.neighborhood || "—" },
    { label: "Oda", render: (l) => l.rooms || "—" },
    { label: "Brüt m²", render: (l) => (l.areaGross ? `${l.areaGross} m²` : "—") },
    { label: "Net m²", render: (l) => (l.areaNet ? `${l.areaNet} m²` : "—") },
    { label: "Kat", render: (l) => l.floor || "—" },
    { label: "Bina Yaşı", render: (l) => l.buildingAge || "—" },
    { label: "Isıtma", render: (l) => l.heating || "—" },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-wider text-gold-600">Analiz</p>
          <h1 className="font-display text-3xl font-bold text-brand-900">İlan Karşılaştırma</h1>
          <div className="gold-divider mt-2" />
        </div>
        {hydrated && compare.length > 0 && (
          <button onClick={clearCompare} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
            Tümünü Temizle
          </button>
        )}
      </div>

      {!hydrated ? (
        <div className="skeleton mt-8 h-96 rounded-lg" />
      ) : compare.length === 0 ? (
        <div className="mt-8 rounded-lg bg-paper p-12 text-center ring-1 ring-stone">
          <ArrowLeftRight className="mx-auto h-12 w-12 text-slate-300" />
          <h2 className="mt-4 text-lg font-bold text-slate-800">Karşılaştırma listeniz boş</h2>
          <p className="mt-1 text-slate-500">İlan kartlarındaki <ArrowLeftRight className="inline h-3.5 w-3.5 align-text-bottom" /> ikonuyla en fazla 4 ilanı yan yana karşılaştırın.</p>
          <Link href="/ilanlar" className="mt-6 inline-block rounded-lg bg-brand-700 px-6 py-3 font-bold text-white hover:bg-brand-800">
            İlanları Keşfet
          </Link>
        </div>
      ) : (
        <div className="mt-8 overflow-x-auto rounded-lg bg-paper ring-1 ring-stone">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr>
                <th className="w-32 p-4"></th>
                {compare.map((l) => (
                  <th key={l.slug} className="p-4 align-top">
                    <div className="relative mx-auto h-28 w-full max-w-[200px] overflow-hidden rounded-lg bg-slate-100">
                      <Image src={l.coverImage || "/placeholder-listing.webp"} alt={l.title} fill sizes="200px" className="object-cover" />
                      <button
                        onClick={() => toggleCompare(l)}
                        className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-paper/90 text-xs text-red-600 shadow"
                        aria-label="Çıkar"
                      ><X className="h-3.5 w-3.5" /></button>
                    </div>
                    <Link href={`/ilan/${l.slug}`} className="mt-2 line-clamp-2 block text-left text-sm font-semibold text-slate-800 hover:text-brand-700">
                      {l.title}
                    </Link>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.label} className={i % 2 ? "bg-slate-50/60" : ""}>
                  <td className="p-4 text-sm font-medium text-slate-500">{r.label}</td>
                  {compare.map((l) => (
                    <td key={l.slug} className="p-4 text-sm text-slate-800">{r.render(l)}</td>
                  ))}
                </tr>
              ))}
              <tr>
                <td className="p-4"></td>
                {compare.map((l) => (
                  <td key={l.slug} className="p-4">
                    <Link href={`/ilan/${l.slug}`} className="inline-flex items-center gap-1 rounded-lg bg-brand-700 px-4 py-2 text-xs font-bold text-white hover:bg-brand-800">
                      İlanı Gör <ArrowRight className="h-4 w-4" />
                    </Link>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
