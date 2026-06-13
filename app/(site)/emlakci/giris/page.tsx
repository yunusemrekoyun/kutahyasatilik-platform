import type { Metadata } from "next";
import { Suspense } from "react";
import AgentLoginForm from "@/components/agent/AgentLoginForm";

export const metadata: Metadata = {
  title: "Danışman Girişi",
  description: "Kütahya Satılık danışman paneline giriş yapın.",
};

export default function AgentLoginPage() {
  return (
    <div className="mx-auto grid max-w-md px-4 py-16">
      <div className="rounded-3xl bg-white p-8 shadow-xl ring-1 ring-slate-200">
        <div className="text-center">
          <span className="inline-grid h-12 w-12 place-items-center rounded-xl bg-brand-700 text-xl font-black text-white">
            🤝
          </span>
          <h1 className="mt-4 text-xl font-extrabold text-slate-900">Danışman Girişi</h1>
          <p className="text-sm text-slate-500">Kütahya Satılık Danışman Paneli</p>
        </div>
        <div className="mt-6">
          <Suspense fallback={<div className="h-40" />}>
            <AgentLoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
