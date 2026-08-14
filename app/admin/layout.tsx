import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AdminShell from "@/components/admin/AdminShell";
import type { AdminCounts } from "@/components/admin/AdminNav";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { robots: { index: false, follow: false } };

async function getCounts(): Promise<AdminCounts> {
  try {
    const [pendingListings, newLeads, newAlerts] = await Promise.all([
      prisma.listing.count({ where: { moderationStatus: "pending" } }),
      prisma.lead.count({ where: { status: "new" } }),
      prisma.buyerAlert.count({ where: { status: "active" } }),
    ]);
    return { pendingListings, newLeads, newAlerts };
  } catch {
    return { pendingListings: 0, newLeads: 0, newAlerts: 0 };
  }
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  // İkinci kapı: bu layout eskiden oturum yokken children'ı çıplak render ediyordu,
  // yani panelin tüm okuma koruması tek başına proxy.ts'e bağlıydı (31 admin
  // sayfasının hiçbirinde kendi oturum kontrolü yok). Matcher ya da Next proxy
  // konvansiyonu değişirse dashboard verisi kimliksiz görüntülenebilirdi.
  // /admin/login zaten /giris'e yönlendiren bir shim olduğu için döngü oluşmaz.
  if (!session) {
    redirect("/giris?next=/admin");
  }

  const counts = await getCounts();

  return (
    <AdminShell email={session.email} counts={counts}>
      {children}
    </AdminShell>
  );
}
