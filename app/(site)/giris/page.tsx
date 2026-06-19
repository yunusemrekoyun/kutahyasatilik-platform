import type { Metadata } from "next";
import { Suspense } from "react";
import { LogIn } from "lucide-react";
import UserLoginForm from "@/components/user/UserLoginForm";

export const metadata: Metadata = {
  title: "Giriş Yap",
  description: "Kütahya Satılık hesabınıza giriş yapın; favorilerinize ve kayıtlı aramalarınıza erişin.",
  robots: { index: false, follow: true },
};

export default function UserLoginPage() {
  return (
    <div className="mx-auto grid max-w-md px-4 py-16">
      <div className="rounded-3xl bg-white p-8 shadow-xl ring-1 ring-slate-200">
        <div className="text-center">
          <span className="inline-grid h-12 w-12 place-items-center rounded-xl bg-brand-700 text-white">
            <LogIn className="h-6 w-6" />
          </span>
          <h1 className="mt-4 text-xl font-bold text-slate-900">Giriş Yap</h1>
          <p className="text-sm text-slate-500">Favoriler, kayıtlı aramalar ve bildirimler için.</p>
        </div>
        <div className="mt-6">
          <Suspense fallback={<div className="h-64" />}>
            <UserLoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
