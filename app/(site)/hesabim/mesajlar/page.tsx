import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getUserSession } from "@/lib/userAuth";
import MessagesClient from "@/components/messaging/MessagesClient";

export const metadata: Metadata = { title: "Mesajlarım", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function UserMessagesPage() {
  const session = await getUserSession();
  if (!session) redirect("/giris?next=/hesabim/mesajlar");
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Link href="/hesabim" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-brand-700">
        <ArrowLeft className="h-4 w-4" /> Hesabım
      </Link>
      <h1 className="mb-4 mt-2 text-2xl font-bold text-slate-900">Mesajlarım</h1>
      <Suspense fallback={<div className="h-96 rounded-2xl bg-white ring-1 ring-slate-200" />}>
        <MessagesClient basePath="/hesabim/mesajlar" />
      </Suspense>
    </div>
  );
}
