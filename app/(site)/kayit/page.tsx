import type { Metadata } from "next";
import { UserPlus } from "lucide-react";
import UserRegisterForm from "@/components/user/UserRegisterForm";

export const metadata: Metadata = {
  title: "Kayıt Ol",
  description: "Ücretsiz Kütahya Satılık hesabı oluşturun; favorilerinizi kaydedin, kayıtlı aramalarınızla yeni ilanlardan haberdar olun.",
  robots: { index: false, follow: true },
};

export default function UserRegisterPage() {
  return (
    <div className="mx-auto grid max-w-md px-4 py-16">
      <div className="rounded-3xl bg-white p-8 shadow-xl ring-1 ring-slate-200">
        <div className="text-center">
          <span className="inline-grid h-12 w-12 place-items-center rounded-xl bg-brand-700 text-white">
            <UserPlus className="h-6 w-6" />
          </span>
          <h1 className="mt-4 text-xl font-bold text-slate-900">Hesap Oluştur</h1>
          <p className="text-sm text-slate-500">Ücretsiz — favori ve kayıtlı aramalarınız cihazdan bağımsız saklanır.</p>
        </div>
        <div className="mt-6">
          <UserRegisterForm />
        </div>
      </div>
    </div>
  );
}
