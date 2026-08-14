import Link from "next/link";
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

const PER_PAGE = 50;

export default async function AdminReklamTalepleriPage({
  searchParams,
}: {
  searchParams: Promise<{ sayfa?: string }>;
}) {
  const page = Math.max(1, Number((await searchParams).sayfa) || 1);
  let totalCount = 0;
  let rows: Row[] = [];
  try {
    totalCount = await prisma.adRequest.count();
    rows = await prisma.adRequest.findMany({ orderBy: { createdAt: "desc" }, take: PER_PAGE, skip: (page - 1) * PER_PAGE });
  } catch {
    /* tablo henüz yoksa */
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-ink">Reklam Talepleri</h1>
        <p className="mt-1 text-sm text-muted">“Reklam Vermek İstiyorum” formundan gelen talepler.</p>
      </div>

      {rows.length === 0 ? (
        <div className="bg-paper p-10 text-center text-sm text-muted border border-stone">Henüz reklam talebi yok.</div>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => {
            const s = STATUS[r.status] ?? STATUS.new;
            return (
              <div key={r.id} className="bg-paper p-5 border border-stone">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-ink">{r.name}{r.company ? ` · ${r.company}` : ""}</p>
                    <p className="text-sm text-muted">{r.phone}{r.email ? ` · ${r.email}` : ""}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${s.cls}`}>{s.label}</span>
                </div>
                {r.message && <p className="mt-2 rounded-control bg-canvas p-3 text-sm text-muted">{r.message}</p>}
                <div className="mt-3 flex items-center gap-2 border-t border-stone pt-3">
                  <form action={updateAdRequestStatus} className="flex items-center gap-1.5">
                    <input type="hidden" name="id" value={r.id} />
                    <select name="status" defaultValue={r.status} className="rounded-control border border-stone px-2 py-1 text-xs">
                      <option value="new">Yeni</option>
                      <option value="contacted">Görüşüldü</option>
                      <option value="accepted">Kabul</option>
                      <option value="rejected">Red</option>
                    </select>
                    <button type="submit" className="rounded-control bg-canvas px-2.5 py-1 text-xs font-medium text-ink hover:bg-stone">Kaydet</button>
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

      {Math.ceil(totalCount / PER_PAGE) > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-muted">Sayfa {page} / {Math.ceil(totalCount / PER_PAGE)} · {totalCount} kayıt</span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link href={`/admin/reklam-talepleri${page - 1 > 1 ? `?sayfa=${page - 1}` : ""}`} className="rounded-control bg-paper px-3 py-1.5 font-medium text-ink border border-stone hover:border-brand-300">‹ Önceki</Link>
            )}
            {page < Math.ceil(totalCount / PER_PAGE) && (
              <Link href={`/admin/reklam-talepleri?sayfa=${page + 1}`} className="rounded-control bg-paper px-3 py-1.5 font-medium text-ink border border-stone hover:border-brand-300">Sonraki ›</Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
