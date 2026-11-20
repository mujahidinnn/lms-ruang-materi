// Analogi rumah untuk HTML, CSS, dan JavaScript. Murni, tanpa DOM.
export type Layers = { html: boolean; css: boolean; js: boolean };

// CSS dan JavaScript hanya punya efek bila ada elemen HTML tempat mereka menempel.
export const keadaan = (l: Layers) => ({ elemen: l.html, berwarna: l.html && l.css, hidup: l.html && l.js });

export function catatan(l: Layers): string {
  if (!l.html) return l.css || l.js ? "CSS dan JavaScript menyala, tapi tidak ada elemen HTML untuk dicat atau dinyalakan. Tanpa kerangka, keduanya tidak punya tempat menempel." : "Tanah kosong. Semua dimulai dari HTML.";
  if (l.css && l.js) return "Lengkap: kerangka berdiri, tampilannya rapi, dan saklar serta pintu bisa dipakai.";
  if (l.css) return "Rumah sudah berwarna dan berperabot, tapi saklar dan pintu tidak bereaksi karena belum ada JavaScript.";
  if (l.js) return "Saklar dan pintu berfungsi, tapi tampilannya polos karena belum ada CSS.";
  return "Hanya kerangka: semua elemen ada dan letaknya benar, tapi polos dan belum bisa diapa-apakan.";
}

export const KODE = {
  html: '<button id="saklar">Lampu</button>',
  css: "#saklar { background: #12140d; border-radius: 4px; }",
  js: 'saklar.addEventListener("click", () => lampu.classList.toggle("nyala"));',
} as const;
