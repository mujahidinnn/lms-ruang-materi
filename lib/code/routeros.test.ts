import { describe, expect, it } from "vitest";
import { routerOSShim } from "./routeros";

const run = (s: string, awal?: Parameters<ReturnType<typeof routerOSShim>["jalankanRouterOS"]>[1]) => routerOSShim().jalankanRouterOS(s, awal);
const has = (k: string[], sub: string) => k.some((l) => l.includes(sub));

describe("routerOSShim", () => {
  it("state awal", () => {
    const { router } = run("");
    expect(router.identity).toBe("MikroTik");
    expect(router.interfaces.map((i) => i.name)).toEqual(["ether1", "ether2", "ether3", "ether4", "ether5"]);
    expect(router.interfaces.every((i) => i.running)).toBe(true);
    expect(router.dns).toEqual({ servers: [], allowRemoteRequests: false });
  });

  it("identity set dan print", () => {
    const r = run("/system identity set name=R-Kantor\n/system identity print");
    expect(r.router.identity).toBe("R-Kantor");
    expect(r.keluaran).toContain("name: R-Kantor");
    expect(r.keluaran[0]).toBe("[admin@MikroTik] > /system identity set name=R-Kantor");
  });

  it("interface print", () => {
    const { keluaran } = run("/interface print");
    expect(has(keluaran, "NAME")).toBe(true);
    expect(has(keluaran, "TYPE")).toBe(true);
    expect(has(keluaran, "ether1")).toBe(true);
  });

  it("address add menghitung network", () => {
    const a = run("/ip address add address=192.168.88.1/24 interface=ether2").router.addresses;
    expect(a).toHaveLength(1);
    expect(a[0].network).toBe("192.168.88.0");
    expect(run("/ip address add address=192.168.88.130/26 interface=ether2").router.addresses[0].network).toBe("192.168.88.128");
  });

  it("address duplikat dan galat", () => {
    const d = run("/ip address add address=192.168.88.1/24 interface=ether2\n/ip address add address=192.168.88.1/24 interface=ether2");
    expect(d.keluaran).toContain("failure: already have such address");
    expect(d.router.addresses).toHaveLength(1);
    expect(has(run("/ip address add address=192.168.88.1/24 interface=ether9").keluaran, "input does not match any value of interface")).toBe(true);
    for (const a of ["192.168.88.1/33", "300.1.1.1/24", "192.168.88.1"]) {
      const r = run(`/ip address add address=${a} interface=ether1`);
      expect(has(r.keluaran, "invalid value for argument address")).toBe(true);
      expect(r.router.addresses).toHaveLength(0);
    }
  });

  it("address remove dan print", () => {
    const base = "/ip address add address=10.0.0.1/24 interface=ether1\n";
    const r = run(base + "/ip address print");
    expect(has(r.keluaran, "ADDRESS")).toBe(true);
    expect(has(r.keluaran, "10.0.0.0")).toBe(true);
    expect(run(base + "/ip address remove 0").router.addresses).toHaveLength(0);
    expect(run(base + "/ip address remove 5").keluaran).toContain("no such item");
  });

  it("pool", () => {
    const r = run("/ip pool add name=p1 ranges=192.168.88.10-192.168.88.100\n/ip pool print");
    expect(r.router.pools).toEqual([{ name: "p1", ranges: "192.168.88.10-192.168.88.100" }]);
    expect(has(r.keluaran, "p1")).toBe(true);
  });

  it("dhcp-server dan network", () => {
    const pool = "/ip pool add name=p1 ranges=10.0.0.2-10.0.0.9\n";
    const ok = run(pool + "/ip dhcp-server add name=d1 interface=ether2 address-pool=p1\n/ip dhcp-server print");
    expect(ok.router.dhcpServers).toEqual([{ name: "d1", interface: "ether2", addressPool: "p1" }]);
    const noPool = run("/ip dhcp-server add name=d1 interface=ether2 address-pool=zz");
    expect(has(noPool.keluaran, "input does not match any value of address-pool")).toBe(true);
    expect(noPool.router.dhcpServers).toHaveLength(0);
    expect(has(run(pool + "/ip dhcp-server add name=d1 interface=ether9 address-pool=p1").keluaran, "input does not match any value of interface")).toBe(true);
    const n = run("/ip dhcp-server network add address=10.0.0.0/24 gateway=10.0.0.1 dns-server=8.8.8.8\n/ip dhcp-server network print");
    expect(n.router.dhcpNetworks).toEqual([{ address: "10.0.0.0/24", gateway: "10.0.0.1", dnsServer: "8.8.8.8" }]);
  });

  it("nat", () => {
    const bad = run("/ip firewall nat add chain=foo action=masquerade");
    expect(has(bad.keluaran, "input does not match any value of chain")).toBe(true);
    expect(has(run("/ip firewall nat add chain=srcnat action=foo").keluaran, "input does not match any value of action")).toBe(true);
    const ok = run("/ip firewall nat add chain=srcnat action=masquerade out-interface=ether1\n/ip firewall nat print");
    expect(ok.router.nat).toEqual([{ chain: "srcnat", action: "masquerade", outInterface: "ether1", srcAddress: "" }]);
  });

  it("route dan dns", () => {
    const r = run("/ip route add dst-address=0.0.0.0/0 gateway=192.168.1.1\n/ip route print");
    expect(r.router.routes).toEqual([{ dstAddress: "0.0.0.0/0", gateway: "192.168.1.1" }]);
    const d = run('/ip dns set servers=8.8.8.8,1.1.1.1 allow-remote-requests=yes\n/ip dns print');
    expect(d.router.dns).toEqual({ servers: ["8.8.8.8", "1.1.1.1"], allowRemoteRequests: true });
  });

  it("gaya slash, sambungan, komentar, nilai berkutip", () => {
    const one = run("/ip address add address=192.168.88.1/24 interface=ether2").router;
    expect(run("/ip/address/add address=192.168.88.1/24 interface=ether2").router).toEqual(one);
    expect(run("/ip address add \\\n  address=192.168.88.1/24 \\\n  interface=ether2").router).toEqual(one);
    expect(run('/system identity set name="R Satu"').router.identity).toBe("R Satu");
    const r = run("# komentar\n\n/system identity set name=A\n");
    expect(r.keluaran).toHaveLength(1);
  });

  it("galat satu baris tidak menghentikan berikutnya", () => {
    const r = run("/ip address add address=1.1.1.1/24 interface=ether9\n/system identity set name=X");
    expect(r.router.identity).toBe("X");
  });

  it("ping", () => {
    const own = "/ip address add address=192.168.88.1/24 interface=ether2\n";
    const self = run(own + "/ping 192.168.88.1 count=4").keluaran;
    expect(self).toContain("sent=4 received=4 packet-loss=0%");
    expect(self).toContain("192.168.88.1 56 64 1ms");
    expect(has(run(own + "/ping 192.168.88.50 count=1").keluaran, "received=1")).toBe(true);
    expect(has(run("/ping 8.8.8.8 count=2").keluaran, "packet-loss=100%")).toBe(true);
    expect(has(run("/ping 8.8.8.8").keluaran, "timeout")).toBe(true);
    const viaRoute = run("/ip route add dst-address=0.0.0.0/0 gateway=192.168.1.1\n/ping 8.8.8.8 count=2");
    expect(has(viaRoute.keluaran, "packet-loss=0%")).toBe(true);
    expect(has(run("/ping 8.8.8.8 count=999999").keluaran, "invalid value for argument count")).toBe(true);
    expect(has(run("/ping 8.8.8.8 count=0").keluaran, "invalid value for argument count")).toBe(true);
  });

  it("perintah tak dikenal dan argumen tak dikenal", () => {
    expect(run("foo bar").keluaran).toContain("bad command name foo (line 1 column 1)");
    expect(has(run("\n/ip address add address=1.1.1.1/24 interface=ether1 foo=1").keluaran, "expected end of command (line 2")).toBe(true);
  });

  it("argumen wajib hilang", () => {
    expect(has(run("/ip address add interface=ether1").keluaran, "failure: missing required argument address")).toBe(true);
  });

  it("__proto__ diperlakukan sebagai argumen tak dikenal", () => {
    const r = run("/ip address add address=192.168.88.1/24 interface=ether2 __proto__=x");
    expect(has(r.keluaran, "expected end of command")).toBe(true);
    expect(({} as Record<string, unknown>).x).toBeUndefined();
    for (const k of ["constructor", "prototype"]) {
      expect(has(run(`/ip address add address=1.1.1.1/24 interface=ether1 ${k}=x`).keluaran, "expected end of command")).toBe(true);
    }
  });

  it("batas skrip", () => {
    const r = run(Array(201).fill("/system identity print").join("\n"));
    expect(r.keluaran).toEqual(["script too long"]);
    expect(run("x".repeat(2001)).keluaran).toEqual(["script too long"]);
    expect(run(Array(200).fill("/system identity print").join("\n")).keluaran.length).toBe(400);
  });

  it("awal", () => {
    expect(run("", { identity: "R1" }).router.identity).toBe("R1");
    expect(run("", { identity: 5 as unknown as string }).router.identity).toBe("MikroTik");
    expect(run("/system identity set name=R2", { identity: "R1" }).keluaran[0]).toBe("[admin@R1] > /system identity set name=R2");
    expect(run("/system identity print\n/system identity set name=R2\n/system identity print", { identity: "R1" }).keluaran[3]).toBe("[admin@R2] > /system identity print");
  });

  it("swa-cukup lewat toString", () => {
    const src = routerOSShim.toString();
    const shim = new Function("return (" + src + ")()")();
    const r = shim.jalankanRouterOS("/system identity set name=Z");
    expect(r.router.identity).toBe("Z");
  });
});
