import type { Metadata } from "next";
import { Suspense } from "react";
import { LogIn } from "lucide-react";
import LoginForm from "@/components/LoginForm";

export const metadata: Metadata = {
  title: "Giriş Yap",
  description: "Kütahya Satılık hesabınıza giriş yapın.",
  robots: { index: false, follow: true },
};

// Birleşik giriş: kullanıcı, danışman ve yönetici tek sayfadan (rolü sunucu algılar).
export default function LoginPage() {
  return (
    <div className="mx-auto grid max-w-md px-4 py-16">
      <div className="rounded-3xl bg-white p-8 shadow-xl ring-1 ring-slate-200">
        <div className="text-center">
          <span className="inline-grid h-12 w-12 place-items-center rounded-xl bg-brand-700 text-white">
            <LogIn className="h-6 w-6" />
          </span>
          <h1 className="mt-4 text-xl font-bold text-slate-900">Giriş Yap</h1>
          <p className="text-sm text-slate-500">Hesabınıza giriş yapın.</p>
        </div>
        <div className="mt-6">
          <Suspense fallback={<div className="h-64" />}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
