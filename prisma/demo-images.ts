/**
 * Demo katalog görselleri — Wikimedia Commons'tan indirilir, küçültülüp
 * UPLOAD_DIR'e yazılır.
 *
 * NEDEN KATALOG DOSYASI: Önceki sürüm loremflickr'a anahtar kelime gönderiyordu
 * ("camera", "console") ve dönen görseller çoğunlukla alakasızdı — kamera diye
 * kelebek ve otobüs, konsol diye ses miksaj masası, telefon diye perde geliyordu.
 * Anahtar kelimeyle arama, ürün fotoğrafı üretmenin güvenilir yolu değil.
 *
 * Bunun yerine demo-images.json, alt tür başına ELLE DOĞRULANMIŞ "ürün" setleri
 * tutuyor: her ürün bir ilana karşılık gelir ve 3-4 fotoğrafı aynı modele aittir.
 * Vasıta ve teknolojide ürünün marka/model/yıl bilgisi de burada; ilan başlığı
 * bu bilgiden üretiliyor, böylece "2018 Renault Clio" ilanında gerçekten Clio
 * görünüyor.
 */
import { mkdir, writeFile, access, readFile } from "fs/promises";
import { createHash } from "crypto";
import path from "path";
import sharp from "sharp";
import { getUploadDir } from "../lib/uploads";

/** Wikimedia, kimliksiz isteklere 403 dönebiliyor; açıklayıcı UA zorunlu. */
const USER_AGENT =
  "KutahyaSatilikDemoSeed/1.0 (https://kutahyasatilik.com; demo catalog seeding)";

/** Kart ve galeri için 1200 piksel fazlasıyla yeterli; Commons aslı 3-5 MB olabiliyor. */
const TARGET_WIDTH = 1200;
const JPEG_QUALITY = 78;

// Wikimedia ardışık hızlı isteklerde kısıtlıyor: aralıksız indirmede ilk ~50
// dosyadan sonra tamamı başarısız oluyordu (aynı URL curl ile hâlâ 200 dönüyor,
// yani kalıcı değil, hız kaynaklı). Nezaket gecikmesi + geri çekilmeli yeniden
// deneme ile 700 dosyalık katalog sorunsuz iniyor.
const THROTTLE_MS = 220;
const MAX_ATTEMPTS = 4;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export type CatalogItem = {
  label: string;
  marka?: string;
  model?: string;
  yil?: number;
  renk?: string;
  /** teknoloji: "sifir" | "ikinci_el" */
  durum?: string;
  /** Commons tam indirme URL'leri (upload.wikimedia.org) */
  files: string[];
};

/** Anahtar "vasita-otomobil" biçiminde: <kategori>-<altTür>. */
export type ImageCatalog = Record<string, CatalogItem[]>;

/** Bir ilana bağlanacak hazır set: yerel /uploads yolları + ürün bilgisi. */
export type PreparedItem = Omit<CatalogItem, "files"> & { urls: string[] };

export const CATALOG_PATH = path.join(process.cwd(), "prisma", "demo-images.json");

export async function loadCatalog(): Promise<ImageCatalog> {
  try {
    return JSON.parse(await readFile(CATALOG_PATH, "utf8")) as ImageCatalog;
  } catch {
    return {};
  }
}

async function download(url: string, dest: string): Promise<boolean> {
  try {
    await access(dest);
    return true; // zaten indirilmiş
  } catch {
    /* indirilecek */
  }
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      await sleep(THROTTLE_MS);
      const res = await fetch(url, { headers: { "User-Agent": USER_AGENT }, redirect: "follow" });
      if (!res.ok) {
        // 429/503 geçici; 404 kalıcı, tekrar denemenin anlamı yok.
        if (res.status === 404 || res.status === 403) return false;
        await sleep(attempt * 1500);
        continue;
      }
      const input = Buffer.from(await res.arrayBuffer());
      if (input.length < 4000) return false;
      // Küçültme burada: 700 görsel × 3 MB diskte 2 GB'a yakın yer kaplardı ve
      // ilan sayfası her kartta orijinali indirmeye çalışırdı.
      const output = await sharp(input)
        .rotate() // EXIF yönünü uygula, sonra meta veriyi düşür
        .resize({ width: TARGET_WIDTH, withoutEnlargement: true })
        .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
        .toBuffer();
      await writeFile(dest, output);
      return true;
    } catch {
      await sleep(attempt * 1500);
    }
  }
  return false;
}

/**
 * Katalogdaki her ürünün fotoğraflarını indirir.
 *
 * Dönen yapı alt tür anahtarına göre gruplanır (`otomobil`, `daire`...), yani
 * katalog anahtarındaki kategori öneki burada düşer.
 */
export async function prepareCatalogImages(
  catalog: ImageCatalog,
  options: { skipDownload?: boolean; minPhotos?: number } = {},
): Promise<Record<string, PreparedItem[]>> {
  // Varsayılan 1: telefon/tablet gibi bazı alt türlerde serbest lisanslı temiz
  // ürün fotoğrafı bulmak zor ve ikinci el ilanı tek fotoğrafla yayınlamak
  // gerçek hayatta da olağan. Eşiği 2 tutmak o alt türleri tamamen boşaltıyordu.
  const minPhotos = options.minPhotos ?? 1;
  const dir = getUploadDir();
  await mkdir(dir, { recursive: true });
  const prepared: Record<string, PreparedItem[]> = {};

  for (const [catalogKey, items] of Object.entries(catalog)) {
    const subType = catalogKey.includes("-") ? catalogKey.slice(catalogKey.indexOf("-") + 1) : catalogKey;
    prepared[subType] = prepared[subType] ?? [];

    for (const item of items) {
      const urls: string[] = [];
      for (const fileUrl of item.files) {
        // Dosya adı KAYNAK URL'İN ÖZETİNDEN üretiliyor, katalogdaki sıradan
        // değil. Sıra tabanlı adlandırmada katalogdan bir ürün ayıklandığında
        // sonraki ürünlerin indeksi kayıyor ve diskteki mevcut dosyalar sessizce
        // YANLIŞ ürüne bağlanıyordu — ayıklanan çöp görsel başka bir ilanda
        // yeniden ortaya çıkıyordu.
        const name = `demo-${subType}-${createHash("sha1").update(fileUrl).digest("hex").slice(0, 10)}.jpg`;
        const full = path.join(dir, name);
        if (options.skipDownload) {
          try {
            await access(full);
            urls.push(`/uploads/${name}`);
          } catch {
            /* yok, atla */
          }
          continue;
        }
        if (await download(fileUrl, full)) {
          urls.push(`/uploads/${name}`);
          process.stdout.write(".");
        } else {
          process.stdout.write("x");
        }
      }
      if (urls.length >= minPhotos) {
        const { files: _files, ...rest } = item;
        void _files;
        prepared[subType].push({ ...rest, urls });
      }
    }
  }

  return prepared;
}
