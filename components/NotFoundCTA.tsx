import Link from "next/link";
import { BellRing, Phone, MessageCircle } from "lucide-react";
import { SITE, telLink, whatsappLink } from "@/lib/site";

export default function NotFoundCTA({
  title = "Aradığınız gayrimenkulü bulamadınız mı?",
}: {
  title?: string;
}) {
  return (
    <section className="rounded-2xl bg-brand-950 p-8 text-center text-white sm:p-12">
      <h2 className="font-display text-2xl font-bold sm:text-3xl">{title}</h2>
      <p className="mx-auto mt-3 max-w-2xl leading-relaxed text-brand-100">
        Bizi arayın, portföyümüzde yer alan ve henüz yayınlanmamış diğer seçenekleri
        size özel sunalım. Kütahya&apos;nın dijital emlak ofisi olarak doğru mülkü
        bulmanıza yardımcı oluyoruz.
      </p>
      <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Link
          href="/alici-talebi"
          className="inline-flex w-full items-center justify-center gap-2 rounded-[10px] bg-white px-6 py-3.5 font-semibold text-brand-800 transition hover:bg-brand-50 sm:w-auto"
        >
          <BellRing className="h-5 w-5" /> Talebimi Bırak, Bulun
        </Link>
        <a
          href={telLink()}
          className="inline-flex w-full items-center justify-center gap-2 rounded-[10px] bg-white/10 px-6 py-3.5 font-semibold text-white ring-1 ring-white/25 transition hover:bg-white/20 sm:w-auto"
        >
          <Phone className="h-5 w-5" /> {SITE.phone}
        </a>
        <a
          href={whatsappLink("Merhaba, aradığım kriterlerde gayrimenkul arıyorum. Yardımcı olabilir misiniz?")}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex w-full items-center justify-center gap-2 rounded-[10px] bg-green-600 px-6 py-3.5 font-semibold text-white transition hover:bg-green-700 sm:w-auto"
        >
          <MessageCircle className="h-5 w-5" /> WhatsApp&apos;tan Yaz
        </a>
      </div>
    </section>
  );
}
