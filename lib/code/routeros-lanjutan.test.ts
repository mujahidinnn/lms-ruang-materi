import { describe, expect, it } from "vitest";
import { routerOSShim } from "./routeros";

const run = (s: string, awal?: unknown) => routerOSShim().jalankanRouterOS(s, awal as never);
const has = (k: string[], sub: string) => k.some((l) => l.includes(sub));
const withBridge = { bridges: [{ name: "bridge1" }] };

describe("state dasar baru", () => {
  it("nilai bawaan", () => {
    const { router } = run("");
    expect(router.interfaces[0].arp).toBe("enabled");
    expect(router.services).toHaveLength(8);
    const dis = router.services.filter((s) => s.disabled).map((s) => s.name);
    expect(dis).toEqual(["www-ssl", "api-ssl"]);
    expect(router.services.find((s) => s.name === "winbox")).toEqual({ name: "winbox", port: 8291, disabled: false });
    expect(router.users).toEqual([{ name: "admin", group: "full" }]);
    for (const k of ["bridges", "bridgePorts", "dhcpLeases", "arp", "filter", "addressLists", "queues"] as const) expect(router[k]).toEqual([]);
  });

  it("awal mengisi bawaan dan membuang tipe salah", () => {
    expect(run("", { interfaces: [{ name: "ether1", running: true }] }).router.interfaces).toEqual([{ name: "ether1", running: true, arp: "enabled" }]);
    expect(run("", { routes: [{ dstAddress: "0.0.0.0/0", gateway: "10.0.0.1" }] }).router.routes).toEqual([{ dstAddress: "0.0.0.0/0", gateway: "10.0.0.1", distance: 1 }]);
    expect(run("", { interfaces: [{ name: "e", running: true, arp: 5 }] }).router.interfaces).toEqual([]);
    expect(run("", { routes: [{ dstAddress: "a", gateway: "b", distance: "2" }] }).router.routes).toEqual([]);
    expect(run("", { services: [{ name: "ssh", port: 22, disabled: false }, { name: "x", port: "1", disabled: false }] }).router.services).toEqual([{ name: "ssh", port: 22, disabled: false }]);
  });

  it("bridge sah sebagai interface", () => {
    const cmd = "/ip address add address=10.0.0.1/24 interface=bridge1";
    expect(has(run(cmd).keluaran, "input does not match any value of interface")).toBe(true);
    const r = run(cmd, withBridge);
    expect(r.router.addresses).toHaveLength(1);
  });

  it("comment diabaikan", () => {
    const r = run('/ip address add address=10.0.0.1/24 interface=ether1 comment="x y"');
    expect(r.keluaran).toHaveLength(1);
    expect(r.router.addresses).toHaveLength(1);
  });

  it("baris kosong akhir tidak dihitung", () => {
    const l = "/system identity print";
    expect(run(Array(200).fill(l).join("\n") + "\n").keluaran).toHaveLength(400);
    expect(run(Array(201).fill(l).join("\n")).keluaran).toEqual(["script too long"]);
    expect(run(Array(201).fill(l).join("\n") + "\n").keluaran).toEqual(["script too long"]);
  });
});

describe("interface ethernet set", () => {
  it("mengubah arp", () => {
    const r = run("/interface ethernet set ether2 arp=reply-only\n/interface ethernet print");
    expect(r.router.interfaces[1].arp).toBe("reply-only");
    expect(has(r.keluaran, "ARP")).toBe(true);
    expect(has(r.keluaran, "reply-only")).toBe(true);
  });
  it("galat", () => {
    expect(run("/interface ethernet set ether2 arp=foo").keluaran).toContain("input does not match any value of arp");
    expect(run("/interface ethernet set ether9 arp=disabled").keluaran).toContain("no such item");
    expect(run("/interface ethernet set bridge1 arp=disabled", withBridge).keluaran).toContain("no such item");
    expect(run("/interface ethernet set arp=disabled").keluaran).toContain("failure: missing required argument name");
    expect(run("/interface ethernet set ether2").keluaran).toContain("failure: missing required argument arp");
    expect(has(run("/interface ethernet set ether1 ether2 arp=disabled").keluaran, "expected end of command")).toBe(true);
  });
});

