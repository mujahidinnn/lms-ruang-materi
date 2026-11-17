import { existsSync, readdirSync, readFileSync } from "node:fs";
import { expect, test } from "vitest";
import { T568A, T568B, WIRE_HEX } from "./utp";

const DIR = "public/praktik";

// The ten diagrams of docs/superpowers/plans/2026-11-16-praktik-gambar.md.
const EXPECTED = [
  "utp-t568a-t568b", "kabel-straight-crossover", "rj45-konektor",
  "topologi-dasar", "osi-tcpip", "dhcp-dora", "nat-masquerade",
  "rak-jaringan", "router-5-port", "kantor-kecil-mikrotik",
  "firewall-chain-flow", "bridge-vs-router", "queue-simple-limit", "ppp-tunnel",
];
const READY = EXPECTED;

test("T568B order is orange-white, orange, green-white, blue, blue-white, green, brown-white, brown", () => {
  expect([...T568B]).toEqual(["putih-oranye", "oranye", "putih-hijau", "biru", "putih-biru", "hijau", "putih-cokelat", "cokelat"]);
});

test("T568A swaps the orange and green pairs of T568B and keeps pins 4, 5, 7, 8", () => {
  expect([...T568A]).toEqual(["putih-hijau", "hijau", "putih-oranye", "biru", "putih-biru", "oranye", "putih-cokelat", "cokelat"]);
  for (const pin of [3, 4, 6, 7]) expect(T568A[pin]).toBe(T568B[pin]);
});

test("every wire name has a base color with a hex value", () => {
  for (const name of new Set([...T568A, ...T568B])) {
    const base = name.replace(/^putih-/, "");
    expect(WIRE_HEX[base], name).toMatch(/^#[0-9a-f]{6}$/);
  }
});

test("the diagrams that are built exist", () => {
  for (const n of READY) expect(existsSync(`${DIR}/${n}.svg`), n).toBe(true);
});

test("every diagram is a titled, self-contained svg", () => {
  const files = readdirSync(DIR).filter((f) => f.endsWith(".svg"));
  expect(files.length).toBeGreaterThan(0);
  for (const f of files) {
    expect(f.replace(/\.svg$/, ""), f).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    const svg = readFileSync(`${DIR}/${f}`, "utf8");
    expect(svg, f).toMatch(/viewBox="0 0 1200 \d+"/);
    expect(svg, f).toContain("<title");
    expect(svg, f).toContain('role="img"');
    expect(svg, f).not.toMatch(/<script|foreignObject|\son\w+=/i);
    expect(svg.replace('xmlns="http://www.w3.org/2000/svg"', ""), f).not.toMatch(/https?:\/\//);
  }
});

test("the MikroTik NAT command on nat-masquerade continues its first line with a backslash", () => {
  const svg = readFileSync(`${DIR}/nat-masquerade.svg`, "utf8");
  expect(svg).toContain("chain=srcnat \\");
});
