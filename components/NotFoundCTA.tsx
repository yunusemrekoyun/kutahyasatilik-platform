import Link from "next/link";
import { BellRing, Phone, MessageCircle } from "lucide-react";
import { SITE, telLink, whatsappLink } from "@/lib/site";

export default function NotFoundCTA({
  title = "Aradığınız gayrimenkulü bulamadınız mı?",
}: {
  title?: string;
}) {
  return (
    <section className="rounded-3xl bg-gradient-to-br from-brand-700 to-brand-900 p-8 sm:p-12 text-center text-white">
      <h2 className="text-2xl sm:text-3xl font-extrabold">{title}</h2>
      <p className="mx-auto mt-3 max-w-2xl text-brand-100">
        Bizi arayın, portföyümüzde yer alan ve henüz yayınlanmamış diğer seçenekleri
        size özel sunalım. Kütahya&apos;nın dijital emlak ofisi olarak doğru mülkü
        bulmanıza yardımcı oluyoruz.
      </p>
      <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
        <Link
          href="/alici-talebi"
          className="inline-flex items-center gap-2 rounded-xl bg-gold-500 px-6 py-3.5 font-bold text-brand-950 hover:bg-gold-400 transition"
        >
          <BellRing className="h-5 w-5" /> Talebimi Bırak, Bulun
        </Link>
        <a
          href={telLink()}
          className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 font-bold text-brand-800 hover:bg-brand-50 transition"
        >
          <Phone className="h-5 w-5" /> Hemen Ara: {SITE.phone}
        </a>
        <a
          href={whatsappLink("Merhaba, aradığım kriterlerde gayrimenkul arıyorum. Yardımcı olabilir misiniz?")}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-6 py-3.5 font-bold text-white hover:bg-green-700 transition"
        >
          <MessageCircle className="h-5 w-5" /> WhatsApp&apos;tan Yaz
        </a>
      </div>
    </section>
  );
}
