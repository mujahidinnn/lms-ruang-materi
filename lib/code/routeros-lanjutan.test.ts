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
    expect(dis).toEqual(["www-ssl"]);
    expect(router.services.find((s) => s.name === "winbox")).toEqual({ name: "winbox", port: 8291, disabled: false });
    expect(router.users).toEqual([{ name: "admin", group: "full" }]);
    for (const k of ["bridges", "bridgePorts", "dhcpLeases", "arp", "filter", "addressLists", "queues", "dhcpClients"] as const) expect(router[k]).toEqual([]);
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
  it("print: statik As lalu turunan DAc", () => {
    const r = run("/ip address add address=192.168.88.1/24 interface=ether2\n/ip route add dst-address=0.0.0.0/0 gateway=192.168.88.254\n/ip route print");
    const out = r.keluaran.slice(3);
    expect(out[0]).toMatch(/FLAGS\s+DST-ADDRESS\s+GATEWAY\s+DISTANCE/);
    expect(out[1]).toMatch(/^0\s+As\s+0\.0\.0\.0\/0\s+192\.168\.88\.254\s+1$/);
    expect(out[2]).toMatch(/^1\s+DAc\s+192\.168\.88\.0\/24\s+ether2\s+0$/);
    expect(r.router.routes).toHaveLength(1);
  });
  it("print: hanya distance terkecil per tujuan yang As, sisanya s", () => {
    const r = run("/ip route add dst-address=0.0.0.0/0 gateway=198.51.100.1 distance=2\n/ip route add dst-address=0.0.0.0/0 gateway=203.0.113.1\n/ip route add dst-address=10.0.0.0/8 gateway=203.0.113.1 distance=5\n/ip route print");
    const out = r.keluaran.slice(4);
    expect(out[1]).toMatch(/^0\s+s\s+0\.0\.0\.0\/0\s+198\.51\.100\.1\s+2$/);
    expect(out[2]).toMatch(/^1\s+As\s+0\.0\.0\.0\/0\s+203\.0\.113\.1\s+1$/);
    expect(out[3]).toMatch(/^2\s+As\s+10\.0\.0\.0\/8/);
  });
  it("print: distance sama, semuanya As", () => {
    const r = run("/ip route add dst-address=0.0.0.0/0 gateway=198.51.100.1\n/ip route add dst-address=0.0.0.0/0 gateway=203.0.113.1\n/ip route print");
    expect(r.keluaran.filter((l) => /\sAs\s/.test(l))).toHaveLength(2);
  });
});

