import type { ReactNode } from "react";

// Generated cover art in the app's ink line (black outline, hard offset
// shadow, matcha fills). One motif per class from its slug, a tone and
// decoration from a hash of the seed, so every class, chapter and roadmap
// gets its own picture with no files to store.
const INK = "#0f100d", W = "#ffffff", M1 = "#e3edc8", M2 = "#d0e4a4", M3 = "#b5d36f", M4 = "#96bb45";
const line = { stroke: INK, strokeWidth: 5, strokeLinecap: "round", strokeLinejoin: "round", fill: "none" } as const;
const TONES = [M1, M2, M3];

// Grouping only: the offset shadow copy made thick strokes pile up into blobs.
const S = ({ children }: { children: ReactNode }) => <g>{children}</g>;
const Dot = ({ x, y, r = 9, f = M3 }: { x: number; y: number; r?: number; f?: string }) => <circle cx={x} cy={y} r={r} {...line} fill={f} />;
const Spark = ({ x, y, s = 1 }: { x: number; y: number; s?: number }) => <path transform={`translate(${x} ${y}) scale(${s})`} d="M0 -14C1 -5 5 -1 14 0C5 1 1 5 0 14C-1 5 -5 1 -14 0C-5 -1 -1 -5 0 -14Z" fill={INK} />;

