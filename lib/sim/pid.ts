export type Pid = { kp: number; ki: number; kd: number; setpoint: number };

export const DT = 0.01;
export const STEPS = 800; // 8 detik
const UMAX = 50;
const DAMP = 2; // gesekan: percepatan = u - DAMP * kecepatan

// Simulasi tetap (Euler, langkah tetap): deterministik, tanpa acak.
export function simulate({ kp, ki, kd, setpoint }: Pid, steps = STEPS) {
  const pos: number[] = [0];
  let x = 0, v = 0, integ = 0, prevErr = setpoint;
  for (let n = 1; n <= steps; n++) {
    const err = setpoint - x;
    const raw = kp * err + ki * integ + kd * ((err - prevErr) / DT);
    const u = Math.max(-UMAX, Math.min(UMAX, raw));
    if (u === raw) integ += err * DT; // anti-windup: berhenti mengakumulasi saat jenuh
    prevErr = err;
    v += (u - DAMP * v) * DT;
    x += v * DT;
    pos.push(x);
  }
  return pos;
}

export function metrics(pos: number[], setpoint: number) {
  const peak = Math.max(...pos);
  const overshoot = Math.max(0, ((peak - setpoint) / setpoint) * 100);
  let last = -1; // indeks terakhir di luar pita 2%
  pos.forEach((p, i) => { if (Math.abs(p - setpoint) > setpoint * 0.02) last = i; });
  const settle = last === pos.length - 1 ? null : (last + 1) * DT;
  return { overshoot, settle, finalErr: setpoint - pos[pos.length - 1] };
}

export const PRESETS: { name: string; kp: number; ki: number; kd: number }[] = [
  { name: "Terlalu kecil", kp: 0.6, ki: 0, kd: 0 },
  { name: "Berosilasi", kp: 30, ki: 0, kd: 0 },
  { name: "Baik", kp: 12, ki: 2, kd: 3 },
];
