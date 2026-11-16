// JavaScript that runs a learner's RouterOS script through the shim. The
// script is only ever a JSON string literal, never code. `setup` may define
// `awal` (the initial router state); tests read `router` and `keluaran`.
export function mikrotikCode(script: string): string {
  return `var __hasil = jalankanRouterOS(${JSON.stringify(script)}, typeof awal === "undefined" ? undefined : awal);
var router = __hasil.router;
var keluaran = __hasil.keluaran;
keluaran.forEach(function (l) { console.log(l); });`;
}
