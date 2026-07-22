"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertCircle, CheckCircle2, FileSpreadsheet, Upload } from "lucide-react";
import { LISTING_AMENITIES } from "@/lib/listingAmenities";

type ImportRow = {
  row: number;
  externalId: string;
  title: string;
  status: "valid" | "update" | "invalid";
  errors: string[];
};

type ImportResult = {
  ok: boolean;
  error?: string;
  preview?: boolean;
  total?: number;
  valid?: number;
  invalid?: number;
  saved?: number;
  failed?: number;
  rows?: ImportRow[];
};

export default function CsvListingImport() {
  const [csv, setCsv] = useState("");
  const [fileName, setFileName] = useState("");
  const [result, setResult] = useState<ImportResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function chooseFile(file?: File) {
    setResult(null);
    setError("");
    if (!file) return;
    if (file.size > 2_000_000) {
      setError("CSV dosyası 2 MB sınırını aşıyor.");
      return;
    }
    setFileName(file.name);
    setCsv(await file.text());
  }

  async function submit(commit: boolean) {
    if (!csv) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/v1/agent/listings/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv, commit }),
      });
      const data = (await response.json()) as ImportResult;
      setResult(data);
      if (!response.ok && !data.rows?.length) setError(data.error || "Aktarım kontrol edilemedi.");
    } catch {
      setError("Bağlantı kurulamadı. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  }

  const canCommit = Boolean(result?.preview && result.ok && result.invalid === 0 && result.total);

  return (
    <div className="space-y-6">
      <section className="border border-stone bg-paper p-6">
        <div className="flex items-start gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-700">
            <FileSpreadsheet className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-display text-xl font-semibold text-ink">CSV dosyanızı hazırlayın</h2>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-muted">
              Her satır bir ilan olmalıdır. <strong>externalId</strong>, firmanızdaki değişmeyen ilan numarasıdır;
              aynı numara yeniden aktarılırsa mevcut ilan güncellenir. Aktarılan ilanlar doğrudan yayınlanmaz, yönetim onayına düşer.
            </p>
            <Link href="/api/v1/agent/listings/import/template" className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-brand-700 hover:underline">
              CSV şablonunu indir
            </Link>
          </div>
        </div>
      </section>

      <section className="border border-stone bg-paper p-6">
        <label className="flex min-h-40 cursor-pointer flex-col items-center justify-center border border-dashed border-brand-300 bg-canvas px-6 text-center transition hover:border-brand-600">
          <Upload className="h-7 w-7 text-brand-700" />
          <span className="mt-3 font-semibold text-ink">CSV dosyası seçin</span>
          <span className="mt-1 text-sm text-muted">En fazla 250 ilan ve 2 MB</span>
          {fileName && <span className="mt-3 rounded-md bg-brand-50 px-3 py-1 text-sm font-medium text-brand-800">{fileName}</span>}
          <input type="file" accept=".csv,text/csv" className="sr-only" onChange={(event) => chooseFile(event.target.files?.[0])} />
        </label>

        {error && (
          <div role="alert" className="mt-4 flex items-start gap-2 border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
          </div>
        )}

        <div className="mt-5 flex flex-wrap gap-3">
          <button type="button" disabled={!csv || loading} onClick={() => submit(false)} className="min-h-11 rounded-lg bg-brand-800 px-5 text-sm font-bold text-white disabled:opacity-50">
            {loading ? "Kontrol ediliyor..." : "Dosyayı Kontrol Et"}
          </button>
          {canCommit && (
            <button type="button" disabled={loading} onClick={() => submit(true)} className="min-h-11 rounded-lg bg-green-700 px-5 text-sm font-bold text-white disabled:opacity-50">
              {loading ? "Aktarılıyor..." : `${result?.total} İlanı Onaya Gönder`}
            </button>
          )}
          <Link href="/emlakci/panel" className="inline-flex min-h-11 items-center px-3 text-sm font-semibold text-muted hover:text-ink">Panele dön</Link>
        </div>
      </section>

      {result?.rows && (
        <section className="border border-stone bg-paper p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-xl font-semibold text-ink">Aktarım sonucu</h2>
              <p className="mt-1 text-sm text-muted">
                {result.preview
                  ? `${result.valid ?? 0} geçerli, ${result.invalid ?? 0} hatalı satır.`
                  : `${result.saved ?? 0} ilan onaya gönderildi, ${result.failed ?? 0} satır kaydedilemedi.`}
              </p>
            </div>
            {result.ok && <CheckCircle2 className="h-6 w-6 text-green-700" />}
          </div>
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-stone text-xs uppercase tracking-wide text-muted">
                <tr><th className="p-3">Satır</th><th className="p-3">Dış ID</th><th className="p-3">İlan</th><th className="p-3">Durum</th><th className="p-3">Açıklama</th></tr>
              </thead>
              <tbody>
                {result.rows.map((row) => (
                  <tr key={`${row.row}-${row.externalId}`} className="border-b border-stone/70 align-top">
                    <td className="p-3 tabular-nums text-muted">{row.row}</td>
                    <td className="p-3 font-medium text-ink">{row.externalId || "—"}</td>
                    <td className="max-w-xs p-3 text-ink">{row.title || "—"}</td>
                    <td className="p-3">
                      <span className={`rounded-md px-2 py-1 text-xs font-semibold ${row.status === "invalid" ? "bg-red-50 text-red-700" : row.status === "update" ? "bg-amber-50 text-amber-700" : "bg-green-50 text-green-700"}`}>
                        {row.status === "invalid" ? "Hatalı" : row.status === "update" ? "Güncellenecek" : "Yeni"}
                      </span>
                    </td>
                    <td className="p-3 text-red-700">{row.errors.join(" · ") || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <details className="border border-stone bg-paper p-6">
        <summary className="cursor-pointer font-semibold text-ink">Özellik anahtarlarını göster</summary>
        <p className="mt-2 text-sm text-muted">Birden fazla değeri dik çizgiyle ayırın: elevator|security|city_view</p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {LISTING_AMENITIES.map((item) => <code key={item.key} className="rounded-md bg-canvas px-3 py-2 text-xs text-brand-800">{item.key} — {item.label}</code>)}
        </div>
      </details>
    </div>
  );
}
