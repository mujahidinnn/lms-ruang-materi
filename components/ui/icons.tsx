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

export const Data = (p: P) => (
  <Svg {...p}>
    <path d="M8 10v28c0 3.500 7 6 16 6s16-2.500 16-6V10" style={paper} />
    <ellipse cx="24" cy="10" rx="16" ry="6" style={tint} />
    <path d="M8 21c0 3.500 7 6 16 6s16-2.500 16-6M8 30c0 3.500 7 6 16 6s16-2.500 16-6" />
  </Svg>
);
export const Mobile = (p: P) => (
  <Svg {...p}>
    <rect x="12" y="3" width="24" height="42" rx="6" style={paper} />
    <path d="M21 8h6" /><path d="M21 40h6" />
    <rect x="17" y="14" width="14" height="9" rx="2.500" style={tint} /><path d="M17 29h14M17 34h8" />
  </Svg>
);
export const UiUx = (p: P) => (
  <Svg {...p}>
    <rect x="4" y="6" width="32" height="34" rx="5" style={paper} />
    <path d="M4 15h32" />
    <rect x="9" y="20" width="22" height="9" rx="2.500" style={tint} />
    <path d="M9 34h10" />
    <path d="M44 20L32 38l-5 2 1-5 12-18z" style={paper} />
    <path d="M38 24l4 3" />
  </Svg>
);
export const Awan = (p: P) => (
  <Svg {...p}>
    <path d="M13 38a9 9 0 0 1-1-18 12 12 0 0 1 23-2 10 10 0 0 1 1 20z" style={paper} />
    <path d="M24 33V22M18.500 27.500L24 22l5.500 5.500" />
    <circle cx="35" cy="14" r="5" style={tint} />
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

export const Robot = (p: P) => (
  <Svg {...p}>
    <path d="M24 12V6" /><circle cx="24" cy="5" r="3" style={tint} />
    <rect x="7" y="12" width="34" height="26" rx="8" style={paper} />
    <rect x="3" y="21" width="4" height="9" rx="2" style={tint} /><rect x="41" y="21" width="4" height="9" rx="2" style={tint} />
    <circle cx="17" cy="24" r="4" style={tint} /><circle cx="31" cy="24" r="4" style={tint} />
    <path d="M18 31q6 5 12 0" />
    <path d="M15 38v5M33 38v5M12 43h6M30 43h6" />
  </Svg>
);

// More icons for roadmap tracks.
export const Terminal = (p: P) => (
  <Svg {...p}>
    <rect x="4" y="7" width="40" height="34" rx="5" style={paper} />
    <path d="M12 18l7 6-7 6" /><path d="M24 31h12" />
    <rect x="4" y="7" width="40" height="8" rx="4" style={tint} /><path d="M10 11h.01M16 11h.01" strokeWidth={4} />
  </Svg>
);
export const Globe = (p: P) => (
  <Svg {...p}>
    <circle cx="24" cy="24" r="19" style={paper} />
    <path d="M24 5c-9 9-9 29 0 38M24 5c9 9 9 29 0 38M5 24h38" />
    <path d="M9 14h30M9 34h30" strokeWidth={2.500} />
    <circle cx="24" cy="24" r="6" style={tint} />
  </Svg>
);
export const Kontainer = (p: P) => (
  <Svg {...p}>
    <path d="M24 4l17 9v22l-17 9-17-9V13z" style={paper} />
    <path d="M7 13l17 9 17-9M24 22v22" />
    <path d="M24 22l17-9v22l-17 9z" style={tint} />
  </Svg>
);
export const Roket = (p: P) => (
  <Svg {...p}>
    <path d="M24 4c8 5 11 14 9 26H15C13 18 16 9 24 4z" style={paper} />
    <circle cx="24" cy="18" r="4" style={tint} />
    <path d="M15 24l-7 9 8-1M33 24l7 9-8-1" style={tint} />
    <path d="M20 36c0 4 2 7 4 8 2-1 4-4 4-8" />
  </Svg>
);
export const Grafik = (p: P) => (
  <Svg {...p}>
    <rect x="4" y="5" width="40" height="38" rx="5" style={paper} />
    <rect x="11" y="26" width="6" height="11" rx="1.500" style={tint} />
    <rect x="21" y="18" width="6" height="19" rx="1.500" style={tint} />
    <rect x="31" y="11" width="6" height="26" rx="1.500" style={tint} />
  </Svg>
);
export const Buku = (p: P) => (
  <Svg {...p}>
    <path d="M24 12c-4-4-11-5-18-4v29c7-1 14 0 18 4 4-4 11-5 18-4V8c-7-1-14 0-18 4z" style={paper} />
    <path d="M24 12v29" />
    <path d="M12 16h7M12 23h7M29 16h7" strokeWidth={2.500} />
    <path d="M29 22h7v6h-7z" style={tint} />
  </Svg>
);
export const Kunci = (p: P) => (
  <Svg {...p}>
    <rect x="9" y="21" width="30" height="21" rx="5" style={tint} />
    <path d="M15 21v-6a9 9 0 0 1 18 0v6" style={{ fill: "none" }} />
    <circle cx="24" cy="30" r="3" style={paper} /><path d="M24 33v4" />
  </Svg>
);
export const Otak = (p: P) => (
  <Svg {...p}>
    <rect x="11" y="11" width="26" height="26" rx="6" style={paper} />
    <rect x="18" y="18" width="12" height="12" rx="3" style={tint} />
    <path d="M18 4v7M30 4v7M18 37v7M30 37v7M4 18h7M4 30h7M37 18h7M37 30h7" />
  </Svg>
);
export const Lampu = (p: P) => (
  <Svg {...p}>
    <path d="M17 33c0-4-6-6-6-13a13 13 0 0 1 26 0c0 7-6 9-6 13z" style={paper} />
    <path d="M17 33h14v5a3 3 0 0 1-3 3h-8a3 3 0 0 1-3-3z" style={tint} />
    <path d="M20 41h8M24 12v9M20 17l4 4 4-4" strokeWidth={2.500} />
  </Svg>
);
export const Gir = (p: P) => (
  <Svg {...p}>
    <path d="M20 4h8l1.500 5 4-2 5.600 5.600-2 4L42 20v8l-5 1.500 2 4-5.600 5.600-4-2L28 44h-8l-1.500-5-4 2L9 35.400l2-4L6 28v-8l5-1.500-2-4L14.600 9l4 2z" style={paper} />
    <circle cx="24" cy="24" r="7" style={tint} />
  </Svg>
);
export const Uji = (p: P) => (
  <Svg {...p}>
    <path d="M18 5h12M20 5v13L8 38a4 4 0 0 0 4 6h24a4 4 0 0 0 4-6L28 18V5" style={paper} />
    <path d="M13 32h22l5 8a3 3 0 0 1-3 4H11a3 3 0 0 1-3-4z" style={tint} />
    <path d="M20 26h.01M27 29h.01" strokeWidth={4} />
  </Svg>
);
export const Palet = (p: P) => (
  <Svg {...p}>
    <path d="M24 5C13 5 5 13 5 23s8 19 18 19c4 0 5-3 3-6s-1-7 4-7h6c5 0 7-3 7-7 0-9-8-17-19-17z" style={paper} />
    <circle cx="15" cy="22" r="3" style={tint} /><circle cx="22" cy="14" r="3" style={tint} /><circle cx="32" cy="16" r="3" style={tint} />
  </Svg>
);
export const Game = (p: P) => (
  <Svg {...p}>
    <path d="M13 13h22c6 0 9 6 10 15 1 8-5 9-8 4l-3-4H14l-3 4c-3 5-9 4-8-4 1-9 4-15 10-15z" style={paper} />
    <path d="M14 20v8M10 24h8" /><circle cx="31" cy="21" r="2.500" style={tint} /><circle cx="37" cy="26" r="2.500" style={tint} />
  </Svg>
);

// Studio Proyek: one icon per stage, plus video.
export const StudioBrief = (p: P) => (
  <Svg {...p}>
    <rect x="9" y="8" width="30" height="35" rx="5" style={paper} />
    <rect x="17" y="4" width="14" height="8" rx="3" style={tint} />
    <path d="M16 24h16M16 31h10" />
  </Svg>
);
export const StudioIde = (p: P) => (
  <Svg {...p}>
    <path d="M14 31a8 8 0 0 1-1-16 10 10 0 0 1 19-2 8 8 0 0 1 4 18z" style={paper} />
    <path d="M24 14l2.500 5.500L32 22l-5.500 2.500L24 30l-2.500-5.500L16 22l5.500-2.500z" style={tint} />
    <circle cx="13" cy="38" r="3" style={paper} />
    <circle cx="7" cy="44" r="2" style={tint} />
  </Svg>
);
export const StudioTeknologi = (p: P) => (
  <Svg {...p}>
    <path d="M6 33l18 9 18-9-18-9z" style={tint} />
    <path d="M6 25l18 9 18-9-18-9z" style={paper} />
    <path d="M6 17l18 9 18-9-18-9z" style={paper} />
  </Svg>
);
export const StudioNgoding = (p: P) => (
  <Svg {...p}>
    <rect x="5" y="8" width="38" height="32" rx="6" style={paper} />
    <path d="M5 14a6 6 0 0 1 6-6h26a6 6 0 0 1 6 6v2H5z" style={tint} />
    <path d="M19 24l-5 4.500 5 4.500M29 24l5 4.500-5 4.500M26 22l-4 13" />
  </Svg>
);
export const StudioBug = (p: P) => (
  <Svg {...p}>
    <path d="M21 11l-3-6M27 11l3-6" />
    <ellipse cx="24" cy="29" rx="10" ry="13" style={tint} />
    <circle cx="24" cy="15" r="6" style={paper} />
    <path d="M24 20v22M14 25H6M14 33H6M34 25h8M34 33h8M16 40l-4 4M32 40l4 4" />
  </Svg>
);
export const StudioAlur = (p: P) => (
  <Svg {...p}>
    <circle cx="9" cy="11" r="5" style={paper} />
    <path d="M14 11h16a7 7 0 0 1 0 14H18a7 7 0 0 0 0 14h12" />
    <circle cx="38" cy="39" r="7" style={tint} />
    <path d="M34.500 39l2.500 2.500 4.500-5" />
  </Svg>
);
export const StudioDeploy = (p: P) => (
  <Svg {...p}>
    <circle cx="21" cy="27" r="16" style={paper} />
    <path d="M5 27h32M21 11c-7 8-7 24 0 32M21 11c7 8 7 24 0 32" />
    <circle cx="37" cy="12" r="8" style={tint} />
    <path d="M37 16V8M33 12l4-4 4 4" />
  </Svg>
);
export const Video = (p: P) => (
  <Svg {...p}>
    <rect x="4" y="8" width="40" height="28" rx="6" style={paper} />
    <path d="M20 16l11 6-11 6z" style={tint} />
    <path d="M14 43h20" />
  </Svg>
);

// One icon per roadmap track. A track picks a preset key, or inline <svg> markup
// (shown through <img>, so scripts in it never run); with neither, a word in
// its slug decides, and anything else gets the route icon.
export const TRACK_PRESETS = {
  frontend: ["Frontend", Frontend],
  git: ["Cabang", Cabang],
  backend: ["Backend", Backend],
  infrastruktur: ["Infrastruktur", Infrastruktur],
  robot: ["Robot", Robot],
  data: ["Data", Data],
  mobile: ["Mobile", Mobile],
  "ui-ux": ["UI dan UX", UiUx],
  cloud: ["Awan", Awan],
  jalur: ["Jalur", Jalur],
  proyek: ["Proyek", Proyek],
  ujian: ["Ujian", Ujian],
  api: ["Api", Api],
  medali: ["Medali", Medali],
  sasaran: ["Sasaran", Sasaran],
  slide: ["Slide", Slide],
  terminal: ["Terminal", Terminal],
  globe: ["Web", Globe],
  kontainer: ["Kontainer", Kontainer],
  roket: ["Roket", Roket],
  grafik: ["Grafik", Grafik],
  buku: ["Buku", Buku],
  kunci: ["Keamanan", Kunci],
  otak: ["AI", Otak],
  lampu: ["Ide", Lampu],
  gir: ["Pengaturan", Gir],
  uji: ["Pengujian", Uji],
  palet: ["Desain", Palet],
  game: ["Game", Game],
} as const;
export type PresetKey = keyof typeof TRACK_PRESETS;
const BY_SLUG: [RegExp, PresetKey][] = [
  [/frontend|web/, "frontend"],
  [/git/, "git"],
  [/backend|api/, "backend"],
  [/infrastruktur|server|jaringan/, "infrastruktur"],
  [/elektronika|iot|robot/, "robot"],
  [/data|basis/, "data"],
  [/mobile/, "mobile"],
  [/ui-ux|desain/, "ui-ux"],
  [/cloud|devops/, "cloud"],
];
export const isSvg = (icon: string | null | undefined): icon is string => !!icon && icon.trimStart().startsWith("<svg");
// <img> only draws a standalone SVG that declares its namespace.
export const svgSrc = (svg: string) =>
  `data:image/svg+xml,${encodeURIComponent(/xmlns=/.test(svg) ? svg : svg.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"'))}`;
export const trackIcon = (slug: string, icon?: string | null) =>
  TRACK_PRESETS[(icon && icon in TRACK_PRESETS ? icon : BY_SLUG.find(([re]) => re.test(slug))?.[1] ?? "jalur") as PresetKey][1];
export function TrackIcon({ slug, icon, className }: { slug: string; icon?: string | null; className?: string }) {
  if (isSvg(icon)) return <img src={svgSrc(icon)} alt="" aria-hidden className={`${className ?? ""} object-contain`} />;
  const Icon = trackIcon(slug, icon); // picked from a fixed module-level list, not created here
  // eslint-disable-next-line react-hooks/static-components
  return <Icon className={className} />;
}