const MOTIFS: Record<string, () => ReactNode> = {
  git: () => (<><path d="M15 72H85M34 72C44 72 44 34 60 34H85" {...line} /><Dot x={15} y={72} f={W} /><Dot x={34} y={72} /><Dot x={60} y={34} f={W} /><Dot x={85} y={34} /><Dot x={85} y={72} f={W} /></>),
  github: () => (<><path d="M26 34V66M74 66V46Q74 30 58 30H46" {...line} /><path d="M52 20L42 30l10 10" {...line} /><Dot x={26} y={26} /><Dot x={26} y={74} f={W} /><Dot x={74} y={74} /></>),
  jaringan: () => (<><path d="M50 50L18 28M50 50L84 24M50 50L82 74M50 50L22 78M50 50V14" {...line} /><S><Dot x={50} y={50} r={14} /></S>{[[18, 28], [84, 24], [82, 74], [22, 78], [50, 14]].map(([x, y]) => <Dot key={`${x}${y}`} x={x} y={y} r={7} f={W} />)}</>),
  router: () => (<><path d="M30 50L18 18M70 50L82 18" {...line} /><S><rect x="10" y="48" width="80" height="32" rx="10" {...line} fill={W} /></S><Dot x={28} y={64} r={4} /><Dot x={42} y={64} r={4} f={M4} /><Dot x={56} y={64} r={4} /><path d="M70 64H80" {...line} /></>),
  server: () => (<><S><rect x="12" y="14" width="62" height="28" rx="9" {...line} fill={W} /></S><S><rect x="12" y="50" width="62" height="28" rx="9" {...line} fill={M2} /></S><Dot x={26} y={28} r={4} /><Dot x={26} y={64} r={4} f={W} /><path d="M40 28H60M40 64H60" {...line} /><S><path d="M76 44l14 5v13q0 14-14 20-14-6-14-20V49z" {...line} fill={M3} /></S><path d="M70 64l5 5 8-10" {...line} strokeWidth={4} /></>),
  komputer: () => (<><S><rect x="12" y="14" width="76" height="52" rx="9" {...line} fill={W} /></S><rect x="20" y="22" width="60" height="36" rx="4" fill={M2} stroke={INK} strokeWidth={3} /><path d="M50 66V80M32 82H68" {...line} /><rect x="38" y="30" width="24" height="20" rx="4" fill={M3} stroke={INK} strokeWidth={3} /></>),
  ct: () => (<><path d="M50 30V40M50 62V70" {...line} /><S><rect x="30" y="10" width="40" height="20" rx="8" {...line} fill={M3} /></S><S><path d="M50 40L74 51 50 62 26 51Z" {...line} fill={W} /></S><S><rect x="30" y="72" width="40" height="18" rx="8" {...line} fill={W} /></S><path d="M74 51H88V81H72" {...line} /></>),
  elektronika: () => (<><path d="M16 26H34M66 26H84V74H50M34 74H16V26" {...line} /><S><path d="M34 26l4-10 6 20 6-20 6 20 6-20 4 10" {...line} /></S><S><path d="M34 74V60L50 67 34 74M50 60V74" {...line} fill={M3} strokeWidth={4} /></S><path d="M60 52l8-8M68 58l8-8" {...line} strokeWidth={4} /></>),
  mikrokontroler: () => (<>{[34, 46, 58, 70].map((p) => <path key={p} d={`M${p} 28V16M${p} 72V84M28 ${p}H16M72 ${p}H84`} {...line} />)}<S><rect x="26" y="26" width="48" height="48" rx="8" {...line} fill={M3} /></S><circle cx="38" cy="38" r="4" fill={INK} /><rect x="44" y="44" width="20" height="20" rx="4" fill={W} stroke={INK} strokeWidth={4} /></>),
  iot: () => (<><S><path d="M28 56a14 14 0 0 1 2-28 20 20 0 0 1 38 4 12 12 0 0 1 2 24Z" {...line} fill={W} /></S><path d="M36 70Q50 60 64 70M28 80Q50 62 72 80" {...line} /><Dot x={50} y={80} r={5} f={M4} /></>),
  robot: () => (<><path d="M50 28V14" {...line} /><Dot x={50} y={12} r={6} /><path d="M18 50H12M82 50H88" {...line} /><S><rect x="20" y="28" width="60" height="50" rx="16" {...line} fill={W} /></S><Dot x={38} y={50} r={7} /><Dot x={62} y={50} r={7} /><path d="M40 66H60" {...line} /></>),
  web: () => (<><S><rect x="10" y="16" width="80" height="66" rx="10" {...line} fill={W} /></S><path d="M10 34H90" {...line} /><Dot x={22} y={25} r={3} f={M3} /><Dot x={32} y={25} r={3} f={M4} /><path d="M40 50L30 58L40 66M60 50L70 58L60 66M54 48L46 68" {...line} strokeWidth={4} /></>),
  layout: () => (<><S><rect x="10" y="16" width="80" height="66" rx="10" {...line} fill={W} /></S><rect x="18" y="24" width="64" height="12" rx="4" fill={M3} stroke={INK} strokeWidth={3} /><rect x="18" y="44" width="22" height="30" rx="4" fill={M2} stroke={INK} strokeWidth={3} /><rect x="46" y="44" width="36" height="12" rx="4" fill={M1} stroke={INK} strokeWidth={3} /><rect x="46" y="62" width="36" height="12" rx="4" fill={M2} stroke={INK} strokeWidth={3} /></>),
  js: () => (<><S><path d="M36 18Q24 18 24 32V42Q24 50 14 50Q24 50 24 58V68Q24 82 36 82M64 18Q76 18 76 32V42Q76 50 86 50Q76 50 76 58V68Q76 82 64 82" {...line} strokeWidth={7} /></S><Dot x={50} y={50} r={8} /></>),
  python: () => (<><S><rect x="10" y="18" width="80" height="60" rx="12" fill={INK} stroke={INK} strokeWidth={5} /></S><path d="M26 38L40 48 26 58" stroke={M3} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" fill="none" /><path d="M50 62H72" stroke={M3} strokeWidth={6} strokeLinecap="round" /></>),
  react: () => (<><g {...line}><ellipse cx="50" cy="50" rx="40" ry="15" /><ellipse cx="50" cy="50" rx="40" ry="15" transform="rotate(60 50 50)" /><ellipse cx="50" cy="50" rx="40" ry="15" transform="rotate(120 50 50)" /></g><S><Dot x={50} y={50} r={9} /></S></>),
  figma: () => (<><S><rect x="10" y="12" width="38" height="38" rx="10" {...line} fill={M3} /></S><S><circle cx="72" cy="31" r="19" {...line} fill={W} /></S><S><rect x="10" y="58" width="42" height="26" rx="13" {...line} fill={M2} /></S><S><path d="M58 52l28 12-12 4-4 12z" fill={INK} stroke={INK} strokeWidth={3} strokeLinejoin="round" /></S></>),
  sdlc: () => (<><path d="M20 50A30 30 0 0 1 72 28M80 50A30 30 0 0 1 28 72" {...line} /><path d="M74 14V30H58M26 86V70H42" {...line} /><S><Dot x={50} y={50} r={13} /></S><path d="M44 50l4 4 8-8" {...line} strokeWidth={4} /></>),
  vibe: () => (<><S><path d="M12 24Q12 14 22 14H66Q76 14 76 24V50Q76 60 66 60H40L24 76V60H22Q12 60 12 50Z" {...line} fill={W} /></S><path d="M32 30L24 37 32 44M54 30L62 37 54 44" {...line} strokeWidth={4} /><S><path d="M80 52C81 64 86 69 98 70C86 71 81 76 80 88C79 76 74 71 62 70C74 69 79 64 80 52Z" fill={M3} stroke={INK} strokeWidth={4} strokeLinejoin="round" /></S></>),
  db: () => (<><S><path d="M20 24v52c0 8 13 14 30 14s30-6 30-14V24z" {...line} fill={W} /></S><S><ellipse cx="50" cy="24" rx="30" ry="12" {...line} fill={M3} /></S><path d="M20 44c0 8 13 14 30 14s30-6 30-14M20 62c0 8 13 14 30 14s30-6 30-14" {...line} /></>),
  vue: () => (<><S><path d="M10 16h22l18 32 18-32h22L50 84z" {...line} fill={W} /></S><S><path d="M32 16l18 32 18-32h-14L50 34 46 16z" {...line} fill={M3} /></S></>),
  node: () => (<><path d="M50 10L86 30V70L50 90 14 70V30Z" {...line} fill={M3} /><path d="M50 10V90M14 30L86 70" {...line} strokeWidth={3} opacity={0.35} /><circle cx="50" cy="50" r="15" {...line} fill={W} /><path d="M44 50l4 4 8-8" {...line} strokeWidth={4} /></>),
  api: () => (<><rect x="8" y="34" width="26" height="32" rx="8" {...line} fill={W} /><rect x="66" y="12" width="26" height="24" rx="8" {...line} fill={M3} /><rect x="66" y="64" width="26" height="24" rx="8" {...line} fill={M2} /><path d="M34 46H50Q56 46 56 36V30Q56 24 62 24M34 54H50Q56 54 56 64V70Q56 76 62 76" {...line} /><path d="M58 20l6 4-6 4M58 72l6 4-6 4" {...line} strokeWidth={4} /></>),
  phone: () => (<><rect x="26" y="8" width="48" height="84" rx="12" {...line} fill={W} /><path d="M42 16h16" {...line} strokeWidth={4} /><g {...line} strokeWidth={3.5} transform="translate(0 4) scale(0.8) translate(12.5 12.5)"><ellipse cx="50" cy="50" rx="32" ry="12" /><ellipse cx="50" cy="50" rx="32" ry="12" transform="rotate(60 50 50)" /><ellipse cx="50" cy="50" rx="32" ry="12" transform="rotate(120 50 50)" /></g><circle cx="50" cy="54" r="6" {...line} fill={M3} /></>),
  gitlab: () => (<><path d="M50 88L10 52 20 14 34 38H66L80 14 90 52Z" {...line} fill={M3} /><path d="M34 38L50 88 66 38" {...line} fill={W} /><circle cx="44" cy="56" r="3" fill={INK} /><circle cx="56" cy="56" r="3" fill={INK} /></>),
  book: () => (<><S><path d="M50 26Q32 16 12 22V76Q32 70 50 80Z" {...line} fill={M3} /></S><S><path d="M50 26Q68 16 88 22V76Q68 70 50 80Z" {...line} fill={W} /></S><path d="M24 36Q36 34 42 40M24 50Q36 48 42 54M58 40Q64 34 76 36M58 54Q64 48 76 50" {...line} strokeWidth={3} /></>),
};

// First keyword found in the slug picks the motif ("github" before "git").
const KEYS: [string, string][] = [["mikrotik", "router"], ["github", "github"], ["gitlab", "gitlab"], ["git", "git"], ["jaringan", "jaringan"], ["administrasi", "server"], ["server", "server"], ["komputer", "komputer"], ["computational", "ct"], ["elektronika", "elektronika"], ["mikrokontroler", "mikrokontroler"], ["iot", "iot"], ["robot", "robot"], ["html-css", "web"], ["html5", "layout"], ["javascript", "js"], ["python", "python"], ["react-native", "phone"], ["react", "react"], ["figma", "figma"], ["sdlc", "sdlc"], ["vibe", "vibe"], ["sql", "db"], ["vue", "vue"], ["express", "api"], ["node", "node"], ["dasar-pemrograman", "js"], ["frontend", "web"], ["backend", "server"], ["api", "server"], ["infrastruktur", "jaringan"], ["data", "python"], ["desain", "figma"]];
export const motifOf = (slug: string) => KEYS.find(([k]) => slug.includes(k))?.[1] ?? "book";

const hash = (s: string) => [...s].reduce((h, c) => (Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0), 2166136261);

type Props = { slug: string; seed?: string; className?: string; bare?: boolean } & (
  | { kind: "topic" | "track" }
  | { kind: "chapter"; number: number; total?: number }
);

// kind topic/track: 16:9 card cover (bare: no background, a loose illustration). chapter: wide banner with the number.
export default function Art(props: Props) {
  const { slug, kind, className } = props;
  const h = hash(props.seed ?? slug);
  const tone = TONES[h % 3];
  const wide = kind === "chapter";
  const id = `a${h.toString(36)}${kind[0]}`;
  const flip = wide ? 0 : (h >> 3) & 1;
  const Motif = MOTIFS[motifOf(slug)];
  if (wide && "number" in props) {
    const id2 = `${id}s`;
    return (
      <svg viewBox="0 0 640 110" role="img" aria-label={`Ilustrasi bab ${props.number}`} className={`block w-full ${className ?? "h-auto"}`} preserveAspectRatio="xMidYMid slice">
        <defs><pattern id={id2} width="16" height="16" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.3" fill={INK} opacity="0.18" /></pattern></defs>
        <rect width="640" height="110" fill={tone} />
        <rect width="640" height="110" fill={`url(#${id2})`} />
        <rect x="18" y="14" width="150" height="82" rx="22" fill={W} stroke={INK} strokeWidth="4" />
        <text x="93" y="82" textAnchor="middle" fontSize="68" fontWeight="800" fill={INK} style={{ fontFamily: "inherit" }}>{String(props.number).padStart(2, "0")}</text>
        {props.total ? <text x="190" y="62" fontSize="17" fontWeight="800" fill={INK} style={{ fontFamily: "inherit" }}>bab {props.number} dari {props.total}</text> : null}
        <path d="M190 78H330" stroke={INK} strokeWidth="4" strokeLinecap="round" strokeDasharray="1 11" />
        <Spark x={400} y={34} s={0.8} /><Spark x={340} y={90} s={0.5} />
        <g transform={`translate(${640 - 100} 12) scale(0.86)`}>{Motif()}</g>
      </svg>
    );
  }
  const W_ = 320, H_ = 180;
  const mx = 160, size = 1.45;
  const blobR = 100;
  return (
    <svg viewBox={`0 0 ${W_} ${H_}`} role="img" aria-label={`Ilustrasi ${slug.replaceAll("-", " ")}`} className={`block w-full ${className ?? "h-auto"}`} preserveAspectRatio="xMidYMid slice">
      <defs>
        <pattern id={id} width="16" height="16" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.3" fill={INK} opacity="0.18" /></pattern>
      </defs>
      {!props.bare && <><rect width={W_} height={H_} fill={tone} /><rect width={W_} height={H_} fill={`url(#${id})`} /></>}
      <g transform={flip ? `translate(${W_} 0) scale(-1 1)` : undefined}>
        <circle cx={mx + 30} cy={H_ / 2 + 10} r={blobR} fill={W} opacity="0.55" />
        <path d={`M${W_ - 20} ${H_ - 10}q-50-70 -${wide ? 160 : 90} -${wide ? 40 : 30}`} fill="none" stroke={INK} strokeWidth="4" strokeLinecap="round" strokeDasharray="2 12" opacity="0.5" />
        <Spark x={wide ? 250 : 40} y={36} s={1.1} />
        <Spark x={W_ - 40} y={H_ - 40} s={0.8} />
        <Spark x={wide ? 40 : W_ - 50} y={H_ - 30} s={0.6} />
        {/* small floating bits, placed from the hash so each class differs */}
        <circle cx={wide ? 300 : 40 + (h % 30)} cy={wide ? 150 : 140 - (h % 20)} r="7" fill={M3} stroke={INK} strokeWidth="3" />
        <path d={`M${W_ - 70 - (h % 25)} ${28 + (h % 14)}h14M${W_ - 63 - (h % 25)} ${21 + (h % 14)}v14`} stroke={INK} strokeWidth="4" strokeLinecap="round" />
        <rect x={wide ? 330 : 72 + (h % 20)} y={wide ? 40 : 22 + (h % 12)} width="14" height="14" rx="4" fill={W} stroke={INK} strokeWidth="3" transform={`rotate(${15 + (h % 30)} ${wide ? 337 : 79 + (h % 20)} ${wide ? 47 : 29 + (h % 12)})`} />
        <g transform={`translate(${mx - 50 * size} ${H_ / 2 - 50 * size}) scale(${size})`}>{Motif()}</g>
      </g>
      {kind === "track" && (
        <g>
          <path d={`M30 ${H_ - 30}Q90 ${H_ - 90} 150 ${H_ - 50}T290 40`} {...line} strokeDasharray="1 12" strokeWidth="6" />
          <Dot x={30} y={H_ - 30} r={8} f={W} /><Dot x={290} y={40} r={9} />
        </g>
      )}
    </svg>
  );
}
