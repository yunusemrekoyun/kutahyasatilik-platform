"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogIn } from "lucide-react";

// Talep formlarında giriş yapılmamışsa gösterilir. Giriş/kayıt sonrası aynı sayfaya döner (?next=).
export default function LoginRequiredNotice({
  text = "Talep bırakmak için giriş yapın",
}: {
  text?: string;
}) {
  const pathname = usePathname();
  const next = encodeURIComponent(pathname || "/");
  return (
    <div className="rounded-lg border border-brand-100 bg-brand-50 p-6 text-center">
      <span className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-paper text-brand-700 ring-1 ring-brand-100">
        <LogIn className="h-5 w-5" />
      </span>
      <p className="mt-3 text-sm font-semibold text-brand-900">{text}</p>
      <p className="mt-1 text-xs text-slate-500">
        Giriş yapınca talebinizi hesabınızdan adım adım takip edebilirsiniz.
      </p>
      <div className="mt-4 flex justify-center gap-2">
        <Link href={`/giris?next=${next}`} className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-800">
          Giriş Yap
        </Link>
        <Link href={`/kayit?next=${next}`} className="rounded-lg bg-paper px-4 py-2 text-sm font-semibold text-brand-700 ring-1 ring-brand-200 transition hover:bg-brand-50">
          Kayıt Ol
        </Link>
      </div>
    </div>
  );
}
