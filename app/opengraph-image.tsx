import { ImageResponse } from "next/og";
import { SITE_NAME } from "@/lib/site";

export const alt = `${SITE_NAME} · Ruang Belajar Interaktif`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        backgroundColor: "#09090b",
        padding: "80px",
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -180,
          right: -140,
          width: 560,
          height: 560,
          borderRadius: 9999,
          display: "flex",
          backgroundColor: "rgba(0,211,189,0.16)",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: -220,
          left: -120,
          width: 520,
          height: 520,
          borderRadius: 9999,
          display: "flex",
          backgroundColor: "rgba(0,211,189,0.09)",
        }}
      />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          justifyContent: "center",
          maxWidth: 620,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: 9999,
              display: "flex",
              backgroundColor: "#00d3bd",
            }}
          />
          <span
            style={{
              fontSize: 24,
              letterSpacing: 4,
              color: "#a1a1aa",
              textTransform: "uppercase",
            }}
          >
            Ruang Belajar Interaktif
          </span>
        </div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            columnGap: 20,
            marginTop: 32,
            fontSize: 76,
            fontWeight: 700,
            lineHeight: 1.15,
            color: "#fafafa",
          }}
        >
          <span style={{ display: "flex", color: "#00d3bd" }}>
            Ruang Materi
          </span>
          <span style={{ display: "flex" }}>Belajar</span>
        </div>

        <div
          style={{
            display: "flex",
            marginTop: 32,
            fontSize: 30,
            lineHeight: 1.45,
            color: "#a1a1aa",
          }}
        >
          Slide pembelajaran jadi halaman interaktif yang bisa ditelusuri
          langsung di browser.
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          right: 96,
          top: "50%",
          transform: "translateY(-50%)",
          width: 300,
          height: 300,
          display: "flex",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            transform: "rotate(-8deg)",
            backgroundColor: "#18181b",
            border: "2px solid #27272a",
            borderRadius: 24,
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            transform: "rotate(6deg)",
            backgroundColor: "#18181b",
            border: "2px solid #27272a",
            borderRadius: 24,
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            backgroundColor: "#09090b",
            border: "2px solid rgba(0,211,189,0.45)",
            borderRadius: 24,
            padding: 32,
          }}
        >
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: 14,
              display: "flex",
              backgroundColor: "#00d3bd",
            }}
          />
          <div
            style={{
              marginTop: 28,
              width: "75%",
              height: 14,
              borderRadius: 7,
              display: "flex",
              backgroundColor: "#52525b",
            }}
          />
          <div
            style={{
              marginTop: 14,
              width: "92%",
              height: 14,
              borderRadius: 7,
              display: "flex",
              backgroundColor: "#27272a",
            }}
          />
          <div
            style={{
              marginTop: 14,
              width: "55%",
              height: 14,
              borderRadius: 7,
              display: "flex",
              backgroundColor: "#27272a",
            }}
          />
          <div
            style={{
              marginTop: "auto",
              width: 90,
              height: 14,
              borderRadius: 7,
              display: "flex",
              backgroundColor: "#00d3bd",
            }}
          />
        </div>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: 24,
          color: "#71717a",
        }}
      >
        <span style={{ display: "flex" }}>ruang-materi.vercel.app</span>
        <span style={{ display: "flex" }}>Git · HTML · CSS · JavaScript</span>
      </div>
    </div>,
    { ...size },
  );
}
