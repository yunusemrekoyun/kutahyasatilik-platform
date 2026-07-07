import { Check } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/format";
import { AGENT_STATUS_LABELS } from "@/lib/constants";
import { approveAgent, rejectAgent, suspendAgent, deleteAgent } from "../actions";

export const dynamic = "force-dynamic";

const statusBadge: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  suspended: "bg-slate-200 text-slate-600",
};

export default async function AdminAgents() {
  const agents = await prisma.agent.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    include: { _count: { select: { listings: true } } },
  });

  const pending = agents.filter((a) => a.status === "pending");
  const others = agents.filter((a) => a.status !== "pending");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Emlakçılar</h1>
        <p className="text-sm text-slate-500">
          {agents.length} danışman · {pending.length} onay bekliyor
        </p>
      </div>

      {/* Onay bekleyenler */}
      {pending.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-amber-600">
            Onay Bekleyen Başvurular ({pending.length})
          </h2>
          <div className="space-y-3">
            {pending.map((a) => (
              <div key={a.id} className="rounded-xl bg-white p-5 ring-1 ring-amber-200">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="font-bold text-slate-900">{a.name}</p>
                    <p className="text-sm text-slate-500">
                      {a.title || "Gayrimenkul Danışmanı"}{a.agency ? ` · ${a.agency}` : ""}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">{a.email} · {a.phone || "-"}</p>
                    <p className="mt-1 text-xs text-slate-400">Başvuru: {formatDate(a.createdAt)}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <form action={approveAgent}>
                      <input type="hidden" name="id" value={a.id} />
                      <button className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-4 py-2 text-sm font-bold text-white hover:bg-green-700">
                        <Check className="h-4 w-4" /> Onayla
                      </button>
                    </form>
                    <form action={rejectAgent} className="flex items-center gap-1.5">
                      <input type="hidden" name="id" value={a.id} />
                      <input name="note" placeholder="Red sebebi (ops.)" className="w-36 rounded-md border border-slate-300 px-2 py-1.5 text-xs outline-none" />
                      <button className="rounded-lg px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50">Reddet</button>
                    </form>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Tüm danışmanlar */}
      <section>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">Danışmanlar</h2>
        <div className="overflow-hidden rounded-xl bg-white ring-1 ring-slate-200">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs text-slate-500">
                  <th className="p-3">Danışman</th>
                  <th className="p-3">İletişim</th>
                  <th className="p-3 text-center">İlan</th>
                  <th className="p-3">Durum</th>
                  <th className="p-3 text-right">İşlem</th>
                </tr>
              </thead>
              <tbody>
                {others.length === 0 && (
                  <tr><td colSpan={5} className="p-8 text-center text-slate-400">Henüz onaylı/işlenmiş danışman yok.</td></tr>
                )}
                {others.map((a) => (
                  <tr key={a.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="p-3">
                      <p className="font-medium text-slate-800">{a.name}</p>
                      <p className="text-xs text-slate-500">{a.title || "Danışman"}{a.agency ? ` · ${a.agency}` : ""}</p>
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