describe("drift kunci array state", () => {
  const sample: Record<string, unknown> = {
    interfaces: { name: "e9", running: false, arp: "proxy-arp" },
    addresses: { address: "10.0.0.1/24", network: "10.0.0.0", interface: "e9" },
    pools: { name: "p", ranges: "1.1.1.1-1.1.1.2" },
    dhcpServers: { name: "d", interface: "e9", addressPool: "p", disabled: false },
    dhcpNetworks: { address: "10.0.0.0/24", gateway: "10.0.0.1", dnsServer: "8.8.8.8" },
    nat: { chain: "srcnat", action: "masquerade", outInterface: "e9", srcAddress: "", protocol: "", dstPort: "", inInterface: "", toAddresses: "", toPorts: "" },
    dhcpClients: { interface: "e9", disabled: false, usePeerDns: true, addDefaultRoute: true },
    routes: { dstAddress: "0.0.0.0/0", gateway: "10.0.0.1", distance: 3 },
    bridges: { name: "b" },
    bridgePorts: { bridge: "b", interface: "e9" },
    dhcpLeases: { address: "10.0.0.5", macAddress: "AA:BB:CC:00:11:22", server: "d" },
    arp: { address: "10.0.0.5", macAddress: "AA:BB:CC:00:11:22", interface: "e9" },
    filter: { chain: "input", action: "drop", protocol: "tcp", dstPort: "23", srcAddress: "", inInterface: "", connectionState: "", srcAddressList: "", dstAddressList: "" },
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
  it.each(keys)("awal membuang entri rusak %s", (k) => {
    const r = run("", { [k]: [{ __bad: 1 }] }).router as unknown as Record<string, unknown>;
    expect(r[k]).toEqual([]);
  });
  it("entri filter dan nat lama tetap sah", () => {
    const f = { chain: "input", action: "drop", protocol: "", dstPort: "", srcAddress: "", inInterface: "", connectionState: "" };
    const n = { chain: "srcnat", action: "masquerade", outInterface: "e1", srcAddress: "" };
    const r = run("", { filter: [f], nat: [n] }).router;
    expect(r.filter).toEqual([{ ...f, srcAddressList: "", dstAddressList: "" }]);
    expect(r.nat).toEqual([{ ...n, protocol: "", dstPort: "", inInterface: "", toAddresses: "", toPorts: "" }]);
  });
});

describe("bridge", () => {
  it("add dan print", () => {
    const r = run("/interface bridge add name=br1 comment=\"a b\"\n/interface bridge print");
    expect(r.router.bridges).toEqual([{ name: "br1" }]);
    expect(has(r.keluaran, "NAME")).toBe(true);
    expect(has(r.keluaran, "br1")).toBe(true);
  });
  it("galat", () => {
    expect(run("/interface bridge add").keluaran).toContain("failure: missing required argument name");
    expect(run("/interface bridge add name=bridge1", withBridge).keluaran).toContain("failure: already have interface with such name");
    expect(run("/interface bridge add name=ether1").keluaran).toContain("failure: already have interface with such name");
    expect(run("/interface bridge add foo=x").keluaran).toContain("expected end of command (line 1 column 23)");
    expect(run("/interface bridge add __proto__=x").keluaran.at(-1)).toMatch(/^expected end of command/);
    expect(run("/interface bridge add br1 name=br2").keluaran.at(-1)).toMatch(/^expected end of command/);
  });
});

describe("bridge port", () => {
  it("add dan print", () => {
    const r = run("/interface bridge port add bridge=bridge1 interface=ether2 comment=\"a b\"\n/interface bridge port print", withBridge);
    expect(r.router.bridgePorts).toEqual([{ bridge: "bridge1", interface: "ether2" }]);
    expect(has(r.keluaran, "BRIDGE")).toBe(true);
    expect(has(r.keluaran, "ether2")).toBe(true);
  });
  it("galat", () => {
    expect(run("/interface bridge port add bridge=bridge1 interface=ether2").keluaran).toContain("input does not match any value of bridge");
    expect(run("/interface bridge port add bridge=bridge1 interface=ether9", withBridge).keluaran).toContain("input does not match any value of interface");
    expect(run("/interface bridge port add bridge=bridge1 interface=bridge1", withBridge).keluaran).toContain("input does not match any value of interface");
    const dup = run("/interface bridge port add bridge=bridge1 interface=ether2\n/interface bridge port add bridge=bridge2 interface=ether2", { bridges: [{ name: "bridge1" }, { name: "bridge2" }] });
    expect(dup.keluaran).toContain("failure: device already added as bridge port");
    expect(dup.router.bridgePorts).toHaveLength(1);
    expect(run("/interface bridge port add interface=ether2", withBridge).keluaran).toContain("failure: missing required argument bridge");
    expect(run("/interface bridge port add bridge=bridge1 interface=ether2 x=1", withBridge).keluaran.at(-1)).toMatch(/^expected end of command/);
    expect(run("/interface bridge port add bridge=bridge1 interface=ether2 junk", withBridge).keluaran.at(-1)).toMatch(/^expected end of command/);
  });
});

describe("dhcp lease statis", () => {
  const ok = "/ip dhcp-server lease add address=10.0.0.5 mac-address=aa:bb:cc:00:11:22";
  it("add dan print", () => {
    const r = run(`${ok} server=d comment="a b"\n/ip dhcp-server lease print`, { dhcpServers: [{ name: "d", interface: "ether1", addressPool: "p", disabled: false }] });
    expect(r.router.dhcpLeases).toEqual([{ address: "10.0.0.5", macAddress: "aa:bb:cc:00:11:22", server: "d" }]);
    expect(has(r.keluaran, "MAC-ADDRESS")).toBe(true);
    expect(has(r.keluaran, "SERVER")).toBe(true);
    expect(has(r.keluaran, "10.0.0.5")).toBe(true);
  });
  it("server kosong diterima", () => {
    expect(run(ok).router.dhcpLeases).toEqual([{ address: "10.0.0.5", macAddress: "aa:bb:cc:00:11:22", server: "" }]);
    expect(run(`${ok} server=`).router.dhcpLeases).toHaveLength(1);
  });
  it("galat", () => {
    expect(run("/ip dhcp-server lease add address=10.0.0 mac-address=aa:bb:cc:00:11:22").keluaran).toContain("invalid value for argument address");
    expect(run("/ip dhcp-server lease add address=10.0.0.5 mac-address=zz").keluaran).toContain("invalid value for argument mac-address");
    expect(run(`${ok} server=nope`).keluaran).toContain("input does not match any value of server");
    expect(run("/ip dhcp-server lease add address=10.0.0.5").keluaran).toContain("failure: missing required argument mac-address");
    expect(run(`${ok} x=1`).keluaran.at(-1)).toMatch(/^expected end of command/);
    expect(run(`${ok} __proto__=x`).keluaran.at(-1)).toMatch(/^expected end of command/);
    expect(run(`${ok} junk`).keluaran.at(-1)).toMatch(/^expected end of command/);
  });
  it("duplikat", () => {
    const sameMac = run(`${ok}\n/ip dhcp-server lease add address=10.0.0.6 mac-address=AA:BB:CC:00:11:22`);
    expect(sameMac.keluaran).toContain("failure: already have such entry");
    expect(sameMac.router.dhcpLeases).toHaveLength(1);
    const sameIp = run(`${ok}\n/ip dhcp-server lease add address=10.0.0.5 mac-address=aa:bb:cc:00:11:33`);
    expect(sameIp.keluaran).toContain("failure: already have such entry");
    expect(sameIp.router.dhcpLeases).toHaveLength(1);
  });
});

describe("firewall filter", () => {
  const f = (a: string) => `/ip firewall filter add ${a}`;
  it("aturan beruntun, urutan, print", () => {
    const r = run(`${f("chain=input action=accept connection-state=established,related")}\n${f("chain=input action=drop protocol=tcp dst-port=23 src-address=10.0.0.0/24 in-interface=ether1 comment=x")}\n/ip firewall filter print`);
    expect(r.router.filter).toEqual([
      { chain: "input", action: "accept", protocol: "", dstPort: "", srcAddress: "", inInterface: "", connectionState: "established,related", srcAddressList: "", dstAddressList: "" },
      { chain: "input", action: "drop", protocol: "tcp", dstPort: "23", srcAddress: "10.0.0.0/24", inInterface: "ether1", connectionState: "", srcAddressList: "", dstAddressList: "" },
    ]);
    expect(has(r.keluaran, "CONNECTION-STATE")).toBe(true);
    expect(has(r.keluaran, "IN-INTERFACE")).toBe(true);
  });
  it("dst-port bentuk", () => {
    for (const p of ["80", "8000-8100", "80,443"]) expect(run(f(`chain=input action=drop protocol=udp dst-port=${p}`)).router.filter).toHaveLength(1);
    for (const p of ["0", "65536", "a", "100-80"]) expect(run(f(`chain=input action=drop protocol=tcp dst-port=${p}`)).keluaran).toContain("invalid value for argument dst-port");
  });
  it("galat", () => {
    expect(run(f("chain=x action=drop")).keluaran).toContain("input does not match any value of chain");
    expect(run(f("chain=input action=x")).keluaran).toContain("input does not match any value of action");
    expect(run(f("chain=input action=drop protocol=x")).keluaran).toContain("input does not match any value of protocol");
    expect(run(f("chain=input action=drop dst-port=80")).keluaran).toContain("failure: protocol tcp or udp required for dst-port");
    expect(run(f("chain=input action=drop protocol=icmp dst-port=80")).keluaran).toContain("failure: protocol tcp or udp required for dst-port");
    expect(run(f("chain=input action=drop src-address=1.1.1")).keluaran).toContain("invalid value for argument src-address");
    expect(run(f("chain=input action=drop in-interface=ether9")).keluaran).toContain("input does not match any value of in-interface");
    expect(run(f("chain=input action=drop connection-state=established,foo")).keluaran).toContain("invalid value for argument connection-state");
    expect(run(f("chain=input")).keluaran).toContain("failure: missing required argument action");
    expect(run(f("action=drop")).keluaran).toContain("failure: missing required argument chain");
    expect(run(f("chain=input action=drop x=1")).keluaran.at(-1)).toMatch(/^expected end of command/);
    expect(run(f("chain=input action=drop __proto__=x")).keluaran.at(-1)).toMatch(/^expected end of command/);
    expect(run(f("chain=input action=drop junk")).keluaran.at(-1)).toMatch(/^expected end of command/);
    expect(run(f("chain=input action=drop src-address=1.2.3.4")).router.filter).toHaveLength(1);
  });
});

describe("address-list", () => {
  const a = "/ip firewall address-list add list=ban address=10.0.0.5";
  it("add dan print", () => {
    const r = run(`${a} comment="a b"\n/ip firewall address-list add list=ban address=10.0.1.0/24\n/ip firewall address-list print`);
    expect(r.router.addressLists).toEqual([{ list: "ban", address: "10.0.0.5" }, { list: "ban", address: "10.0.1.0/24" }]);
    expect(has(r.keluaran, "LIST")).toBe(true);
  });
  it("galat", () => {
    expect(run("/ip firewall address-list add list=ban address=1.1.1").keluaran).toContain("invalid value for argument address");
    const d = run(`${a}\n${a}`);
    expect(d.keluaran).toContain("failure: already have such entry");
    expect(d.router.addressLists).toHaveLength(1);
    expect(run("/ip firewall address-list add list=ban").keluaran).toContain("failure: missing required argument address");
    expect(run("/ip firewall address-list add address=1.1.1.1").keluaran).toContain("failure: missing required argument list");
    expect(run(`${a} x=1`).keluaran.at(-1)).toMatch(/^expected end of command/);
    expect(run(`${a} __proto__=x`).keluaran.at(-1)).toMatch(/^expected end of command/);
    expect(run(`${a} junk`).keluaran.at(-1)).toMatch(/^expected end of command/);
  });
});

describe("queue simple", () => {
  const q = (a: string) => `/queue simple add ${a}`;
  it("add dan print", () => {
    const r = run(`${q("name=q1 target=192.168.88.0/24 max-limit=2M/10M comment=x")}\n${q("name=q2 target=10.0.0.5")}\n/queue simple print`);
    expect(r.router.queues).toEqual([{ name: "q1", target: "192.168.88.0/24", maxLimit: "2M/10M" }, { name: "q2", target: "10.0.0.5", maxLimit: "" }]);
    expect(has(r.keluaran, "MAX-LIMIT")).toBe(true);
  });
  it("max-limit", () => {
    for (const m of ["2M/10M", "512k/1M", "0/0"]) expect(run(q(`name=a target=10.0.0.5 max-limit=${m}`)).router.queues).toHaveLength(1);
    for (const m of ["2M", "M/2M", "2X/2M"]) expect(run(q(`name=a target=10.0.0.5 max-limit=${m}`)).keluaran).toContain("invalid value for argument max-limit");
  });
  it("galat", () => {
    expect(run(q("name=a target=1.1.1")).keluaran).toContain("invalid value for argument target");
    const d = run(`${q("name=a target=10.0.0.5")}\n${q("name=a target=10.0.0.6")}`);
    expect(d.keluaran).toContain("failure: already have such name");
    expect(d.router.queues).toHaveLength(1);
    expect(run(q("name=a")).keluaran).toContain("failure: missing required argument target");
    expect(run(q("target=10.0.0.5")).keluaran).toContain("failure: missing required argument name");
    expect(run(q("name=a target=10.0.0.5 x=1")).keluaran.at(-1)).toMatch(/^expected end of command/);
    expect(run(q("name=a target=10.0.0.5 __proto__=x")).keluaran.at(-1)).toMatch(/^expected end of command/);
    expect(run(q("name=a target=10.0.0.5 junk")).keluaran.at(-1)).toMatch(/^expected end of command/);
  });
});

describe("ip service", () => {
  it("print dan set", () => {
    const r = run("/ip service print\n/ip service set telnet disabled=yes port=2323\n/ip service set www-ssl disabled=no");
    expect(has(r.keluaran, "FLAGS")).toBe(true);
    expect(r.keluaran.some((l) => /X\s+www-ssl\s+443/.test(l))).toBe(true);
    expect(r.router.services.find((s) => s.name === "telnet")).toEqual({ name: "telnet", port: 2323, disabled: true });
    expect(r.router.services.find((s) => s.name === "www-ssl")!.disabled).toBe(false);
  });
  it("set tanpa argumen diterima tanpa efek", () => {
    const r = run("/ip service set telnet");
    expect(r.keluaran).toHaveLength(1);
    expect(r.router.services.find((s) => s.name === "telnet")).toEqual({ name: "telnet", port: 23, disabled: false });
  });
  it("galat", () => {
    expect(run("/ip service set foo disabled=yes").keluaran).toContain("no such item");
    expect(run("/ip service set disabled=yes").keluaran).toContain("failure: missing required argument name");
    expect(run("/ip service set telnet disabled=maybe").keluaran).toContain("invalid value for argument disabled");
    for (const p of ["0", "65536", "a", "1.5"]) expect(run(`/ip service set telnet port=${p}`).keluaran).toContain("invalid value for argument port");
    expect(run("/ip service set telnet ssh disabled=yes").keluaran.at(-1)).toMatch(/^expected end of command/);
    expect(run("/ip service set telnet x=1").keluaran.at(-1)).toMatch(/^expected end of command/);
    expect(run("/ip service set telnet __proto__=x").keluaran.at(-1)).toMatch(/^expected end of command/);
  });
});

describe("user", () => {
  it("add, print, password tidak disimpan", () => {
    const r = run('/user add name=budi password="rahasia123" group=read comment=x\n/user print');
    expect(r.router.users).toEqual([{ name: "admin", group: "full" }, { name: "budi", group: "read" }]);
    expect(JSON.stringify(r.router)).not.toContain("rahasia123");
    expect(has(r.keluaran, "GROUP")).toBe(true);
    expect(has(r.keluaran, "budi")).toBe(true);
  });
  it("galat", () => {
    expect(run("/user add name=a group=root").keluaran).toContain("input does not match any value of group");
    expect(run("/user add name=a").keluaran).toContain("failure: missing required argument group");
    expect(run("/user add group=read").keluaran).toContain("failure: missing required argument name");
    const d = run("/user add name=admin group=read");
    expect(d.keluaran).toContain("failure: user with the same name already exists");
    expect(d.router.users).toHaveLength(1);
    expect(run("/user add name=a group=read x=1").keluaran.at(-1)).toMatch(/^expected end of command/);
    expect(run("/user add name=a group=read __proto__=x").keluaran.at(-1)).toMatch(/^expected end of command/);
    expect(run("/user add name=a group=read junk").keluaran.at(-1)).toMatch(/^expected end of command/);
  });
});

describe("gelombang perbaikan", () => {
  const f = (a: string) => `/ip firewall filter add ${a}`;
  const nat = (a: string) => `/ip firewall nat add ${a}`;
  it("filter address-list dan fasttrack", () => {
    const r = run(f('chain=forward action=fasttrack-connection src-address-list=ok dst-address-list="a b"') + "\n/ip firewall filter print");
    expect(r.router.filter[0]).toMatchObject({ action: "fasttrack-connection", srcAddressList: "ok", dstAddressList: "a b" });
    expect(has(r.keluaran, "SRC-ADDRESS-LIST")).toBe(true);
    expect(has(r.keluaran, "DST-ADDRESS-LIST")).toBe(true);
    expect(run(f("chain=input action=fasttrack-connection")).keluaran).toContain("failure: fasttrack-connection works only in the forward chain");
    expect(run(f("chain=input action=drop src-address-list=")).router.filter[0].srcAddressList).toBe("");
    expect(run(f("chain=input action=drop src-address-list=__proto__")).router.filter).toHaveLength(1);
    expect(run(f("chain=input action=drop __proto__=x")).keluaran.at(-1)).toMatch(/^expected end of command/);
  });
  it("nat argumen baru", () => {
    const r = run(nat("chain=dstnat action=dst-nat protocol=tcp dst-port=80 in-interface=ether1 to-addresses=192.168.1.10 to-ports=8080-8090\n/ip firewall nat print"));
    expect(r.router.nat).toEqual([{ chain: "dstnat", action: "dst-nat", outInterface: "", srcAddress: "", protocol: "tcp", dstPort: "80", inInterface: "ether1", toAddresses: "192.168.1.10", toPorts: "8080-8090" }]);
    for (const c of ["TO-ADDRESSES", "TO-PORTS", "DST-PORT", "IN-INTERFACE", "PROTOCOL"]) expect(has(r.keluaran, c)).toBe(true);
    const base = "chain=dstnat action=dst-nat to-addresses=1.1.1.1";
    expect(run(nat(base + " protocol=x")).keluaran).toContain("input does not match any value of protocol");
    expect(run(nat(base + " dst-port=80")).keluaran).toContain("failure: protocol tcp or udp required for dst-port");
    expect(run(nat(base + " protocol=tcp dst-port=0")).keluaran).toContain("invalid value for argument dst-port");
    expect(run(nat(base + " in-interface=ether9")).keluaran).toContain("input does not match any value of in-interface");
    expect(run(nat("chain=dstnat action=dst-nat to-addresses=1.1.1")).keluaran).toContain("invalid value for argument to-addresses");
    for (const p of ["0", "65536", "a", "9-1", "80,81"]) expect(run(nat(base + ` to-ports=${p}`)).keluaran).toContain("invalid value for argument to-ports");
    expect(run(nat("chain=dstnat action=dst-nat")).keluaran).toContain("failure: missing required argument to-addresses");
    expect(run(nat("chain=srcnat action=masquerade out-interface=ether1")).router.nat).toHaveLength(1);
    expect(run(nat(base + " __proto__=x")).keluaran.at(-1)).toMatch(/^expected end of command/);
    expect(run(nat(base + ' to-ports="80"')).router.nat[0].toPorts).toBe("80");
  });
  it("queue target interface", () => {
    expect(run("/queue simple add name=a target=ether1").router.queues).toHaveLength(1);
    expect(run("/queue simple add name=a target=br1", { bridges: [{ name: "br1" }] }).router.queues).toHaveLength(1);
    expect(run("/queue simple add name=a target=ether9").keluaran).toContain("invalid value for argument target");
  });
  it("dhcp-client", () => {
    const r = run('/ip dhcp-client add interface=ether1 comment="a b"\n/ip dhcp-client add interface=br1 disabled=no use-peer-dns=no add-default-route=no\n/ip dhcp-client print', { bridges: [{ name: "br1" }] });
    expect(r.router.dhcpClients).toEqual([
      { interface: "ether1", disabled: true, usePeerDns: true, addDefaultRoute: true },
      { interface: "br1", disabled: false, usePeerDns: false, addDefaultRoute: false },
    ]);
    expect(has(r.keluaran, "USE-PEER-DNS")).toBe(true);
    expect(has(r.keluaran, "ADD-DEFAULT-ROUTE")).toBe(true);
    expect(r.keluaran.some((l) => /X\s+ether1/.test(l))).toBe(true);
    expect(run("/ip dhcp-client add interface=ether9").keluaran).toContain("input does not match any value of interface");
    expect(run("/ip dhcp-client add").keluaran).toContain("failure: missing required argument interface");
    for (const k of ["disabled", "use-peer-dns", "add-default-route"]) {
      expect(run(`/ip dhcp-client add interface=ether1 ${k}=maybe`).keluaran).toContain(`invalid value for argument ${k}`);
      expect(run(`/ip dhcp-client add interface=ether1 ${k}=`).keluaran).toContain(`invalid value for argument ${k}`);
    }
    const d = run("/ip dhcp-client add interface=ether1\n/ip dhcp-client add interface=ether1");
    expect(d.keluaran).toContain("failure: already have such entry");
    expect(d.router.dhcpClients).toHaveLength(1);
    expect(run("/ip dhcp-client add interface=ether1 __proto__=x").keluaran.at(-1)).toMatch(/^expected end of command/);
    expect(run("/ip dhcp-client add interface=ether1 junk").keluaran.at(-1)).toMatch(/^expected end of command/);
  });
  it("interface print memuat bridge", () => {
    const r = run("/interface print", { bridges: [{ name: "br1" }] });
    expect(r.keluaran.some((l) => /^R\s+br1\s+bridge$|^\d+\s+R\s+br1\s+bridge$/.test(l))).toBe(true);
  });
  it("0.0.0.0 sah untuk arp dan lease", () => {
    expect(run("/ip arp add address=0.0.0.0 mac-address=AA:BB:CC:00:11:22 interface=ether1").router.arp).toHaveLength(1);
    expect(run("/ip dhcp-server lease add address=0.0.0.0 mac-address=aa:bb:cc:00:11:22").router.dhcpLeases).toHaveLength(1);
  });
});
