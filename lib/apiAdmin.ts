import { resolveApiSession } from "@/lib/apiAuth";

// Bearer/cookie oturumdan ADMIN'i çözer. Admin token'ı zaten admin'dir (DB durum kontrolü gerekmez).
export type AdminResult =
  | { ok: true; admin: { id: string; email: string } }
  | { ok: false; status: number; error: string };

export async function resolveApiAdmin(req: Request): Promise<AdminResult> {
  const session = await resolveApiSession(req);
  if (!session) return { ok: false, status: 401, error: "Yetkisiz" };
  if (session.role !== "admin") return { ok: false, status: 403, error: "Yetkisiz" };
  return { ok: true, admin: { id: session.id, email: session.email } };
}
