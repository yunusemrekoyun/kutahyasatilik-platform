import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getUserSession } from "@/lib/userAuth";
import { prisma } from "@/lib/prisma";
import { isCategoryKey } from "@/lib/categories";
import UserListingForm from "@/components/UserListingForm";

export const metadata: Metadata = {
  title: "İlanı Düzenle",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function EditListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getUserSession();
  if (!session) redirect(`/giris?next=/hesabim/ilanlarim/${id}/duzenle`);

  const listing = await prisma.listing.findUnique({
    where: { id },
    select: {
      id: true, userId: true, category: true, propertyType: true,
      title: true, description: true, price: true,
      district: true, neighborhood: true, attributes: true,
      images: { orderBy: { sortOrder: "asc" }, select: { url: true } },
    },
  });

  // Sahiplik burada da kontrol ediliyor (action'da yine kontrol ediliyor).
  // Yetkisiz kullanıcıya "yetkiniz yok" yerine 404: başkasının ilan id'sinin
  // var olup olmadığı bilgisini sızdırmamak için.
  if (!listing || listing.userId !== session.userId) notFound();

  // Bireysel akış yalnız vasıta + teknoloji; emlak ilanı buraya düşerse form
  // alan setini üretemez.
  if (!isCategoryKey(listing.category) || listing.category === "emlak") notFound();

  return (
    <div className="mx-auto max-w-3xl px-5 py-8 sm:px-6 sm:py-10">
      <nav aria-label="Sayfa yolu" className="mb-2 text-sm text-muted">
        <Link href="/hesabim" className="hover:text-brand-700">Hesabım</Link>
        <span className="mx-2 text-stone">/</span>
        <Link href="/hesabim/ilanlarim" className="hover:text-brand-700">İlanlarım</Link>
        <span className="mx-2 text-stone">/</span>
        <span className="text-ink">Düzenle</span>
      </nav>

      <header className="mb-6 border-b border-stone pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">İlanı Düzenle</h1>
        <p className="mt-2 text-sm text-muted">
          Kaydettiğinizde ilan tekrar onaya düşer ve onaylanana kadar yayında görünmez.
          Ekibimiz yalnız değiştirdiğiniz alanları inceler.
        </p>
      </header>

      <UserListingForm
        initial={{
          id: listing.id,
          category: listing.category,
          propertyType: listing.propertyType,
          title: listing.title,
          description: listing.description ?? "",
          price: listing.price,
          district: listing.district,
          neighborhood: listing.neighborhood,
          attributes: (listing.attributes ?? {}) as Record<string, unknown>,
          images: listing.images.map((i) => i.url),
        }}
      />
    </div>
  );
}
