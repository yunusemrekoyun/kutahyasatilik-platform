import "server-only";
import sanitizeHtmlLib from "sanitize-html";

// ---------------------------------------------------------------------------
// CMS (blog / içerik sayfası) HTML temizleme — allowlist tabanlı.
// TipTap editör çıktısına (başlık, liste, alıntı, link, görsel) uygundur.
// Amaç: stored XSS'i kaynağında engellemek (javascript:/data: URL, <script>,
// onerror gibi olay öznitelikleri, iframe vb. tamamen elenir).
// ---------------------------------------------------------------------------
const OPTIONS: sanitizeHtmlLib.IOptions = {
  allowedTags: [
    "p", "br", "strong", "b", "em", "i", "s", "u",
    "h2", "h3", "h4",
    "ul", "ol", "li",
    "blockquote", "pre", "code", "hr",
    "a", "img",
    "figure", "figcaption", "span",
  ],
  allowedAttributes: {
    a: ["href", "target", "rel"],
    img: ["src", "alt", "title", "width", "height", "class"],
    span: ["class"],
    p: ["class"],
    figure: ["class"],
  },
  // Yalnızca güvenli protokoller; javascript:, vbscript: vb. elenir.
  allowedSchemes: ["http", "https", "mailto", "tel"],
  // Görseller yalnızca http/https veya (şemasız) yerel /uploads yollarından gelir.
  allowedSchemesByTag: { img: ["http", "https"] },
  // //evil.com gibi protokol-göreli adresleri engelle (yerel /uploads yolu serbest).
  allowProtocolRelative: false,
  // Tüm dış linkleri güvenli hale getir.
  transformTags: {
    a: sanitizeHtmlLib.simpleTransform("a", {
      rel: "noopener noreferrer nofollow",
      target: "_blank",
    }),
  },
};

export function sanitizeCmsHtml(html: string | null | undefined): string {
  if (!html) return "";
  return sanitizeHtmlLib(html, OPTIONS);
}
