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

// Sanal tur (Matterport, Kuula, 360 sağlayıcıları) — geçerli bir http(s) linkini
// olduğu gibi iframe'e veririz; sağlayıcılar embed'e izin verir.
export function toTourEmbed(url?: string | null): string | null {
  if (!url) return null;
  const u = url.trim();
  if (!/^https?:\/\//i.test(u)) return null;
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
