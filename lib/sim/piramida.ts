export type Counts = { unit: number; integrasi: number; e2e: number };

// Model sederhana (angka perkiraan, bukan ukuran nyata).
export const DETIK: Counts = { unit: 0.01, integrasi: 0.5, e2e: 15 }; // waktu jalan per tes
export const BIAYA: Counts = { unit: 1, integrasi: 5, e2e: 25 }; // biaya tulis+rawat relatif
export const FLAKY: Counts = { unit: 0.0005, integrasi: 0.005, e2e: 0.03 }; // peluang gagal acak per tes
export const BATAS_E2E = 0.2;

export const PRESET: Record<string, Counts> = {
  piramida: { unit: 200, integrasi: 40, e2e: 10 },
  "cone es krim": { unit: 20, integrasi: 40, e2e: 120 },
};

export type Hasil = { total: number; detik: number; biaya: number; flaky: number; shareE2e: number; terlaluE2e: boolean };

export function hitung(c: Counts): Hasil {
  const total = c.unit + c.integrasi + c.e2e;
  const sum = (m: Counts) => c.unit * m.unit + c.integrasi * m.integrasi + c.e2e * m.e2e;
  // Peluang minimal satu tes gagal acak pada satu kali jalan.
  const tenang = (1 - FLAKY.unit) ** c.unit * (1 - FLAKY.integrasi) ** c.integrasi * (1 - FLAKY.e2e) ** c.e2e;
  const shareE2e = total ? c.e2e / total : 0;
  return { total, detik: sum(DETIK), biaya: sum(BIAYA), flaky: 1 - tenang, shareE2e, terlaluE2e: shareE2e > BATAS_E2E };
}
