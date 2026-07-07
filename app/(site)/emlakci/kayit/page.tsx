import type { Metadata } from "next";
import { Handshake, CheckCircle2, Info } from "lucide-react";
import AgentRegisterForm from "@/components/agent/AgentRegisterForm";

export const metadata: Metadata = {
  title: "Danışman Başvurusu - Emlakçı Kaydı",
  description:
    "Kütahya Satılık danışman ağına katılın. Başvurunuzu yapın, onaylandıktan sonra kendi ilanlarınızı ekleyin ve geniş alıcı kitlesine ulaşın.",
};

export default function AgentRegisterPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="grid items-start gap-10 lg:grid-cols-2">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-4 py-1.5 text-sm font-medium text-brand-700 ring-1 ring-brand-100">
            <Handshake className="h-4 w-4" /> Danışman Ağı
          </span>
          <h1 className="mt-4 text-3xl font-black text-slate-900 sm:text-4xl">
            Kütahya&apos;nın Dijital Emlak Ağına Katılın
          </h1>
          <p className="mt-4 text-slate-600">
            Gayrimenkul danışmanıysanız portföyünüzü dijital vitrinimizde sergileyin.
            Başvurunuz yönetim ekibimizce değerlendirilir; onaylandığında kendi
            panelinizden ilan ekleyebilirsiniz.
          </p>
          <ul className="mt-6 space-y-3 text-slate-700">
            <li className="flex gap-3"><CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" /> Kendi panelinizden ilan ekleyin ve yönetin</li>
            <li className="flex gap-3"><CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" /> İlanlarınızda isim &amp; unvan etiketiniz görünür</li>
            <li className="flex gap-3"><CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" /> Google&apos;da reklamlı geniş erişim</li>
            <li className="flex gap-3"><CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" /> Yatırım analizi ve değerleme araçları</li>
          </ul>
          <div className="mt-6 flex items-start gap-2 rounded-xl bg-amber-50 p-4 text-sm text-amber-800 ring-1 ring-amber-100">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" /> Kalite ve güven için her başvuru ve her ilan yönetim onayından geçer.
          </div>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200 sm:p-7">
          <h2 className="text-xl font-extrabold text-slate-900">Danışman Başvuru Formu</h2>
          <p className="mt-1 text-sm text-slate-500">Bilgilerinizi girin, başvurunuzu inceleyelim.</p>
          <div className="mt-5">
            <AgentRegisterForm />
          </div>
        </div>
      </div>
    </div>
  );
}
