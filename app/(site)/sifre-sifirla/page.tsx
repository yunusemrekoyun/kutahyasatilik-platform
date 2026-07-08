import type { Metadata } from "next";
import { Suspense } from "react";
import { KeyRound } from "lucide-react";
import ResetPasswordForm from "@/components/ResetPasswordForm";

export const metadata: Metadata = {
  title: "Şifre Sıfırla",
  description: "Yeni şifrenizi belirleyin.",
  robots: { index: false, follow: false },
};

export default function ResetPasswordPage() {
  return (
    <div className="mx-auto grid max-w-md px-4 py-16">
      <div className="rounded-3xl bg-white p-8 shadow-xl ring-1 ring-slate-200">
        <div className="text-center">
          <span className="inline-grid h-12 w-12 place-items-center rounded-xl bg-brand-700 text-white">
            <KeyRound className="h-6 w-6" />
          </span>
          <h1 className="mt-4 text-xl font-bold text-slate-900">Yeni Şifre Belirle</h1>
          <p className="text-sm text-slate-500">Hesabın için yeni bir şifre oluştur.</p>
        </div>
        <div className="mt-6">
          <Suspense fallback={<div className="h-40" />}>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
