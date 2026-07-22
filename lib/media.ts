// Video / sanal tur URL'lerini güvenli embed (iframe) adreslerine çevirir.

// YouTube veya Vimeo bağlantısını embed adresine çevirir. Tanınmazsa null döner.
export function toVideoEmbed(url?: string | null): string | null {
  if (!url) return null;
  const u = url.trim();

  // YouTube: watch?v=, youtu.be/, embed/, shorts/
  const yt = u.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/
  );
  if (yt) return `https://www.youtube-nocookie.com/embed/${yt[1]}`;

  // Vimeo
  const vm = u.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vm) return `https://player.vimeo.com/video/${vm[1]}`;

  return null;
}

// Sanal tur (Matterport, Kuula, 360 sağlayıcıları) — yalnız kimlik bilgisi
// içermeyen HTTPS bağlantıları iframe'e verilir.
export function toTourEmbed(url?: string | null): string | null {
  if (!url) return null;
  const u = url.trim();
  try {
    const parsed = new URL(u);
    if (parsed.protocol !== "https:" || parsed.username || parsed.password) return null;
  } catch {
    return null;
  }
  // Matterport "show?m=ID" linkini embed'e normalleştir
  const mp = u.match(/matterport\.com\/show\/?\?m=([\w-]+)/i);
  if (mp) return `https://my.matterport.com/show/?m=${mp[1]}&play=1`;
  return u;
}

export function hasAnyMedia(listing: {
  videoUrl?: string | null;
  droneUrl?: string | null;
  virtualTourUrl?: string | null;
}): boolean {
  return Boolean(
    toVideoEmbed(listing.videoUrl) ||
      toVideoEmbed(listing.droneUrl) ||
      toTourEmbed(listing.virtualTourUrl)
  );
}

// ---------------------------------------------------------------------------
// Görsel URL yardımcıları
// ---------------------------------------------------------------------------
const MEDIA_BASE = (process.env.NEXT_PUBLIC_MEDIA_URL || "").replace(/\/$/, "");

// Yerel /uploads yolunu gerekiyorsa media subdomain'i (NEXT_PUBLIC_MEDIA_URL) ile
// mutlak hale getirir. Base boşsa URL aynen döner (aynı domain). Dış URL'lere dokunmaz.
// Böylece ileride medya R2/subdomain'e taşınınca DB/kod değişmeden URL'ler güncellenir.
export function mediaUrl(url?: string | null): string {
  if (!url) return "";
  if (MEDIA_BASE && url.startsWith("/uploads/")) return MEDIA_BASE + url;
  return url;
}

/** Public image sources must be same-origin paths or encrypted remote URLs. */
export function publicImageUrl(url?: string | null): string | null {
  if (!url) return null;
  const source = mediaUrl(url.trim());
  return source.startsWith("/") || source.startsWith("https://") ? source : null;
}

// Liste kartı/önizleme için küçük varyant: /uploads/x.webp -> /uploads/x-thumb.webp
// (upload sırasında üretilir). Yerel-olmayan/uygunsuz URL'lerde mediaUrl ile aynen döner.
export function thumbUrl(url?: string | null): string {
  if (!url) return "";
  if (url.startsWith("/uploads/") && url.endsWith(".webp")) {
    return mediaUrl(url.replace(/\.webp$/, "-thumb.webp"));
  }
  return mediaUrl(url);
}
