import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import MessagesClient from "@/components/messaging/MessagesClient";

export const dynamic = "force-dynamic";

export default function AgentMessagesPage() {
  return (
    <div className="space-y-4">
      <div>
        <Link href="/emlakci/panel" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-brand-700">
          <ArrowLeft className="h-4 w-4" /> Panele dön
        </Link>
        <h1 className="mt-2 text-2xl font-extrabold text-slate-900">Mesajlar</h1>
        <p className="text-sm text-slate-500">İlanlarınıza gelen mesajlar ve teklifler. Teklifi Kabul / Reddet / Karşı-teklif ile yanıtlayın.</p>
      </div>
      <Suspense fallback={<div className="h-96 rounded-lg bg-paper ring-1 ring-stone" />}>
        <MessagesClient basePath="/emlakci/panel/mesajlar" />
      </Suspense>
    </div>
  );
}
