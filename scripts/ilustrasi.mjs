// Draws the step illustrations in public/ilustrasi/: an Open Peeps figure
// (CC0, via react-peeps) holding a prop drawn here in the same ink line.
//
//   node scripts/ilustrasi.mjs
import { writeFileSync } from "node:fs";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import pkg from "react-peeps";

const Peep = pkg.default ?? pkg;
const INK = "#0f100d", W = 'fill="#ffffff"', M1 = "#e3edc8", M3 = "#b5d36f";
const sw = (w = 9) => `stroke="${INK}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"`;
const st = sw();
const spark = (x, y, r = 1) => `<g ${st} fill="none" transform="translate(${x} ${y}) scale(${r})"><path d="M0 -40v-30M28 -28l20 -20M-28 -28l-20 -20"/></g>`;
const ask = (x, y, w) => `<path d="M${x} ${y}q0-35 32-35t32 30q0 22-24 32-10 5-10 25" fill="none" ${sw(w)}/><circle cx="${x + 30}" cy="${y + 90}" r="${w - 2}" fill="${INK}"/>`;

const PROPS = {
  baca: `<path d="M425 870 Q300 800 150 840 L150 1150 Q300 1110 425 1175 Z" fill="${M3}" ${st}/>
    <path d="M425 870 Q550 800 700 840 L700 1150 Q550 1110 425 1175 Z" fill="${M3}" ${st}/>
    <path d="M425 855 Q305 790 175 822 L175 1125 Q305 1092 425 1150 Z" ${W} ${st}/>
    <path d="M425 855 Q545 790 675 822 L675 1125 Q545 1092 425 1150 Z" ${W} ${st}/>
    <g ${sw(7)} fill="none"><path d="M220 880q80-20 160 10M220 940q80-20 160 10M220 1000q60-14 120 6M470 890q80-30 160-10M470 950q80-30 160-10M470 1010q60-22 120-8"/></g>
    ${spark(560, 800, 0.9)}`,
  kode: `<rect x="160" y="770" width="530" height="350" rx="28" ${W} ${st}/>
    <circle cx="425" cy="945" r="70" fill="${M3}" ${st}/>
    <path d="M395 915l-30 30 30 30M455 915l30 30-30 30M435 905l-20 80" fill="none" ${sw(8)}/>
    <rect x="100" y="1120" width="650" height="44" rx="22" fill="${INK}" ${st}/>
    ${spark(700, 760, 0.9)}`,
  ujian: `<rect x="215" y="760" width="420" height="420" rx="30" fill="${M3}" ${st}/>
    <rect x="245" y="790" width="360" height="370" rx="18" ${W} ${st}/>
    <rect x="345" y="735" width="160" height="70" rx="20" fill="${INK}" ${st}/>
    <g ${st} fill="none">
      <rect x="285" y="845" width="56" height="56" rx="12" fill="${M1}"/><path d="M298 873l14 14 26-30"/><path d="M370 873h190"/>
      <rect x="285" y="935" width="56" height="56" rx="12" fill="${M1}"/><path d="M298 963l14 14 26-30"/><path d="M370 963h160"/>
      <rect x="285" y="1025" width="56" height="56" rx="12" fill="${M1}"/><path d="M370 1053h180"/>
    </g>`,
  hilang: `<g ${st}><circle cx="560" cy="930" r="150" fill="${M1}"/><circle cx="560" cy="930" r="115" fill="#ffffff"/><path d="M455 1040l-150 150" stroke-width="40"/></g>
    <path d="M520 890q0-45 42-45t42 40q0 28-30 40-12 6-12 30" fill="none" ${sw(14)}/><circle cx="562" cy="1010" r="10" fill="${INK}"/>
    ${ask(60, 330, 10)}${ask(740, 250, 8)}`,
  sertifikat: `<rect x="130" y="800" width="590" height="370" rx="20" fill="${M1}" ${st}/>
    <rect x="165" y="835" width="520" height="300" rx="12" fill="none" ${sw(5)} stroke-dasharray="14 12"/>
    <g ${st} fill="none"><path d="M230 900h300M230 960h240M230 1020h280"/></g>
    <path d="M585 1060l-30 110 40-25 30 40 20-115zM655 1060l30 110-40-25-30 40-20-115z" fill="${INK}" ${sw(6)}/>
    <circle cx="620" cy="1040" r="62" fill="${M3}" ${st}/><path d="M620 1005l10 22 24 3-18 16 5 24-21-12-21 12 5-24-18-16 24-3z" fill="${INK}" stroke="none"/>
    ${spark(140, 790, 1)}${spark(740, 790, 1)}`,
};
// Long sleeves for the figure in a hijab.
const PEOPLE = {
  baca: { body: "Turtleneck", face: "Calm", hair: "MediumBangs", accessory: "GlassRound" },
  kode: { body: "Hoodie", face: "Driven", hair: "ShortVolumed" },
  ujian: { body: "SweaterDots", face: "Concerned", hair: "Hijab", accessory: "GlassRoundThick" },
  hilang: { body: "Sweater", face: "Suspicious", hair: "ShortMessy", accessory: "GlassRoundThick" },
  sertifikat: { body: "ButtonShirt", face: "SmileBig", hair: "Afro" },
};

// Standing figure for /mulai: no prop, long sleeves (blazer) with the hijab.
{
  const peep = renderToStaticMarkup(h(Peep, { body: "BlazerPantsWB", face: "Cute", hair: "Hijab", strokeColor: INK, backgroundColor: "#ffffff" }))
    .replace(/<svg[^>]*>/, "")
    .replace(/<\/svg>$/, "");
  writeFileSync("public/ilustrasi/mulai.svg", `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-95 17 1086 2892">${peep}</svg>`);
  console.log("mulai");
}

for (const n of Object.keys(PROPS)) {
  const peep = renderToStaticMarkup(h(Peep, { ...PEOPLE[n], strokeColor: INK, backgroundColor: "#ffffff" }))
    .replace(/<svg[^>]*>/, "")
    .replace(/<\/svg>$/, "");
  writeFileSync(`public/ilustrasi/${n}.svg`, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-20 -10 890 1220">${peep}${PROPS[n]}</svg>`);
  console.log(n);
}
