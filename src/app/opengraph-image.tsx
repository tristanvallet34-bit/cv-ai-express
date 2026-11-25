import { ImageResponse } from "next/og";

export const alt = "CV Express — Créez un CV professionnel avec l'IA";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OG() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: 80, background: "linear-gradient(120deg,#312e81,#4f46e5 55%,#db2777)", color: "#fff", fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 40, fontWeight: 800 }}>
          <div style={{ width: 70, height: 70, borderRadius: 18, background: "rgba(255,255,255,.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>CV</div>
          CV Express
        </div>
        <div style={{ fontSize: 72, fontWeight: 800, marginTop: 40, lineHeight: 1.1 }}>Le CV qui décroche des entretiens</div>
        <div style={{ fontSize: 34, marginTop: 24, opacity: 0.9 }}>30 modèles · Assistant IA · Lettre de motivation · Score ATS</div>
      </div>
    ),
    size,
  );
}
