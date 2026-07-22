import { unstable_cache } from "next/cache";
import { validateExternalHttpUrl } from "@/lib/externalUrl";
import { prisma } from "@/lib/prisma";

export type PublicLocalResource = {
  id: string;
  title: string;
  description: string | null;
  type: string;
  institution: string;
  district: string | null;
  url: string;
  host: string;
  secure: boolean;
  lastCheckedAt: string | null;
  sortOrder: number;
};

export const LOCAL_RESOURCE_TYPES: Record<string, { label: string; description: string }> = {
  municipality: {
    label: "Belediye hizmetleri",
    description: "Kütahya ve ilçe belediyelerinin çevrim içi hizmetleri.",
  },
  zoning: {
    label: "İmar sorgulama",
    description: "Yetkili kurumların imar planı ve imar durumu ekranları.",
  },
  parcel: {
    label: "Parsel ve tapu",
    description: "Parsel konumu ve taşınmaz bilgileri için resmî sorgu araçları.",
  },
  address: {
    label: "Adres ve numarataj",
    description: "Adres, bina ve numarataj bilgileri için kurum hizmetleri.",
  },
  e_government: {
    label: "e-Devlet hizmetleri",
    description: "Kimlik doğrulaması gerektirebilen resmî e-Devlet işlemleri.",
  },
};

const getActiveLocalResourceRows = unstable_cache(
  async () => prisma.localResource.findMany({
    where: { active: true },
    orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
    select: {
      id: true,
      title: true,
      description: true,
      type: true,
      institution: true,
      district: true,
      url: true,
      lastCheckedAt: true,
      sortOrder: true,
    },
  }),
  ["public-local-resources-v1"],
  { revalidate: 300, tags: ["local-resources"] },
);

export async function getLocalResources(filters: { type?: string; district?: string } = {}): Promise<PublicLocalResource[]> {
  const rows = await getActiveLocalResourceRows();
  const deduplicated = new Map<string, PublicLocalResource>();

  for (const row of rows) {
    if (filters.type && row.type !== filters.type) continue;
    if (filters.district && row.district !== filters.district) continue;

    const external = validateExternalHttpUrl(row.url);
    if (!external?.secure) continue;

    // Next cache can deserialize Prisma Date values as ISO strings. Normalize
    // both representations so prerender and runtime requests behave equally.
    const checkedAt = row.lastCheckedAt as Date | string | null;
    const item: PublicLocalResource = {
      ...row,
      ...external,
      lastCheckedAt: checkedAt instanceof Date ? checkedAt.toISOString() : checkedAt,
    };
    const duplicateKey = `${external.host.toLowerCase()}${new URL(external.url).pathname}${new URL(external.url).search}`;
    const existing = deduplicated.get(duplicateKey);

    if (!existing) deduplicated.set(duplicateKey, item);
  }

  return [...deduplicated.values()].sort((a, b) =>
    a.sortOrder - b.sortOrder || a.title.localeCompare(b.title, "tr"),
  );
}
