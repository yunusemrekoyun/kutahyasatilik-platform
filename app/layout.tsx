import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { SITE } from "@/lib/site";
import StoreProvider from "@/components/store/StoreProvider";
import Toaster from "@/components/store/Toaster";
import AnalyticsConsent from "@/components/AnalyticsConsent";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} | ${SITE.brand}`,
    template: `%s | ${SITE.name}`,
  },
  description: SITE.description,
  // K8: anahtar kelimeler emlağın yanına vasıta ve teknolojiyi de aldı.
  keywords: [
    "Kütahya satılık",
    "Kütahya ilan",
    "Kütahya satılık daire",
    "Kütahya satılık arsa",
    "Kütahya satılık araba",
    "Kütahya ikinci el",
    "Kütahya emlak",
    "Kütahya gayrimenkul",
  ],
  openGraph: {
    type: "website",
    locale: "tr_TR",
    siteName: SITE.name,
    title: `${SITE.name} | ${SITE.brand}`,
    description: SITE.description,
    url: SITE.url,
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: SITE.name }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE.name} | ${SITE.brand}`,
    description: SITE.description,
    images: ["/opengraph-image"],
  },
  robots: { index: true, follow: true },
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: SITE.name },
};

export const viewport: Viewport = {
  themeColor: "#0a1730",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="tr" className={`${geistSans.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-[var(--background)] text-ink antialiased">
        <AnalyticsConsent gaId={SITE.gaId} gtagId={SITE.gtagId} />
        <StoreProvider>
          {children}
          <Toaster />
        </StoreProvider>
      </body>
    </html>
  );
}
