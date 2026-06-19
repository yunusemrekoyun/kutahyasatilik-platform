import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AdminShell from "@/components/admin/AdminShell";
import type { AdminCounts } from "@/components/admin/AdminNav";

export const dynamic = "force-dynamic";

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

  // Oturum yoksa (login sayfası) sade göster — middleware diğer yolları zaten korur.
  if (!session) {
    return <div className="min-h-screen bg-slate-50">{children}</div>;
  }

  const counts = await getCounts();

  return (
    <AdminShell email={session.email} counts={counts}>
      {children}
    </AdminShell>
  );
}
