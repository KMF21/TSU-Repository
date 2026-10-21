import { ImageResponse } from "next/og";

export const alt = "TSU Digital Research Repository — Taraba State University";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "linear-gradient(135deg, #0b1220 0%, #111a2e 55%, #16305c 100%)",
          color: "white",
        }}
      >
        <div style={{ display: "flex", fontSize: 26, letterSpacing: 6, color: "#8db6ec" }}>
          COLLEGE OF POSTGRADUATE STUDIES
        </div>
        <div style={{ display: "flex", fontSize: 76, fontWeight: 700, lineHeight: 1.1, marginTop: 28 }}>
          TSU Digital Research Repository
        </div>
        <div style={{ display: "flex", fontSize: 32, color: "#a6b0c0", marginTop: 28 }}>
          The permanent scholarly record of Taraba State University
        </div>
        <div style={{ display: "flex", marginTop: 56, height: 6, width: 160, background: "#2563eb", borderRadius: 3 }} />
      </div>
    ),
    size
  );
}
