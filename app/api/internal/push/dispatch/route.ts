import { timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { checkPushReceipts, dispatchPendingPushes } from "@/lib/push";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim();
  const authorization = req.headers.get("authorization");
  const provided = authorization?.startsWith("Bearer ")
    ? authorization.slice(7)
    : "";
  const secretBytes = Buffer.from(secret || "");
  const providedBytes = Buffer.from(provided);
  const authorized =
    Boolean(secret && secret.length >= 32) &&
    secretBytes.length === providedBytes.length &&
    timingSafeEqual(secretBytes, providedBytes);

  if (!authorized) {
    return NextResponse.json({ ok: false, error: "Yetkisiz" }, { status: 401 });
  }

  // İki iş birbirinden BAĞIMSIZ: gönderim ve makbuz kontrolü.
  // Promise.all kullanıldığında biri throw ettiğinde öbürünün sonucu da
  // kayboluyor ve route 500 dönüyordu — zamanlayıcı da hatayı "iş yapılmadı"
  // diye değil "uç bozuk" diye görüyordu. allSettled ikisini ayırıyor.
  const [dispatch, receipts] = await Promise.allSettled([
    dispatchPendingPushes(),
    checkPushReceipts(),
  ]);

  const errors: string[] = [];
  if (dispatch.status === "rejected") {
    errors.push(`dispatch: ${dispatch.reason instanceof Error ? dispatch.reason.message : String(dispatch.reason)}`);
  }
  if (receipts.status === "rejected") {
    errors.push(`receipts: ${receipts.reason instanceof Error ? receipts.reason.message : String(receipts.reason)}`);
  }

  return NextResponse.json(
    {
      // Kısmi başarı da başarıdır: biri çalıştıysa zamanlayıcı yeniden denemesin.
      ok: errors.length === 0,
      dispatch: dispatch.status === "fulfilled" ? dispatch.value : null,
      receipts: receipts.status === "fulfilled" ? receipts.value : null,
      errors: errors.length ? errors : undefined,
      enabled: process.env.PUSH_ENABLED === "true",
    },
    // Her ikisi de düştüyse 500: zamanlayıcı/izleme bunu görsün.
    { status: errors.length === 2 ? 500 : 200 },
  );
}
