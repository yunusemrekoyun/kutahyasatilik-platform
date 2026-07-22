import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { AGENT_STATUS_LABELS } from "@/lib/constants";
import { approveAgent, suspendAgent, deleteAgent, updateAgentDirectoryProfile } from "../actions";

export const dynamic = "force-dynamic";

const statusBadge: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  suspended: "bg-slate-200 text-slate-600",
};

export default async function AdminAgents() {
  const [agents, agencies] = await Promise.all([
    prisma.agent.findMany({
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      include: { _count: { select: { listings: true } }, agencyRef: { select: { name: true } } },
    }),
    prisma.agency.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, status: true } }),
  ]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Emlakçılar</h1>
          <p className="text-sm text-slate-500">{agents.length} danışman</p>
        </div>
        <Link href="/admin/basvurular" className="rounded-lg bg-brand-50 px-3 py-2 text-sm font-semibold text-brand-700 hover:bg-brand-100">
          Yeni başvurular → Başvurular
        </Link>
      </div>

      {/* Tüm danışmanlar (onay bekleyenler de bu tabloda; yeni başvurular Başvurular sayfasında toplanır) */}
      <section>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">Danışmanlar</h2>
        <div className="overflow-hidden rounded-lg bg-paper ring-1 ring-stone">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone bg-canvas text-left text-xs text-slate-500">
                  <th className="p-3">Danışman</th>
                  <th className="p-3">İletişim</th>
                  <th className="p-3 text-center">İlan</th>
                  <th className="p-3">Durum</th>
                  <th className="min-w-[260px] p-3">Firma ve kamu profili</th>
                  <th className="p-3 text-right">İşlem</th>
                </tr>
              </thead>
              <tbody>
                {agents.length === 0 && (
                  <tr><td colSpan={6} className="p-8 text-center text-slate-400">Henüz danışman yok.</td></tr>
                )}
                {agents.map((a) => (
                  <tr key={a.id} className="border-b border-slate-50 hover:bg-canvas">
                    <td className="p-3">
                      <p className="font-medium text-slate-800">{a.name}</p>
                      <p className="text-xs text-slate-500">{a.title || "Danışman"}{a.agencyRef?.name || a.agency ? ` · ${a.agencyRef?.name || a.agency}` : ""}</p>
                    </td>
                    <td className="p-3 text-slate-600">
                      <p>{a.email}</p>
                      <p className="text-xs text-slate-400">{a.phone || "-"}</p>
                    </td>
                    <td className="p-3 text-center text-slate-600">{a._count.listings}</td>
                    <td className="p-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusBadge[a.status]}`}>
                        {AGENT_STATUS_LABELS[a.status]}
                      </span>
                      {a.note && <p className="mt-1 max-w-[160px] text-[11px] text-slate-400">{a.note}</p>}
                    </td>
                    <td className="p-3">
                      <form action={updateAgentDirectoryProfile} className="space-y-2">
                        <input type="hidden" name="id" value={a.id} />
                        <select name="agencyId" defaultValue={a.agencyId ?? ""} className="h-9 w-full rounded-md border border-slate-300 bg-paper px-2 text-xs">
                          <option value="">Bağımsız / firma yok</option>
                          {agencies.map((agency) => (
                            <option key={agency.id} value={agency.id}>{agency.name}{agency.status !== "approved" ? " (onaysız)" : ""}</option>
                          ))}
                        </select>
                        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-600">
                          <label className="flex items-center gap-1"><input type="checkbox" name="publicProfile" defaultChecked={a.publicProfile} /> Yayınla</label>
                          <label className="flex items-center gap-1"><input type="checkbox" name="showPhone" defaultChecked={a.showPhone} /> Telefon</label>
                          <label className="flex items-center gap-1"><input type="checkbox" name="showWhatsapp" defaultChecked={a.showWhatsapp} /> WhatsApp</label>
                        </div>
                        <button className="rounded-md bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700 hover:bg-brand-100">Dizini kaydet</button>
                      </form>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-end gap-2">
                        {a.status !== "approved" && (
                          <form action={approveAgent}>
                            <input type="hidden" name="id" value={a.id} />
                            <button className="rounded-md bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700 hover:bg-green-100">Onayla</button>
                          </form>
                        )}
                        {a.status === "approved" && (
                          <form action={suspendAgent}>
                            <input type="hidden" name="id" value={a.id} />
                            <button className="rounded-md bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 hover:bg-amber-100">Askıya Al</button>
                          </form>
                        )}
                        <form action={deleteAgent}>
                          <input type="hidden" name="id" value={a.id} />
                          <button className="rounded-md px-2 py-1 text-xs text-red-600 hover:bg-red-50">Sil</button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
