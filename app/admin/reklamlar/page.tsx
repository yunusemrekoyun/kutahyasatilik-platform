import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/format";
import { togglePopup, deletePopup } from "../actions";

export const dynamic = "force-dynamic";

const FREQ_LABEL: Record<string, string> = {
  session: "Oturumda bir",
  daily: "Günde bir",
  always: "Her ziyaret",
};

export default async function AdminPopups() {
  const popups = await prisma.popup.findMany({ orderBy: { updatedAt: "desc" } });
  const activeCount = popups.filter((p) => p.active).length;

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Pop-up Reklamlar</h1>
          <p className="text-sm text-slate-500">{popups.length} reklam · {activeCount} aktif. Birden fazla aktifse en son güncellenen gösterilir.</p>
        </div>
        <Link href="/admin/reklamlar/yeni" className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-bold text-white hover:bg-brand-800">
          + Yeni Reklam
        </Link>
      </div>

      <div className="mt-6 space-y-3">
        {popups.length === 0 && (
          <p className="rounded-lg bg-paper p-10 text-center text-slate-400 ring-1 ring-stone">
            Henüz reklam yok. Kampanya/duyuru pop-up&apos;ı oluşturun.
          </p>
        )}
        {popups.map((p) => (
          <div key={p.id} className={`flex flex-wrap items-center gap-4 rounded-lg bg-paper p-4 ring-1 ${p.active ? "ring-green-200" : "ring-stone"}`}>
            <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-slate-100">
              {p.imageUrl && <Image src={p.imageUrl} alt="" fill sizes="96px" className="object-cover" />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="font-bold text-slate-900">{p.title}</p>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${p.active ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                  {p.active ? "Aktif" : "Pasif"}
                </span>
              </div>
              {p.body && <p className="mt-0.5 line-clamp-1 text-sm text-slate-500">{p.body}</p>}
              <p className="mt-1 text-xs text-slate-400">{FREQ_LABEL[p.frequency]} · {p.delaySec}sn gecikme · {formatDate(p.updatedAt)}</p>
            </div>
            <div className="flex items-center gap-2">
              <form action={togglePopup}>
                <input type="hidden" name="id" value={p.id} />
                <input type="hidden" name="active" value={p.active ? "false" : "true"} />
                <button className={`rounded-md px-3 py-1.5 text-xs font-semibold ${p.active ? "bg-amber-50 text-amber-700 hover:bg-amber-100" : "bg-green-50 text-green-700 hover:bg-green-100"}`}>
                  {p.active ? "Durdur" : "Yayınla"}
                </button>
              </form>
              <Link href={`/admin/reklamlar/${p.id}`} className="rounded-md bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-100">Düzenle</Link>
              <form action={deletePopup}>
                <input type="hidden" name="id" value={p.id} />
                <button className="rounded-md px-2 py-1.5 text-xs text-red-600 hover:bg-red-50">Sil</button>
              </form>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
