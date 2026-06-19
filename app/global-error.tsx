"use client";

// Kök layout hatasında devreye girer (root layout'u DEĞİŞTİRİR → Tailwind/globals
// garanti değil, bu yüzden inline stil). Markalı minimal hata ekranı + tekrar dene.
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="tr">
      <body style={{ margin: 0, fontFamily: "system-ui, Arial, sans-serif", background: "#0A1730", color: "#fff" }}>
        <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, textAlign: "center" }}>
          <div style={{ maxWidth: 420 }}>
            <div style={{ fontWeight: 700, fontSize: 18 }}>
              Kütahya<span style={{ color: "#E3AC35" }}>Satılık</span>
            </div>
            <h1 style={{ marginTop: 16, fontSize: 24 }}>Bir şeyler ters gitti</h1>
            <p style={{ marginTop: 8, color: "#D4E0F2" }}>Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.</p>
            <button
              onClick={() => reset()}
              style={{ marginTop: 20, background: "#E3AC35", color: "#0A1730", border: 0, borderRadius: 10, padding: "11px 20px", fontWeight: 700, cursor: "pointer" }}
            >
              Tekrar Dene
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
