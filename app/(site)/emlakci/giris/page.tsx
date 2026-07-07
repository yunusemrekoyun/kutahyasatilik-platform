import { redirect } from "next/navigation";

// Birleşik girişe taşındı: danışman girişi artık /giris'ten yapılır.
// Eski bağlantılar/bookmark'lar için yönlendirme (varsa next korunur).
export default async function AgentLoginRedirect({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  redirect(next ? `/giris?next=${encodeURIComponent(next)}` : "/giris");
}
