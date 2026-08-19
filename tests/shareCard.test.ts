import { describe, expect, it } from "vitest";
import {
  CARD_SIZES,
  STORY_PANEL_PADDING_TOP,
  STORY_PHOTO_HEIGHT,
  STORY_SAFE_BOTTOM,
} from "../lib/share/card";

/**
 * Hikâye kartının dikey bütçesi.
 *
 * Kart bir kez şöyle kırılmıştı: üst güvenli alan (260) + fotoğraf (900) +
 * panel (760) + alt güvenli alan (260) = 2180 > 1920. Taşma yüzünden alt
 * güvenli alan fiilen uygulanmıyor, marka bandı Instagram'ın "yanıtla"
 * şeridinin altında kalıyordu — ve hata hiçbir yerde sinyal vermiyordu,
 * çünkü PNG yine 1080x1920 üretiliyor.
 *
 * Bu test bütçenin kapalı kaldığını kilitliyor. Sabitler card.tsx'ten OKUNUYOR;
 * biri değişip bütçe kapanmazsa test düşer.
 */

describe("hikâye kartı dikey bütçesi", () => {
  const { height } = CARD_SIZES.story;

  it("fotoğraf ve panel tam olarak kadrajı doldurur", () => {
    const panelHeight = height - STORY_PHOTO_HEIGHT;
    expect(STORY_PHOTO_HEIGHT + panelHeight).toBe(height);
  });

  it("içeriğe alt güvenli alandan sonra yer kalır", () => {
    const panelHeight = height - STORY_PHOTO_HEIGHT;
    const usable = panelHeight - STORY_PANEL_PADDING_TOP - STORY_SAFE_BOTTOM;
    // Rozet + iki satır başlık + özellikler + fiyat + marka bandı ~485px.
    expect(usable).toBeGreaterThan(500);
  });

  it("og kartı yatay ve hikâye dikey", () => {
    expect(CARD_SIZES.og.width).toBeGreaterThan(CARD_SIZES.og.height);
    expect(CARD_SIZES.story.height).toBeGreaterThan(CARD_SIZES.story.width);
  });
});
