export const ZONES = ["A", "B", "C"];
export const ZONE_AV = 0.999; // 99,9% per zona, sama seperti contoh di bab
export const MIN_PER_YEAR = 525600;

// Round robin hanya ke server yang hidup (health check dianggap instan). -1 = tidak ada.
export function pick(deployed: number, up: boolean[], turn: number): number {
  for (let k = 0; k < deployed; k++) {
    const z = (turn + k) % deployed;
    if (up[z]) return z;
  }
  return -1;
}

export const healthy = (deployed: number, up: boolean[]) => up.slice(0, deployed).filter(Boolean).length;

export function verdict(deployed: number, up: boolean[]): "aman" | "spof" | "mati" {
  const h = healthy(deployed, up);
  return h === 0 ? "mati" : h === 1 ? "spof" : "aman";
}

export const availability = (deployed: number, a = ZONE_AV) => 1 - (1 - a) ** deployed;

export function percent(deployed: number): string {
  return (availability(deployed) * 100).toFixed(1 + 3 * (deployed - 1)).replace(".", ",") + "%";
}

export function downtime(deployed: number): string {
  const min = (1 - availability(deployed)) * MIN_PER_YEAR;
  if (min * 60 < 1) return "kurang dari 1 detik";
  if (min < 1) return `sekitar ${Math.round(min * 60)} detik`;
  if (min < 120) return `sekitar ${Math.round(min)} menit`;
  return `sekitar ${(min / 60).toFixed(1).replace(".", ",")} jam`;
}

export const rate = (ok: number, total: number) => (total ? `${Math.round((ok / total) * 100)}%` : "-");
