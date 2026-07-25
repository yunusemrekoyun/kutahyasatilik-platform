import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FloatingWhatsApp from "@/components/FloatingWhatsApp";
import CompareBar from "@/components/CompareBar";
import MobileTabBar from "@/components/MobileTabBar";
import PromoPopup from "@/components/PromoPopup";
import { SiteContactProvider } from "@/components/SiteContactProvider";
import { getSiteContact } from "@/lib/contact";
import { prisma } from "@/lib/prisma";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const contact = await getSiteContact();
  let popup = null;
  try {
    popup = await prisma.popup.findFirst({
      where: { active: true },
      orderBy: { updatedAt: "desc" },
    });
  } catch {
    /* veritabanı hazır değilse pop-up gösterme */
  }

  return (
    <SiteContactProvider contact={contact}>
      <a
        href="#main-content"
        className="fixed left-4 top-4 z-[120] -translate-y-24 rounded-lg bg-paper px-4 py-3 font-semibold text-brand-950 shadow-prestige transition-transform focus:translate-y-0"
      >
        Ana içeriğe geç
      </a>
      <Header />
      <main id="main-content" tabIndex={-1} className="flex-1 pb-16 outline-none lg:pb-0">{children}</main>
      <Footer />
      <FloatingWhatsApp />
      <CompareBar />
      <MobileTabBar />
      {popup && (
        <PromoPopup
          popup={{
            id: popup.id,
            title: popup.title,
            body: popup.body,
            imageUrl: popup.imageUrl,
            linkUrl: popup.linkUrl,
            linkText: popup.linkText,
            frequency: popup.frequency,
            delaySec: popup.delaySec,
          }}
        />
      )}
    </SiteContactProvider>
  );
}
