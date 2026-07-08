"use client";

import { createContext, useContext } from "react";
import type { SiteContact } from "@/lib/contact";

// İstemci bileşenleri (Header, ContactButtons, MobileContactBar, FloatingWhatsApp)
// iletişim bilgisini buradan okur. Değer (site) layout'ta getSiteContact() ile
// sunucuda çözülüp sağlanır. Sunucu bileşenleri doğrudan getSiteContact() çağırır.
const EMPTY: SiteContact = { phone: "", phoneRaw: "", whatsapp: "", email: "", address: "" };
const Ctx = createContext<SiteContact>(EMPTY);

export function SiteContactProvider({
  contact,
  children,
}: {
  contact: SiteContact;
  children: React.ReactNode;
}) {
  return <Ctx.Provider value={contact}>{children}</Ctx.Provider>;
}

export function useSiteContact() {
  return useContext(Ctx);
}
