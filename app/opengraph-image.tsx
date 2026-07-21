import { ImageResponse } from "next/og";

export const alt = "Kütahya Satılık - Dijital Emlak Ofisi";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: 72, background: "linear-gradient(135deg,#0A1730,#1E3A6B)", color: "white" }}>
      <div style={{ fontSize: 30, color: "#D9B64A", letterSpacing: 4 }}>DİJİTAL EMLAK OFİSİ</div>
      <div style={{ marginTop: 24, fontSize: 76, fontWeight: 800 }}>Kütahya Satılık</div>
      <div style={{ marginTop: 20, fontSize: 34, color: "#D3DEEF" }}>Doğru gayrimenkul, güvenli iletişim.</div>
    </div>,
    size
  );
}
