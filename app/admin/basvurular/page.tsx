import { prisma } from "@/lib/prisma";
import { updateApplicationStatus, activateApplication, createOffer } from "@/app/admin/actions";
import { formatPrice } from "@/lib/format";

export const dynamic = "force-dynamic";

const STATUS: Record<string, { label: string; cls: string }> = {
  applied: { label: "Başvurdu", cls: "bg-blue-50 text-blue-700 ring-blue-200" },
  reviewing: { label: "İnceleniyor", cls: "bg-amber-50 text-amber-700 ring-amber-200" },
  meeting: { label: "Görüşme", cls: "bg-violet-50 text-violet-700 ring-violet-200" },
  offer_sent: { label: "Teklif gönderildi", cls: "bg-indigo-50 text-indigo-700 ring-indigo-200" },
  accepted: { label: "Teklif kabul edildi", cls: "bg-teal-50 text-teal-700 ring-teal-200" },
  awaiting_payment: { label: "Ödeme bekleniyor", cls: "bg-orange-50 text-orange-700 ring-orange-200" },
  rejected: { label: "Reddedildi", cls: "bg-red-50 text-red-700 ring-red-200" },
  activated: { label: "Aktive edildi", cls: "bg-green-50 text-green-700 ring-green-200" },
};

type Offer = {
  id: string; version: number; snapshotPrice: number; status: string;
  viewedAt: Date | null; acceptedAt: Date | null;
};
type App = {
  id: string; name: string; email: string; phone: string;
  title: string | null; agency: string | null; experience: string | null;
  status: string; adminNote: string | null; createdAt: Date;
  offers: Offer[];
};

export default async function AdminBasvurularPage() {
  let apps: App[] = [];
  try {
    apps = await prisma.agentApplication.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
      include: {
        offers: {
          orderBy: { version: "desc" },
          select: { id: true, version: true, snapshotPrice: true, status: true, viewedAt: true, acceptedAt: true },
        },
      },
    });
  } catch {
    /* tablo henüz yoksa (migration deploy edilmedi) */
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Danışman Başvuruları</h1>
        <p className="mt-1 text-sm text-slate-500">
          Klasik kayıt yok — başvurular buraya düşer. İnceleme → görüşme → (teklif) → aktivasyon.
          Aktivasyonda emlakçı hesabı oluşur.
        </p>
      </div>

      {apps.length === 0 ? (
        <div className="rounded-2xl bg-white p-10 text-center text-sm text-slate-500 ring-1 ring-slate-200">
          Henüz başvuru yok.
        </div>
      ) : (
        <div className="space-y-4">
          {apps.map((a) => {
            const s = STATUS[a.status] ?? STATUS.applied;
            return (
              <div key={a.id} className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{a.name}</p>
                    <p className="text-sm text-slate-500">{a.email} · {a.phone}</p>
                    {(a.title || a.agency) && (
                      <p className="text-sm text-slate-500">{[a.title, a.agency].filter(Boolean).join(" · ")}</p>
                    )}
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${s.cls}`}>{s.label}</span>
                </div>
                {a.experience && <p className="mt-2 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">{a.experience}</p>}

                {a.offers.length > 0 && (
                  <div className="mt-3 space-y-1.5">
                    {a.offers.map((o) => (
                      <div key={o.id} className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="font-medium text-slate-700">Teklif v{o.version}</span>
                        <span className="tabular-nums text-slate-600">{formatPrice(o.snapshotPrice, "TRY")}</span>
                        <span
                          className={`rounded-full px-2 py-0.5 font-medium ${
                            o.status === "active"
                              ? "bg-indigo-50 text-indigo-700"
                              : o.status === "accepted"
                              ? "bg-green-50 text-green-700"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {o.status === "active" ? "Aktif" : o.status === "accepted" ? "Kabul edildi" : o.status === "superseded" ? "Eski sürüm" : o.status}
                        </span>
                        {o.viewedAt && <span className="text-slate-400">· görüntülendi</span>}
                        {o.acceptedAt && <span className="text-green-600">· kabul</span>}
                      </div>
                    ))}
                  </div>
                )}

                {a.status !== "activated" && (
                  <form action={createOffer} className="mt-3">
                    <input type="hidden" name="id" value={a.id} />
                    <button type="submit" className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
                      {a.offers.some((o) => o.status === "active") ? "Yeni Teklif Sürümü" : "Teklif Oluştur"}
                    </button>
                  </form>
                )}

                {a.status !== "activated" && (
                  <div className="mt-4 grid gap-3 border-t border-slate-100 pt-4 sm:grid-cols-2">
                    {/* Durum / not */}
                    <form action={updateApplicationStatus} className="flex flex-col gap-2">
                      <input type="hidden" name="id" value={a.id} />
                      <div className="flex gap-2">
                        <select name="status" defaultValue={a.status} className="flex-1 rounded-lg border border-slate-300 px-2.5 py-2 text-sm">
                          <option value="applied">Başvurdu</option>
                          <option value="reviewing">İnceleniyor</option>
                          <option value="meeting">Görüşme</option>
                          <option value="offer_sent">Teklif gönderildi</option>
                          <option value="accepted">Teklif kabul edildi</option>
                          <option value="awaiting_payment">Ödeme bekleniyor</option>
                          <option value="rejected">Reddedildi</option>
                        </select>
                        <button type="submit" className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200">Durum</button>
                      </div>
                      <input name="adminNote" defaultValue={a.adminNote ?? ""} placeholder="Admin notu" className="rounded-lg border border-slate-300 px-2.5 py-2 text-sm" />
                    </form>

                    {/* Aktivasyon */}
                    <form action={activateApplication} className="flex flex-col gap-2 rounded-lg bg-green-50/50 p-3 ring-1 ring-green-100">
                      <input type="hidden" name="id" value={a.id} />
                      <p className="text-xs font-medium text-slate-600">Hesabı aktive et (parola belirle)</p>
                      <div className="flex gap-2">
                        <input name="password" type="text" minLength={6} required placeholder="Geçici parola (min 6)" className="flex-1 rounded-lg border border-slate-300 px-2.5 py-2 text-sm" />
                        <button type="submit" className="rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white hover:bg-green-700">Aktive Et</button>
                      </div>
                      <p className="text-[11px] text-slate-400">Parolayı danışmana iletin. (Teklif/OTP/ödeme adımları bir sonraki sürümde araya girecek.)</p>
                    </form>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
