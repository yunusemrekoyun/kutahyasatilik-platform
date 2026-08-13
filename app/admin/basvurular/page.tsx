import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { updateApplicationStatus, activateApplication, createOffer } from "@/app/admin/actions";
import { formatPrice } from "@/lib/format";
import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  PASSWORD_REQUIREMENT,
} from "@/lib/passwordPolicy";

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

const PER_PAGE = 50;

export default async function AdminBasvurularPage({
  searchParams,
}: {
  searchParams: Promise<{ sayfa?: string }>;
}) {
  const page = Math.max(1, Number((await searchParams).sayfa) || 1);
  let totalCount = 0;
  let apps: App[] = [];
  try {
    totalCount = await prisma.agentApplication.count();
    apps = await prisma.agentApplication.findMany({
      orderBy: { createdAt: "desc" },
      take: PER_PAGE,
      skip: (page - 1) * PER_PAGE,
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
        <h1 className="text-2xl font-bold text-ink">Danışman Başvuruları</h1>
        <p className="mt-1 text-sm text-muted">
          Klasik kayıt yok — başvurular buraya düşer. İnceleme → görüşme → (teklif) → aktivasyon.
          Aktivasyonda emlakçı hesabı oluşur.
        </p>
      </div>

      {apps.length === 0 ? (
        <div className="bg-paper p-10 text-center text-sm text-muted border border-stone">
          Henüz başvuru yok.
        </div>
      ) : (
        <div className="space-y-4">
          {apps.map((a) => {
            const s = STATUS[a.status] ?? STATUS.applied;
            return (
              <div key={a.id} className="bg-paper p-5 border border-stone">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-ink">{a.name}</p>
                    <p className="text-sm text-muted">{a.email} · {a.phone}</p>
                    {(a.title || a.agency) && (
                      <p className="text-sm text-muted">{[a.title, a.agency].filter(Boolean).join(" · ")}</p>
                    )}
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${s.cls}`}>{s.label}</span>
                </div>
                {a.experience && <p className="mt-2 rounded-lg bg-canvas p-3 text-sm text-muted">{a.experience}</p>}

                {a.offers.length > 0 && (
                  <div className="mt-3 space-y-1.5">
                    {a.offers.map((o) => (
                      <div key={o.id} className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="font-medium text-ink">Teklif v{o.version}</span>
                        <span className="tabular-nums text-muted">{formatPrice(o.snapshotPrice, "TRY")}</span>
                        <span
                          className={`rounded-full px-2 py-0.5 font-medium ${ o.status === "active" ? "bg-indigo-50 text-indigo-700" : o.status === "accepted" ? "bg-green-50 text-green-700" : "bg-canvas text-muted" }`}
                        >
                          {o.status === "active" ? "Aktif" : o.status === "accepted" ? "Kabul edildi" : o.status === "superseded" ? "Eski sürüm" : o.status}
                        </span>
                        {o.viewedAt && <span className="text-muted/70">· görüntülendi</span>}
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
                  <div className="mt-4 grid gap-3 border-t border-stone pt-4 sm:grid-cols-2">
                    {/* Durum / not */}
                    <form action={updateApplicationStatus} className="flex flex-col gap-2">
                      <input type="hidden" name="id" value={a.id} />
                      <div className="flex gap-2">
                        <select name="status" defaultValue={a.status} className="flex-1 rounded-lg border border-stone px-2.5 py-2 text-sm">
                          <option value="applied">Başvurdu</option>
                          <option value="reviewing">İnceleniyor</option>
                          <option value="meeting">Görüşme</option>
                          <option value="offer_sent">Teklif gönderildi</option>
                          <option value="accepted">Teklif kabul edildi</option>
                          <option value="awaiting_payment">Ödeme bekleniyor</option>
                          <option value="rejected">Reddedildi</option>
                        </select>
                        <button type="submit" className="rounded-lg bg-canvas px-3 py-2 text-sm font-medium text-ink hover:bg-stone">Durum</button>
                      </div>
                      <input name="adminNote" defaultValue={a.adminNote ?? ""} placeholder="Admin notu" className="rounded-lg border border-stone px-2.5 py-2 text-sm" />
                    </form>

                    {/* Aktivasyon */}
                    <form action={activateApplication} className="flex flex-col gap-2 rounded-lg bg-green-50/50 p-3 ring-1 ring-green-100">
                      <input type="hidden" name="id" value={a.id} />
                      <p className="text-xs font-medium text-muted">Hesabı aktive et (parola belirle)</p>
                      <div className="flex gap-2">
                        <input name="password" type="password" autoComplete="new-password" minLength={PASSWORD_MIN_LENGTH} maxLength={PASSWORD_MAX_LENGTH} required placeholder={`Geçici parola (${PASSWORD_REQUIREMENT})`} className="flex-1 rounded-lg border border-stone px-2.5 py-2 text-sm" />
                        <button type="submit" className="rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white hover:bg-green-700">Aktive Et</button>
                      </div>
                      <p className="text-[11px] text-muted/70">Parolayı danışmana güvenli şekilde iletin. Teklif/OTP/ödeme adımları yukarıdaki &ldquo;Teklif Oluştur&rdquo; akışında yönetilir.</p>
                    </form>
                  </div>
                )}
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
              <Link href={`/admin/basvurular${page - 1 > 1 ? `?sayfa=${page - 1}` : ""}`} className="rounded-lg bg-paper px-3 py-1.5 font-medium text-ink border border-stone hover:border-brand-300">‹ Önceki</Link>
            )}
            {page < Math.ceil(totalCount / PER_PAGE) && (
              <Link href={`/admin/basvurular?sayfa=${page + 1}`} className="rounded-lg bg-paper px-3 py-1.5 font-medium text-ink border border-stone hover:border-brand-300">Sonraki ›</Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
