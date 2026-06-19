import "server-only";

// E-posta gönderimi — Resend REST API (ek paket yok, fetch ile).
// Anahtar yoksa no-op: özellik kademeli devre dışı, hiçbir akış bozulmaz.
// .env: RESEND_API_KEY, EMAIL_FROM (örn. 'KütahyaSatılık <bildirim@kutahyasatilik.com>')

const RESEND_ENDPOINT = "https://api.resend.com/emails";

export function emailEnabled(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> {
  if (!emailEnabled() || !to) return;
  try {
    await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: process.env.EMAIL_FROM, to, subject, html }),
    });
  } catch {
    // En iyi çaba — e-posta ikincildir, hata yutulur.
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Bildirim e-postası için basit markalı şablon (lacivert + altın).
export function notificationEmail(opts: { title: string; body?: string | null; link?: string | null }): string {
  const site = process.env.NEXT_PUBLIC_SITE_URL || "https://kutahyasatilik.com";
  const href = opts.link ? (opts.link.startsWith("http") ? opts.link : `${site}${opts.link}`) : site;
  const title = escapeHtml(opts.title);
  const body = opts.body ? `<p style="margin:0 0 18px;color:#334155;font-size:15px;line-height:1.6">${escapeHtml(opts.body)}</p>` : "";
  return `<div style="background:#f6f7f9;padding:28px">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:14px;overflow:hidden;border:1px solid #e2e8f0">
    <div style="background:#0A1730;padding:18px 24px">
      <span style="color:#fff;font-weight:700;font-size:16px">Kütahya<span style="color:#E3AC35">Satılık</span></span>
    </div>
    <div style="padding:24px">
      <h2 style="margin:0 0 12px;color:#0F172A;font-size:18px">${title}</h2>
      ${body}
      <a href="${href}" style="display:inline-block;background:#1E3A6B;color:#fff;text-decoration:none;border-radius:10px;padding:11px 18px;font-weight:600;font-size:14px">Görüntüle</a>
      <p style="margin:22px 0 0;color:#94A3B8;font-size:12px">Bu otomatik bir bildirimdir · KütahyaSatılık</p>
    </div>
  </div>
</div>`;
}
