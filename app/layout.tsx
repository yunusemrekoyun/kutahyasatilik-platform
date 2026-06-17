import type { Metadata, Viewport } from "next";
import { Geist, Source_Serif_4 } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { SITE } from "@/lib/site";
import StoreProvider from "@/components/store/StoreProvider";
import Toaster from "@/components/store/Toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const display = Source_Serif_4({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} | ${SITE.brand}`,
    template: `%s | ${SITE.name}`,
  },
  description: SITE.description,
  keywords: [
    "Kütahya satılık",
    "Kütahya emlak",
    "Kütahya satılık daire",
    "Kütahya satılık arsa",
    "Kütahya satılık villa",
    "Kütahya yatırımlık arsa",
    "Kütahya gayrimenkul",
  ],
  openGraph: {
    type: "website",
    locale: "tr_TR",
    siteName: SITE.name,
    title: `${SITE.name} | ${SITE.brand}`,
    description: SITE.description,
    url: SITE.url,
  },
  robots: { index: true, follow: true },
  alternates: { canonical: SITE.url },
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
    <html lang="tr" className={`${geistSans.variable} ${display.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-[var(--background)] text-slate-900 antialiased">
        {SITE.gtagId || SITE.gaId ? (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${SITE.gaId || SITE.gtagId}`}
              strategy="afterInteractive"
            />
            <Script id="gtag-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                ${SITE.gaId ? `gtag('config', '${SITE.gaId}');` : ""}
                ${SITE.gtagId ? `gtag('config', '${SITE.gtagId}');` : ""}
              `}
            </Script>
          </>
        ) : null}
        <StoreProvider>
          {children}
          <Toaster />
        </StoreProvider>
      </body>
    </html>
  );
}
