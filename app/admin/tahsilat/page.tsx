import { prisma } from "@/lib/prisma";
import { savePayment, updatePaymentStatus, deletePayment } from "@/app/admin/actions";
import { formatPrice } from "@/lib/format";

export const dynamic = "force-dynamic";

const inputCls =
  "w-full rounded-lg border border-slate-300 bg-paper px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30";

const STATUS: Record<string, { label: string; cls: string }> = {
  pending: { label: "Bekliyor", cls: "bg-amber-50 text-amber-700 ring-amber-200" },
  paid: { label: "Ödendi", cls: "bg-green-50 text-green-700 ring-green-200" },
  overdue: { label: "Gecikti", cls: "bg-red-50 text-red-700 ring-red-200" },
};
const PURPOSE: Record<string, string> = { package: "Paket", listing: "İlan", featured: "Öne çıkarma" };

type PaymentRow = {
  id: string; amount: number; currency: string; period: string | null;
  method: string | null; purpose: string; status: string;
  agent: { name: string } | null;
};

export default async function AdminTahsilatPage() {
  let payments: PaymentRow[] = [];
  let agents: { id: string; name: string }[] = [];
  try {
    [payments, agents] = await Promise.all([
      prisma.payment.findMany({
        orderBy: { createdAt: "desc" },
        take: 200,
        select: {
          id: true, amount: true, currency: true, period: true,
          method: true, purpose: true, status: true,
          agent: { select: { name: true } },
        },
      }),
      prisma.agent.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    ]);
  } catch {
    /* tablo henüz yoksa (migration deploy edilmedi) — boş göster */
  }

  const sum = (st: string) => payments.filter((p) => p.status === st).reduce((a, p) => a + p.amount, 0);
  const cards = [
    { st: "pending", count: payments.filter((p) => p.status === "pending").length, total: sum("pending") },
    { st: "paid", count: payments.filter((p) => p.status === "paid").length, total: sum("paid") },
    { st: "overdue", count: payments.filter((p) => p.status === "overdue").length, total: sum("overdue") },
  ];

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Tahsilat</h1>
        <p className="mt-1 text-sm text-slate-500">
          Ödeme entegrasyonu yok — havale/EFT/elden. Sistem yalnızca kayıt + takip tutar.
        </p>
      </div>

      {/* Özet */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {cards.map((c) => (
          <div key={c.st} className="rounded-lg bg-paper p-5 ring-1 ring-stone">
            <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${STATUS[c.st].cls}`}>
              {STATUS[c.st].label}
            </span>
            <p className="mt-3 text-2xl font-bold tabular-nums text-slate-900">{c.count}</p>
            <p className="text-sm text-slate-500 tabular-nums">{formatPrice(c.total, "TRY")}</p>
          </div>
        ))}
      </div>

      {/* Yeni kayıt */}
      <section className="mt-6 rounded-lg bg-paper p-6 ring-1 ring-stone">
        <h2 className="font-bold text-slate-900">Yeni ödeme kaydı</h2>
        {agents.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">Önce emlakçı eklenmeli.</p>
        ) : (
          <form action={savePayment} className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <select name="agentId" required className={`${inputCls} col-span-2`} defaultValue="">
              <option value="" disabled>Emlakçı…</option>
              {agents.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
            <input name="amount" type="number" min={0} placeholder="Tutar ₺" required className={inputCls} />
            <input name="period" placeholder="Dönem (Haziran 2026)" className={inputCls} />
            <select name="method" className={inputCls} defaultValue="havale">
              <option value="havale">Havale</option>
              <option value="EFT">EFT</option>
              <option value="nakit">Nakit</option>
            </select>
            <select name="status" className={inputCls} defaultValue="pending">
              <option value="pending">Bekliyor</option>
              <option value="paid">Ödendi</option>
              <option value="overdue">Gecikti</option>
            </select>
            <select name="purpose" className={inputCls} defaultValue="package">
              <option value="package">Paket</option>
              <option value="listing">İlan</option>
              <option value="featured">Öne çıkarma</option>
            </select>
            <button type="submit" className="col-span-2 rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800 sm:col-span-1">
              Ekle
            </button>
          </form>
        )}
      </section>

      {/* Defter */}
      <section className="mt-6 overflow-hidden rounded-lg bg-paper ring-1 ring-stone">
        {payments.length === 0 ? (
          <p className="p-6 text-center text-sm text-slate-500">Henüz ödeme kaydı yok.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="px-4 py-3">Emlakçı</th>
                <th className="px-4 py-3">Tutar</th>
                <th className="px-4 py-3">Dönem</th>
                <th className="px-4 py-3">Amaç</th>
                <th className="px-4 py-3">Durum</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id} className="border-b border-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">{p.agent?.name ?? "—"}</td>
                  <td className="px-4 py-3 tabular-nums">{formatPrice(p.amount, p.currency)}</td>
                  <td className="px-4 py-3 text-slate-600">{p.period ?? "—"}{p.method ? ` · ${p.method}` : ""}</td>
                  <td className="px-4 py-3 text-slate-600">{PURPOSE[p.purpose] ?? p.purpose}</td>
                  <td className="px-4 py-3">
                    <form action={updatePaymentStatus} className="flex items-center gap-1.5">
                      <input type="hidden" name="id" value={p.id} />
                      <select name="status" defaultValue={p.status} className="rounded-md border border-slate-300 px-2 py-1 text-xs">
                        <option value="pending">Bekliyor</option>
                        <option value="paid">Ödendi</option>
                        <option value="overdue">Gecikti</option>
                      </select>
                      <button type="submit" className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-200">Kaydet</button>
                    </form>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <form action={deletePayment}>
                      <input type="hidden" name="id" value={p.id} />
                      <button type="submit" className="text-xs font-medium text-red-600 hover:underline">Sil</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
