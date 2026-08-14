import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getUserSession } from "@/lib/userAuth";
import UserListingForm from "@/components/UserListingForm";

export const metadata: Metadata = {
  title: "İlan Ver - Kütahya Satılık",
  description:
    "Aracınızı veya teknoloji ürününüzü Kütahya Satılık'ta ücretsiz yayımlayın. İlanınız onaydan sonra binlerce yerel alıcıya ulaşır.",
  alternates: { canonical: "/ilan-ver" },
};

export const dynamic = "force-dynamic";

export default async function CreateListingPage() {
  const session = await getUserSession();
  if (!session) redirect("/giris?next=/ilan-ver");

  return (
    <div className="mx-auto max-w-3xl px-5 py-10 sm:px-6 sm:py-14">
      <nav aria-label="Sayfa yolu" className="mb-2 text-sm text-muted">
        <Link href="/" className="hover:text-brand-700">Ana Sayfa</Link>
        <span className="mx-2 text-stone">/</span>
        <span className="text-ink">İlan Ver</span>
      </nav>

      <header className="mb-8 border-b border-stone pb-7">
        <p className="eyebrow">Ücretsiz yayın</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight text-brand-950 sm:text-5xl">
          İlan Ver
        </h1>
        <p className="mt-3 text-muted">
          Birkaç dakikada ilanınızı oluşturun. Onaylandıktan sonra Kütahya&apos;daki alıcılara ulaşır.
        </p>
      </header>

      <UserListingForm />

      <p className="mt-10 text-sm text-muted">
        Yayımladığınız ilanları{" "}
        <Link href="/hesabim/ilanlarim" className="font-semibold text-brand-700 hover:underline">
          İlanlarım
        </Link>{" "}
        sayfasından takip edebilirsiniz.
      </p>
    </div>
  );
}
