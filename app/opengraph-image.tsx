import { ImageResponse } from "next/og";
import { SITE_NAME } from "@/lib/site";

export const alt = `${SITE_NAME}, ruang untuk belajar satu slide setiap langkah`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// ImageResponse cannot read CSS variables: zinc on dark, teal-400 and
// orange-400 as in the dark theme.
const ACCENT = "#0f766e";
const ACCENT_WARM = "#ea7a17";

function Mark({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <path d="M20 3H8a5 5 0 0 0-5 5v16a5 5 0 0 0 5 5h16a5 5 0 0 0 5-5V12" stroke={ACCENT} strokeWidth="2.5" strokeLinecap="round" />
      <rect x="12.5" y="9.5" width="11" height="8" rx="1.75" stroke={ACCENT} strokeWidth="1.75" />
      <rect x="8" y="14" width="12" height="9" rx="1.75" fill={ACCENT} />
      <path d="M10.75 17.5h6.5M10.75 20.25h3.5" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="27.5" cy="5" r="2.2" fill={ACCENT_WARM} />
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
        backgroundColor: "#f2f1f7",
        padding: 80,
        fontFamily: "sans-serif",
      }}
    >

      <div style={{ display: "flex", flexDirection: "column", flex: 1, maxWidth: 700 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 34, fontWeight: 700, color: "#141318" }}>
          <Mark size={52} />
          {SITE_NAME}
        </div>
        <div style={{ display: "flex", marginTop: "auto", fontSize: 72, fontWeight: 800, lineHeight: 1.05, letterSpacing: -2, color: "#141318" }}>
          Ruang untuk belajar, satu slide setiap langkah
        </div>
        <div style={{ display: "flex", marginTop: 28, fontSize: 28, lineHeight: 1.45, color: "#575566" }}>
          Materi pemrograman yang bisa kamu telusuri langsung di browser.
        </div>
      </div>

      <div style={{ position: "absolute", right: 70, top: 120, width: 380, height: 380, borderRadius: 48, backgroundColor: "#e6e0ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Mark size={260} />
      </div>
      <div style={{ position: "absolute", right: 300, bottom: 70, width: 150, height: 56, borderRadius: 9999, backgroundColor: "#141318", color: "#f2f1f7", fontSize: 24, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
        Gratis
      </div>
    </div>,
    size
  );
}
