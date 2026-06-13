import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { SITE } from "@/lib/site";
import { LANDING_PAGES } from "@/lib/constants";

export const dynamic = "force-dynamic";

// Kendi özel route'u olan sayfalar (/hakkimizda, /kvkk) — /sayfa/[slug]'dan
// tekrar listelenmesin (çift içerik önlenir; kvkk zaten noindex).
const RESERVED_PAGE_SLUGS = ["hakkimizda", "kvkk"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = SITE.url;
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${base}/`, priority: 1, changeFrequency: "daily" },
    { url: `${base}/ilanlar`, priority: 0.9, changeFrequency: "daily" },
    { url: `${base}/harita`, priority: 0.7, changeFrequency: "weekly" },
    { url: `${base}/satici`, priority: 0.8, changeFrequency: "monthly" },
    { url: `${base}/degerleme`, priority: 0.8, changeFrequency: "monthly" },
    { url: `${base}/bolge-analizi`, priority: 0.7, changeFrequency: "weekly" },
    { url: `${base}/alici-talebi`, priority: 0.7, changeFrequency: "monthly" },
    { url: `${base}/blog`, priority: 0.7, changeFrequency: "weekly" },
    { url: `${base}/emlakci/kayit`, priority: 0.4, changeFrequency: "monthly" },
    { url: `${base}/hakkimizda`, priority: 0.6, changeFrequency: "monthly" },
    { url: `${base}/iletisim`, priority: 0.5, changeFrequency: "monthly" },
    ...LANDING_PAGES.map((l) => ({
      url: `${base}/${l.slug}`,
      priority: 0.9,
      changeFrequency: "daily" as const,
    })),
  ];

  let listingPages: MetadataRoute.Sitemap = [];
  try {
    const listings = await prisma.listing.findMany({
      where: { status: { not: "passive" }, moderationStatus: "approved" },
      select: { slug: true, updatedAt: true },
    });
    listingPages = listings.map((l) => ({
      url: `${base}/ilan/${l.slug}`,
      lastModified: l.updatedAt,
      priority: 0.8,
      changeFrequency: "weekly",
    }));
  } catch {
    /* veritabanı hazır değilse boş geç */
  }

  let cmsPages: MetadataRoute.Sitemap = [];
  try {
    const [posts, pages] = await Promise.all([
      prisma.post.findMany({ where: { status: "published" }, select: { slug: true, updatedAt: true } }),
      prisma.page.findMany({
        where: { status: "published", slug: { notIn: RESERVED_PAGE_SLUGS } },
        select: { slug: true, updatedAt: true },
      }),
    ]);
    cmsPages = [
      ...posts.map((p) => ({
        url: `${base}/blog/${p.slug}`,
        lastModified: p.updatedAt,
        priority: 0.6,
        changeFrequency: "monthly" as const,
      })),
      ...pages.map((p) => ({
        url: `${base}/sayfa/${p.slug}`,
        lastModified: p.updatedAt,
        priority: 0.5,
        changeFrequency: "monthly" as const,
      })),
    ];
  } catch {
    /* veritabanı hazır değilse boş geç */
  }

  return [...staticPages, ...listingPages, ...cmsPages];
}
