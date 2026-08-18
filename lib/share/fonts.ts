/**
 * Paylaşım kartı ve OG görselleri için font yükleme.
 *
 * DEĞİŞKEN FONT KULLANILAMAZ: satori (next/og'un altındaki motor) `fvar` tablosu
 * gören TTF'de `parseFvarAxis` sırasında patlıyor ve route komple 500 dönüyor.
 * Bu yüzden @expo-google-fonts/geist'in STATİK örnekleri public/fonts altına
 * kopyalandı ve buradan okunuyor.
 *
 * `next/font/google` çıktısı da kullanılamaz: onlar .woff2 ve satori WOFF2
 * çözemiyor.
 *
 * Dosyalar modül seviyesinde bir kez okunup bellekte tutuluyor — kart üretimi
 * her istekte diske gitmesin.
 */
import { readFileSync } from "node:fs";
import path from "node:path";

export type CardFont = {
  name: string;
  data: Buffer;
  weight: 400 | 600 | 800;
  style: "normal";
};

const FONT_DIR = path.join(process.cwd(), "public", "fonts");

function load(file: string, weight: CardFont["weight"]): CardFont {
  return {
    name: "Geist",
    data: readFileSync(path.join(FONT_DIR, file)),
    weight,
    style: "normal",
  };
}

let cached: CardFont[] | null = null;

/** Kart üretiminde kullanılacak font seti. İlk çağrıda okunur, sonra bellekten. */
export function cardFonts(): CardFont[] {
  if (!cached) {
    cached = [
      load("Geist-400Regular.ttf", 400),
      load("Geist-600SemiBold.ttf", 600),
      load("Geist-800ExtraBold.ttf", 800),
    ];
  }
  return cached;
}
