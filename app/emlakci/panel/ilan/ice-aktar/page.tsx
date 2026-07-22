import CsvListingImport from "@/components/agent/CsvListingImport";

export const metadata = { title: "Toplu İlan Aktarımı" };

export default function AgentListingImportPage() {
  return (
    <div>
      <p className="eyebrow">Portföy yönetimi</p>
      <h1 className="mt-2 font-display text-3xl font-semibold text-ink">Toplu ilan aktarımı</h1>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">Mevcut portföyünüzü güvenli bir önizleme ve moderasyon adımıyla topluca aktarın.</p>
      <div className="mt-8"><CsvListingImport /></div>
    </div>
  );
}
