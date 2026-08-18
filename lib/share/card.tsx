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
  categoryLabel: string;
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
 * Instagram hikâyede üstteki profil şeridi ve alttaki "yanıtla" alanı
 * kadrajın yaklaşık %14'ünü kapatıyor. İçerik bu güvenli alanın içinde kalmalı,
 * yoksa fiyat ya da marka bandı Instagram'ın kendi arayüzünün altında kayboluyor.
 */
const STORY_SAFE_TOP = 260;
const STORY_SAFE_BOTTOM = 260;

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

  // Story dikey: fotoğraf üstte büyük, bilgi altta. OG yatay: fotoğraf solda.
  const photoHeight = story ? 900 : height;
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
          marginTop: story ? STORY_SAFE_TOP : 0,
          position: "relative",
          background: NAVY,
        }}
      >
        {data.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={data.imageUrl} alt="" width={photoWidth} height={photoHeight} style={{ objectFit: "cover" }} />
        ) : (
          <div style={{ display: "flex", width: "100%", height: "100%", background: NAVY_SOFT }} />
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
          height: story ? height - photoHeight - STORY_SAFE_TOP : height,
          justifyContent: story ? "flex-start" : "center",
          padding: `56px ${infoPadding}px`,
          marginBottom: story ? STORY_SAFE_BOTTOM : 0,
          background: PAPER,
        }}
      >
        <div style={{ display: "flex", width: textWidth, gap: 16, alignItems: "center" }}>
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
            lineHeight: 1.25,
            // Uzun başlıklar kartı taşırmasın; satori satır kırpmayı destekliyor.
            maxHeight: titleSize * 2.6,
            overflow: "hidden",
          }}
        >
          {data.title}
        </div>

        {data.facts.length > 0 && (
          <div style={{ display: "flex", width: textWidth, gap: 28, marginTop: story ? 30 : 18, flexWrap: "wrap" }}>
            {data.facts.slice(0, 3).map((fact) => (
              <div key={fact} style={{ display: "flex", color: MUTED, fontSize: factSize, fontWeight: 600 }}>
                {fact}
              </div>
            ))}
          </div>
        )}

        <div style={{ display: "flex", width: textWidth, marginTop: "auto", flexDirection: "column" }}>
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
