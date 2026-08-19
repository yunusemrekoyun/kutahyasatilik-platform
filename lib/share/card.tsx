/**
 * İlan paylaşım kartı — tek şablon, iki boyut.
 *
 * TEK KAYNAK: kart sunucuda üretiliyor ve web, iOS, Android aynı görseli
 * alıyor. Cihazda üretmek (react-native-view-shot) denenmedi çünkü çıktı
 * cihazın piksel oranına bağlı; 1080x1920 garanti edilemiyor ve gölge/gradient
 * iki platformda farklı çiziliyor.
 *
 * İki boyut aynı bileşenden çıkıyor:
 *   story (1080x1920) — Instagram hikâyesi
 *   og    (1200x630)  — WhatsApp/Facebook link önizlemesi
 */
import type { ReactElement } from "react";
import { formatPriceForCard } from "./format";

const NAVY = "#0A1730";
const NAVY_SOFT = "#1E3A6B";
const GOLD = "#E3AC35";
const PAPER = "#FFFFFF";
const MUTED = "#6B7280";
const INK = "#1A1D21";

export type ShareCardData = {
  title: string;
  price: number;
  currency: string;
  district: string;
  neighborhood?: string | null;
  subTypeLabel: string;
  /** Kartta gösterilecek 2-3 kısa özellik ("3+1", "120 m²", "85.000 km") */
  facts: string[];
  /** Mutlak URL — satori uzak görseli kendisi indirir */
  imageUrl: string | null;
  sold: boolean;
  referenceNo: string;
};

export type CardVariant = "story" | "og";

export const CARD_SIZES: Record<CardVariant, { width: number; height: number }> = {
  story: { width: 1080, height: 1920 },
  og: { width: 1200, height: 630 },
};

/**
 * Instagram hikâyede üstteki profil şeridi ve alttaki "yanıtla" alanı kadrajın
 * yaklaşık %14'ünü kapatıyor.
 *
 * ÜST güvenli alan artık BOŞ BIRAKILMIYOR: fotoğraf tepeye kadar tam kanıyor,
 * Instagram'ın arayüzü görselin üstüne biniyor. Eskiden burası düz lacivert bir
 * banttı — kadrajın sekizde biri hiçbir şey söylemeyen boş bir blok olarak
 * duruyordu ve kart yarım görünüyordu.
 *
 * ALT güvenli alan panelin PADDING'i olarak veriliyor. Eskiden margin'di ve
 * toplam yükseklik 260+900+760+260 = 2180 > 1920 taşıyordu; taşma yüzünden alt
 * güvenli alan fiilen hiç uygulanmıyor, marka bandı kadrajın en dibine yapışıyordu.
 */
export const STORY_SAFE_BOTTOM = 260;

/**
 * Fotoğrafın bittiği yükseklik. Kalan alan bilgi paneli.
 *
 * 1120 değil 1000: panelin kullanılabilir yüksekliği
 * (1920 - foto - üst padding - alt güvenli alan) içeriğin toplam boyuna eşit
 * kalıyordu, aradaki her boşluk sıfıra iniyordu.
 */
export const STORY_PHOTO_HEIGHT = 1000;

/** Bilgi panelinin üst iç boşluğu. */
export const STORY_PANEL_PADDING_TOP = 52;

function Badge({ text, size }: { text: string; size: number }) {
  return (
    <div
      style={{
        display: "flex",
        background: GOLD,
        color: NAVY,
        fontSize: size,
        fontWeight: 800,
        padding: `${size * 0.35}px ${size * 0.8}px`,
        borderRadius: size,
        letterSpacing: 0.5,
      }}
    >
      {text}
    </div>
  );
}

