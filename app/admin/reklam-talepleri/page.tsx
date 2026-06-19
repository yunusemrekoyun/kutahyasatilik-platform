import { prisma } from "@/lib/prisma";
import { updateAdRequestStatus, deleteAdRequest } from "@/app/admin/actions";

export const dynamic = "force-dynamic";

const STATUS: Record<string, { label: string; cls: string }> = {
  new: { label: "Yeni", cls: "bg-blue-50 text-blue-700 ring-blue-200" },
  contacted: { label: "Görüşüldü", cls: "bg-amber-50 text-amber-700 ring-amber-200" },
  accepted: { label: "Kabul", cls: "bg-green-50 text-green-700 ring-green-200" },
  rejected: { label: "Red", cls: "bg-red-50 text-red-700 ring-red-200" },
};

type Row = {
  id: string; name: string; company: string | null; phone: string;
  email: string | null; message: string | null; status: string; createdAt: Date;
};

export default async function AdminReklamTalepleriPage() {
  let rows: Row[] = [];
  try {
    rows = await prisma.adRequest.findMany({ orderBy: { createdAt: "desc" }, take: 200 });
  } catch {
    /* tablo henüz yoksa */
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Reklam Talepleri</h1>
        <p className="mt-1 text-sm text-slate-500">“Reklam Vermek İstiyorum” formundan gelen talepler.</p>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl bg-white p-10 text-center text-sm text-slate-500 ring-1 ring-slate-200">Henüz reklam talebi yok.</div>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => {
            const s = STATUS[r.status] ?? STATUS.new;
            return (
              <div key={r.id} className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{r.name}{r.company ? ` · ${r.company}` : ""}</p>
                    <p className="text-sm text-slate-500">{r.phone}{r.email ? ` · ${r.email}` : ""}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${s.cls}`}>{s.label}</span>
                </div>
                {r.message && <p className="mt-2 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">{r.message}</p>}
                <div className="mt-3 flex items-center gap-2 border-t border-slate-100 pt-3">
                  <form action={updateAdRequestStatus} className="flex items-center gap-1.5">
                    <input type="hidden" name="id" value={r.id} />
                    <select name="status" defaultValue={r.status} className="rounded-md border border-slate-300 px-2 py-1 text-xs">
                      <option value="new">Yeni</option>
                      <option value="contacted">Görüşüldü</option>
                      <option value="accepted">Kabul</option>
                      <option value="rejected">Red</option>
                    </select>
                    <button type="submit" className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-200">Kaydet</button>
                  </form>
                  <form action={deleteAdRequest} className="ml-auto">
                    <input type="hidden" name="id" value={r.id} />
                    <button type="submit" className="text-xs font-medium text-red-600 hover:underline">Sil</button>
                  </form>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
