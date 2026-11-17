// Ruang Materi icon set, in the sticker style: 48x48 grid, rounded 3px strokes in currentColor,
// one matcha tint and one paper fill. Override per place with --icon-tint / --icon-paper.
// Always aria-hidden: shown next to a text label.
type P = { className?: string };

const tint = { fill: "var(--icon-tint, var(--color-matcha-300))" };
const paper = { fill: "var(--icon-paper, #fff)" };

function Svg({ className, children }: P & { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round"
      strokeLinejoin="round" aria-hidden className={className}>
      {children}
    </svg>
  );
}

// Privasi
export const Tersimpan = (p: P) => (
  <Svg {...p}>
    <rect x="6" y="26" width="36" height="14" rx="4" style={tint} />
    <rect x="6" y="9" width="36" height="14" rx="4" style={paper} />
    <path d="M12 16h.01M12 33h.01M20 16h10M20 33h10" strokeWidth={4} />
  </Svg>
);
export const TidakAda = (p: P) => (
  <Svg {...p}>
    <circle cx="24" cy="24" r="18" style={paper} />
    <circle cx="24" cy="24" r="8" style={tint} />
    <path d="M11.5 36.5l25-25" />
  </Svg>
);
export const Usia = (p: P) => (
  <Svg {...p}>
    <circle cx="24" cy="14" r="7" style={paper} />
    <path d="M9 41c0-8 6-13 15-13s15 5 15 13z" style={tint} />
    <path d="M20 35l3 3 6-6" />
  </Svg>
);
export const Pemroses = (p: P) => (
  <Svg {...p}>
    <path d="M12 34a8 8 0 0 1-.5-16A11 11 0 0 1 33 15a9 9 0 0 1 3 17.6V34z" style={tint} />
    <path d="M24 28v14M18 36l6 6 6-6" style={{ fill: "none" }} />
  </Svg>
);
export const Unduh = (p: P) => (
  <Svg {...p}>
    <path d="M10 5h20l8 8v30H10z" style={paper} /><path d="M30 5v8h8" />
    <rect x="15" y="27" width="18" height="10" rx="3" style={tint} /><path d="M24 20v10M20 26l4 4 4-4" />
  </Svg>
);
export const Bocor = (p: P) => (
  <Svg {...p}>
    <path d="M24 4l16 6v12c0 10-7 17-16 21C15 39 8 32 8 22V10z" style={tint} />
    <path d="M24 15v10" /><path d="M24 31h.01" strokeWidth={4} />
  </Svg>
);

// Belajar
export const Api = (p: P) => (
  <Svg {...p}>
    <path d="M24 4c2 8 12 12 12 24a12 12 0 0 1-24 0c0-6 3-9 5-12 1 3 2 4 4 5 0-6-1-11 3-17z" style={tint} />
    <path d="M24 42a6 6 0 0 1-6-6c0-4 3-6 6-10 3 4 6 6 6 10a6 6 0 0 1-6 6z" style={paper} />
  </Svg>
);
export const Kartu = (p: P) => (
  <Svg {...p}>
    <rect x="12" y="4" width="30" height="22" rx="4" transform="rotate(8 27 15)" style={tint} />
    <rect x="6" y="14" width="30" height="24" rx="4" transform="rotate(-6 21 26)" style={paper} />
    <path d="M13 24h14M13 31h8" transform="rotate(-6 21 26)" />
  </Svg>
);
export const Medali = (p: P) => (
  <Svg {...p}>
    <path d="M14 4h8l4 12h-8zM34 4h-8l-4 12h8z" style={paper} />
    <circle cx="24" cy="30" r="12" style={tint} />
    <path d="M24 24l2 4 4.5.5-3.3 3 1 4.5-4.2-2.3-4.2 2.3 1-4.5-3.3-3 4.5-.5z" style={paper} strokeWidth={2} />
  </Svg>
);
export const Sasaran = (p: P) => (
  <Svg {...p}>
    <circle cx="22" cy="26" r="17" style={paper} /><circle cx="22" cy="26" r="10" style={tint} />
    <circle cx="22" cy="26" r="3" style={{ fill: "currentColor" }} />
    <path d="M22 26L40 8M34 6l8 0 0 8" />
  </Svg>
);
export const Waktu = (p: P) => (
  <Svg {...p}>
    <path d="M20 4h8M24 4v6" /><circle cx="24" cy="27" r="16" style={paper} />
    <path d="M24 27V17" /><path d="M24 27l7 5" />
    <path d="M24 11a16 16 0 0 1 16 16H24z" style={tint} stroke="none" />
  </Svg>
);
export const Latihan = (p: P) => (
  <Svg {...p}>
    <rect x="8" y="5" width="32" height="38" rx="4" style={paper} />
    <rect x="14" y="12" width="7" height="7" rx="2" style={tint} /><path d="M26 15.5h8" />
    <rect x="14" y="26" width="7" height="7" rx="2" style={tint} /><path d="M26 29.5h8M16 15l1.5 1.5L20 14" strokeWidth={2.5} />
  </Svg>
);