export function ShareCard({ data, variant }: { data: ShareCardData; variant: CardVariant }): ReactElement {
  const story = variant === "story";
  const { width, height } = CARD_SIZES[variant];

  // Story dikey: fotoğraf üstte tam kanar, bilgi altta. OG yatay: fotoğraf solda.
  const photoHeight = story ? STORY_PHOTO_HEIGHT : height;
  const photoWidth = story ? width : Math.round(width * 0.52);
  // Bilgi panelinin genişliği AÇIKÇA veriliyor. flexGrow ile bırakıldığında
  // satori metnin doğal genişliğini kullanıp kutuyu taşırıyor: uzun başlık
  // panelin sağından çıkıyor ve "İlan No" kırpılıyordu.
  const infoWidth = story ? width : width - photoWidth;
  const infoPadding = story ? 72 : 60;
  const textWidth = infoWidth - infoPadding * 2;

  const price = formatPriceForCard(data.price, data.currency);
  const location = [data.neighborhood, data.district].filter(Boolean).join(", ");

  const titleSize = story ? 52 : 40;
  // Başlık en fazla İKİ satır. Yükseklik satır kutusundan hesaplanıyor; sabit bir
  // çarpanla verildiğinde ikinci satırın alt uzantıları ("ğ", "ı") kırpılıyordu.
  const titleLineHeight = 1.28;
  const titleMaxHeight = Math.round(titleSize * titleLineHeight * 2) + 6;
  const priceSize = story ? 92 : 62;
  const factSize = story ? 34 : 26;

  return (
    <div
      style={{
        width,
        height,
        display: "flex",
        flexDirection: story ? "column" : "row",
        background: `linear-gradient(160deg, ${NAVY_SOFT}, ${NAVY})`,
        fontFamily: "Geist",
        position: "relative",
      }}
    >
      {/* FOTOĞRAF */}
      <div
        style={{
          display: "flex",
          width: photoWidth,
          height: photoHeight,
          position: "relative",
          background: NAVY,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {data.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={data.imageUrl} alt="" width={photoWidth} height={photoHeight} style={{ objectFit: "cover" }} />
        ) : (
          // Görselsiz ilan: boş lacivert yerine marka. Kart yine bitmiş görünsün.
          <div
            style={{
              display: "flex",
              color: "rgba(255,255,255,0.55)",
              fontSize: story ? 44 : 32,
              fontWeight: 800,
              letterSpacing: 1,
            }}
          >
            kutahyasatilik.com
          </div>
        )}
        {data.sold && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: photoWidth,
              height: photoHeight,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(10,23,48,0.62)",
              color: PAPER,
              fontSize: story ? 96 : 64,
              fontWeight: 800,
              letterSpacing: 6,
            }}
          >
            SATILDI
          </div>
        )}
      </div>

      {/* BİLGİ */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: infoWidth,
          // Panel kadrajın dibine kadar uzanıyor; içerik alt güvenli alanın
          // ÜSTÜNDE bitiyor. Böylece Instagram'ın "yanıtla" şeridi boş beyaza
          // biniyor, fiyatın ya da marka bandının üstüne değil.
          height: story ? height - photoHeight : height,
          justifyContent: story ? "flex-start" : "center",
          padding: story
            ? `${STORY_PANEL_PADDING_TOP}px ${infoPadding}px ${STORY_SAFE_BOTTOM}px`
            : `56px ${infoPadding}px`,
          background: PAPER,
          // Fotoğrafla panel arasında ince marka çizgisi — sert kesim yumuşasın.
          borderTop: story ? `8px solid ${GOLD}` : "none",
        }}
      >
        {/* flexShrink: 0 — kolon flex'te varsayılan shrink 1. Panel dolduğunda
            satori çocukları büzüp metni ORTASINDAN kırpıyordu ("hatasız" satırı
            yarıdan kesilmişti). Bu bloklar asla küçülmemeli. */}
        <div style={{ display: "flex", width: textWidth, gap: 16, alignItems: "center", flexShrink: 0 }}>
          <Badge text={data.subTypeLabel} size={story ? 30 : 24} />
          <div style={{ display: "flex", color: MUTED, fontSize: factSize, fontWeight: 600 }}>{location}</div>
        </div>

        <div
          style={{
            display: "flex",
            width: textWidth,
            marginTop: story ? 30 : 20,
            fontSize: titleSize,
            fontWeight: 600,
            color: INK,
            lineHeight: titleLineHeight,
            // Uzun başlıklar kartı taşırmasın; satori satır kırpmayı destekliyor.
            maxHeight: titleMaxHeight,
            flexShrink: 0,
            overflow: "hidden",
          }}
        >
          {data.title}
        </div>

        {data.facts.length > 0 && (
          <div style={{ display: "flex", width: textWidth, gap: 28, marginTop: story ? 30 : 18, flexWrap: "wrap", flexShrink: 0 }}>
            {data.facts.slice(0, 3).map((fact) => (
              <div key={fact} style={{ display: "flex", color: MUTED, fontSize: factSize, fontWeight: 600 }}>
                {fact}
              </div>
            ))}
          </div>
        )}

        <div style={{ display: "flex", width: textWidth, marginTop: "auto", flexDirection: "column", flexShrink: 0 }}>
          <div style={{ display: "flex", fontSize: priceSize, fontWeight: 800, color: NAVY, letterSpacing: -1 }}>
            {price}
          </div>
          {/* Marka bandı: paylaşan kişi reklam yapmış gibi hissetmesin diye ince
              ve altta; ama ilana geri dönüş yolu (alan adı + ilan no) burada. */}
          <div
            style={{
              display: "flex",
              width: textWidth,
              marginTop: story ? 26 : 16,
              paddingTop: 20,
              borderTop: `2px solid #E3E6EA`,
              justifyContent: "space-between",
              alignItems: "center",
              color: MUTED,
              fontSize: story ? 28 : 22,
              fontWeight: 600,
            }}
          >
            <div style={{ display: "flex" }}>kutahyasatilik.com</div>
            <div style={{ display: "flex" }}>İlan No {data.referenceNo}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