describe("ip arp", () => {
  const ok = "/ip arp add address=192.168.88.5 mac-address=AA:BB:CC:00:11:22 interface=ether2";
  it("add valid dan print", () => {
    const r = run(ok + "\n/ip arp print");
    expect(r.router.arp).toEqual([{ address: "192.168.88.5", macAddress: "AA:BB:CC:00:11:22", interface: "ether2" }]);
    expect(has(r.keluaran, "MAC-ADDRESS")).toBe(true);
  });
  it("galat", () => {
    expect(run("/ip arp add address=1.1.1 mac-address=AA:BB:CC:00:11:22 interface=ether2").keluaran).toContain("invalid value for argument address");
    for (const m of ["AA:BB:CC:00:11", "AA-BB-CC-00-11-22", "GG:BB:CC:00:11:22"]) {
      expect(run(`/ip arp add address=1.1.1.1 mac-address=${m} interface=ether2`).keluaran).toContain("invalid value for argument mac-address");
    }
    expect(run("/ip arp add address=1.1.1.1 mac-address=AA:BB:CC:00:11:22 interface=ether9").keluaran).toContain("input does not match any value of interface");
    const d = run(ok + "\n" + ok);
    expect(d.keluaran).toContain("failure: already have such entry");
    expect(d.router.arp).toHaveLength(1);
  });
});

describe("ip route", () => {
  it("add dengan distance, bawaan, gateway interface", () => {
    expect(run("/ip route add dst-address=0.0.0.0/0 gateway=10.0.0.1 distance=5").router.routes[0].distance).toBe(5);
    expect(run("/ip route add dst-address=0.0.0.0/0 gateway=10.0.0.1").router.routes[0].distance).toBe(1);
    expect(run("/ip route add dst-address=0.0.0.0/0 gateway=ether1").router.routes).toHaveLength(1);
    expect(run("/ip route add dst-address=0.0.0.0/0 gateway=bridge1", withBridge).router.routes).toHaveLength(1);
  });
  it("galat", () => {
    expect(run("/ip route add dst-address=0.0.0.0 gateway=10.0.0.1").keluaran).toContain("invalid value for argument dst-address");
    expect(run("/ip route add dst-address=0.0.0.0/0 gateway=zzz").keluaran).toContain("invalid value for argument gateway");
    for (const d of ["0", "256", "x", "1.5"]) {
      const r = run(`/ip route add dst-address=0.0.0.0/0 gateway=10.0.0.1 distance=${d}`);
      expect(r.keluaran).toContain("invalid value for argument distance");
      expect(r.router.routes).toHaveLength(0);
    }
  });
  it("print: statik AS lalu turunan DAc", () => {
    const r = run("/ip address add address=192.168.88.1/24 interface=ether2\n/ip route add dst-address=0.0.0.0/0 gateway=192.168.88.254\n/ip route print");
    const out = r.keluaran.slice(3);
    expect(out[0]).toMatch(/FLAGS\s+DST-ADDRESS\s+GATEWAY\s+DISTANCE/);
    expect(out[1]).toMatch(/^0\s+AS\s+0\.0\.0\.0\/0\s+192\.168\.88\.254\s+1$/);
    expect(out[2]).toMatch(/^1\s+DAc\s+192\.168\.88\.0\/24\s+ether2\s+0$/);
    expect(r.router.routes).toHaveLength(1);
  });
});

describe("drift kunci array state", () => {
  const sample: Record<string, unknown> = {
    interfaces: { name: "e9", running: false, arp: "proxy-arp" },
    addresses: { address: "10.0.0.1/24", network: "10.0.0.0", interface: "e9" },
    pools: { name: "p", ranges: "1.1.1.1-1.1.1.2" },
    dhcpServers: { name: "d", interface: "e9", addressPool: "p", disabled: false },
    dhcpNetworks: { address: "10.0.0.0/24", gateway: "10.0.0.1", dnsServer: "8.8.8.8" },
    nat: { chain: "srcnat", action: "masquerade", outInterface: "e9", srcAddress: "" },
    routes: { dstAddress: "0.0.0.0/0", gateway: "10.0.0.1", distance: 3 },
    bridges: { name: "b" },
    bridgePorts: { bridge: "b", interface: "e9" },
    dhcpLeases: { address: "10.0.0.5", macAddress: "AA:BB:CC:00:11:22", server: "d" },
    arp: { address: "10.0.0.5", macAddress: "AA:BB:CC:00:11:22", interface: "e9" },
    filter: { chain: "input", action: "drop", protocol: "tcp", dstPort: "23", srcAddress: "", inInterface: "", connectionState: "" },
    addressLists: { list: "l", address: "1.1.1.1" },
    queues: { name: "q", target: "10.0.0.0/24", maxLimit: "1M/1M" },
    services: { name: "ssh", port: 2222, disabled: true },
    users: { name: "u", group: "read" },
  };
  const keys = Object.entries(run("").router).filter(([, v]) => Array.isArray(v)).map(([k]) => k);
  it("setiap kunci array punya contoh", () => {
    expect(keys.filter((k) => !(k in sample))).toEqual([]);
  });
  it.each(keys)("awal mempertahankan %s", (k) => {
    const r = run("", { [k]: [sample[k]] }).router as unknown as Record<string, unknown>;
    expect(r[k]).toEqual([sample[k]]);
  });
});