// Roadmap tracks
export const Frontend = (p: P) => (
  <Svg {...p}>
    <rect x="4" y="7" width="40" height="32" rx="5" style={paper} />
    <path d="M4 17h40" /><path d="M10 12h.01M16 12h.01" strokeWidth={4} />
    <rect x="10" y="23" width="13" height="10" rx="2.5" style={tint} /><path d="M29 24h9M29 31h6" />
  </Svg>
);
export const Cabang = (p: P) => (
  <Svg {...p}>
    <path d="M12 12v24M12 30c0-8 6-9 14-9h4a6 6 0 0 0 6-6" />
    <circle cx="12" cy="10" r="5" style={paper} /><circle cx="12" cy="38" r="5" style={tint} /><circle cx="36" cy="12" r="5" style={tint} />
  </Svg>
);
export const Backend = (p: P) => (
  <Svg {...p}>
    <rect x="6" y="5" width="36" height="14" rx="4" style={paper} />
    <rect x="6" y="22" width="36" height="14" rx="4" style={tint} />
    <path d="M12 12h.01M12 29h.01M20 12h10M20 29h10" strokeWidth={4} /><path d="M24 36v6M16 42h16" />
  </Svg>
);
export const Infrastruktur = (p: P) => (
  <Svg {...p}>
    <path d="M24 17v8M24 25l-12 8M24 25l12 8" />
    <rect x="15" y="4" width="18" height="13" rx="3.5" style={tint} />
    <rect x="3" y="31" width="18" height="13" rx="3.5" style={paper} /><rect x="27" y="31" width="18" height="13" rx="3.5" style={paper} />
  </Svg>
);
export const Jalur = (p: P) => (
  <Svg {...p}>
    <path d="M12 38c14 0 14-14 0-14S10 10 36 10" /><circle cx="10" cy="38" r="5" style={paper} />
    <path d="M36 4l7 6-7 6z" style={tint} />
  </Svg>
);

// Kelas, ujian, dan perayaan
export const Ujian = (p: P) => (
  <Svg {...p}>
    <rect x="9" y="8" width="30" height="35" rx="4" style={paper} />
    <rect x="16" y="3" width="16" height="10" rx="3" style={tint} />
    <path d="M16 26l5 5 11-11" />
  </Svg>
);
export const Proyek = (p: P) => (
  <Svg {...p}>
    <rect x="4" y="6" width="40" height="28" rx="4" style={paper} />
    <path d="M19 15l-6 5 6 5M29 15l6 5-6 5" />
    <path d="M12 42h24M24 34v8" style={tint} />
  </Svg>
);
export const Surat = (p: P) => (
  <Svg {...p}>
    <rect x="4" y="10" width="40" height="29" rx="5" style={paper} />
    <path d="M6 14l18 14 18-14" />
    <circle cx="38" cy="36" r="8" style={tint} /><path d="M34.5 36l2.5 2.5 4.5-5" strokeWidth={2.5} />
  </Svg>
);
export const Pesta = (p: P) => (
  <Svg {...p}>
    <path d="M6 42l8-24 18 18z" style={tint} />
    <path d="M14 18l18 18" />
    <path d="M26 8c0 4 3 4 3 8M36 20c4 0 5-3 9-3M32 10h.01M40 28h.01M20 6h.01" />
  </Svg>
);
export const Slide = (p: P) => (
  <Svg {...p}>
    <path d="M6 5h36M10 5v24a3 3 0 0 0 3 3h22a3 3 0 0 0 3-3V5" style={paper} />
    <path d="M17 24v-5M24 24V13M31 24v-8" strokeWidth={4} /><path d="M24 32v8M17 43l7-3 7 3" />
  </Svg>
);
