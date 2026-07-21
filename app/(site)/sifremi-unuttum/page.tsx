import type { Metadata } from "next";
import { KeyRound } from "lucide-react";
import ForgotPasswordForm from "@/components/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Şifremi Unuttum",
  description: "Kütahya Satılık hesabınızın şifresini sıfırlayın.",
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
  return (
    <div className="mx-auto grid max-w-md px-4 py-16">
      <div className="rounded-lg border border-stone bg-paper p-8">
        <div className="text-center">
          <span className="inline-grid h-12 w-12 place-items-center rounded-lg bg-brand-700 text-white">
            <KeyRound className="h-6 w-6" />
          </span>
          <h1 className="mt-4 text-xl font-bold text-slate-900">Şifremi Unuttum</h1>
          <p className="text-sm text-slate-500">E-postanı gir, sıfırlama bağlantısı gönderelim.</p>
        </div>
        <div className="mt-6">
          <ForgotPasswordForm />
        </div>
      </div>
    </div>
  );
}
