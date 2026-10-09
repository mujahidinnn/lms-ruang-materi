import { ImageResponse } from "next/og";
import { SITE_NAME } from "@/lib/site";

export const alt = `${SITE_NAME}, ruang untuk belajar satu slide setiap langkah`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// ImageResponse cannot read CSS variables: zinc on dark, accent teal-400.
const ACCENT = "#00d3bd";

function Mark({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <path d="M20 3H8a5 5 0 0 0-5 5v16a5 5 0 0 0 5 5h16a5 5 0 0 0 5-5V12" stroke="#fafafa" strokeWidth="2.5" strokeLinecap="round" />
      <rect x="12.5" y="9.5" width="11" height="8" rx="1.75" stroke={ACCENT} strokeWidth="1.75" />
      <rect x="8" y="14" width="12" height="9" rx="1.75" fill={ACCENT} />
      <path d="M10.75 17.5h6.5M10.75 20.25h3.5" stroke="#09090b" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export default function Image() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        backgroundColor: "#09090b",
        padding: 80,
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ position: "absolute", top: -200, left: 200, width: 560, height: 560, borderRadius: 9999, display: "flex", backgroundImage: "radial-gradient(circle, rgba(0,211,189,0.20) 0%, rgba(0,211,189,0) 70%)" }} />
      <div style={{ position: "absolute", bottom: -260, right: -120, width: 620, height: 620, borderRadius: 9999, display: "flex", backgroundImage: "radial-gradient(circle, rgba(0,211,189,0.16) 0%, rgba(0,211,189,0) 70%)" }} />

      <div style={{ display: "flex", flexDirection: "column", flex: 1, maxWidth: 700 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 34, fontWeight: 600, color: "#fafafa" }}>
          <Mark size={52} />
          {SITE_NAME}
        </div>
        <div style={{ display: "flex", marginTop: "auto", fontSize: 68, fontWeight: 700, lineHeight: 1.1, color: "#fafafa" }}>
          Ruang untuk belajar, satu slide setiap langkah
        </div>
        <div style={{ display: "flex", marginTop: 28, fontSize: 28, lineHeight: 1.45, color: "#a1a1aa" }}>
          Materi pemrograman yang bisa kamu telusuri langsung di browser.
        </div>
      </div>

      <div style={{ position: "absolute", right: 70, top: 155, display: "flex" }}>
        <Mark size={320} />
      </div>
    </div>,
    size
  );
}
