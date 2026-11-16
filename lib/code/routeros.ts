export type RouterState = {
  identity: string;
  interfaces: { name: string; running: boolean; arp: string }[];
  addresses: { address: string; network: string; interface: string }[];
  pools: { name: string; ranges: string }[];
  dhcpServers: { name: string; interface: string; addressPool: string; disabled: boolean }[];
  dhcpNetworks: { address: string; gateway: string; dnsServer: string }[];
  nat: { chain: string; action: string; outInterface: string; srcAddress: string }[];
  routes: { dstAddress: string; gateway: string; distance: number }[];
  dns: { servers: string[]; allowRemoteRequests: boolean };
  bridges: { name: string }[];
  bridgePorts: { bridge: string; interface: string }[];
  dhcpLeases: { address: string; macAddress: string; server: string }[];
  arp: { address: string; macAddress: string; interface: string }[];
  filter: { chain: string; action: string; protocol: string; dstPort: string; srcAddress: string; inInterface: string; connectionState: string }[];
  addressLists: { list: string; address: string }[];
  queues: { name: string; target: string; maxLimit: string }[];
  services: { name: string; port: number; disabled: boolean }[];
  users: { name: string; group: string }[];
};

// A tiny RouterOS terminal for exercises: runs a script of commands against an
// in-memory router. Self-contained (no imports, no outer references) so its
// source can be injected into the sandbox as text. Learner script is data only.
export function routerOSShim() {
  const MAX_LINES = 200;
  const MAX_LINE_LEN = 2000;
  type S = RouterState;
  type Tok = { text: string; col: number };
  type Spec = { keys: string[]; req: string[] };

  const initial = (): S => ({
    identity: "MikroTik",
    interfaces: [1, 2, 3, 4, 5].map((n) => ({ name: "ether" + n, running: true, arp: "enabled" })),
    addresses: [],
    pools: [],
    dhcpServers: [],
    dhcpNetworks: [],
    nat: [],
    routes: [],
    dns: { servers: [], allowRemoteRequests: false },
    bridges: [],
    bridgePorts: [],
    dhcpLeases: [],
    arp: [],
    filter: [],
    addressLists: [],
    queues: [],
    services: [
      ["telnet", 23],
      ["ftp", 21],
      ["www", 80],
      ["ssh", 22],
      ["www-ssl", 443],
      ["api", 8728],
      ["winbox", 8291],
      ["api-ssl", 8729],
    ].map(([name, port]) => ({ name: name as string, port: port as number, disabled: name === "www-ssl" || name === "api-ssl" })),
    users: [{ name: "admin", group: "full" }],
  });

  const ip4 = (s: string): number | null => {
    const p = s.split(".");
    if (p.length !== 4) return null;
    let n = 0;
    for (const o of p) {
      if (!/^\d{1,3}$/.test(o) || Number(o) > 255) return null;
      n = n * 256 + Number(o);
    }
    return n;
  };
  const dotted = (n: number) => [n >>> 24, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join(".");
  const maskOf = (p: number) => (p === 0 ? 0 : (0xffffffff << (32 - p)) >>> 0);
  const cidr = (s: string): { ip: number; prefix: number } | null => {
    const i = s.indexOf("/");
    if (i < 0) return null;
    const ip = ip4(s.slice(0, i));
    const ps = s.slice(i + 1);
    if (ip === null || !/^\d{1,2}$/.test(ps) || Number(ps) > 32) return null;
    return { ip, prefix: Number(ps) };
  };

  const table = (head: string[], rows: string[][]) => {
    const w = head.map((h, i) => Math.max(h.length, ...rows.map((r) => r[i].length)));
    const fmt = (r: string[]) => r.map((c, i) => c.padEnd(w[i])).join("  ").trimEnd();
    return [fmt(head), ...rows.map(fmt)];
  };

  const tokenize = (line: string): Tok[] => {
    const out: Tok[] = [];
    let cur = "";
    let start = -1;
    let q = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        if (start < 0) start = i;
        q = !q;
      } else if (/\s/.test(c) && !q) {
        if (start >= 0) out.push({ text: cur, col: start + 1 });
        cur = "";
        start = -1;
      } else {
        if (start < 0) start = i;
        cur += c;
      }
    }
    if (start >= 0) out.push({ text: cur, col: start + 1 });
    return out;
  };

  const SPECS: Record<string, Spec> = {
    "system identity set": { keys: ["name"], req: ["name"] },
    "ip address add": { keys: ["address", "interface"], req: ["address", "interface"] },
    "ip pool add": { keys: ["name", "ranges"], req: ["name", "ranges"] },
    "ip dhcp-server add": { keys: ["name", "interface", "address-pool", "disabled"], req: ["name", "interface", "address-pool"] },
    "ip dhcp-server network add": { keys: ["address", "gateway", "dns-server"], req: ["address"] },
    "ip firewall nat add": { keys: ["chain", "action", "out-interface", "src-address"], req: ["chain", "action"] },
    "ip route add": { keys: ["dst-address", "gateway", "distance"], req: ["dst-address", "gateway"] },
    "ip dns set": { keys: ["servers", "allow-remote-requests"], req: [] },
    "interface ethernet set": { keys: ["arp"], req: ["arp"] },
    "ip arp add": { keys: ["address", "mac-address", "interface"], req: ["address", "mac-address", "interface"] },
    "interface bridge add": { keys: ["name"], req: ["name"] },
    "interface bridge port add": { keys: ["bridge", "interface"], req: ["bridge", "interface"] },
    "ip dhcp-server lease add": { keys: ["address", "mac-address", "server"], req: ["address", "mac-address"] },
    ping: { keys: ["count"], req: [] },
  };
  const PRINTS = ["system identity", "interface", "interface ethernet", "ip arp", "ip address", "ip pool", "ip dhcp-server", "ip dhcp-server network", "ip firewall nat", "ip route", "ip dns", "interface bridge", "interface bridge port", "ip dhcp-server lease"];
  for (const p of PRINTS) SPECS[p + " print"] = { keys: [], req: [] };
  SPECS["ip address remove"] = { keys: [], req: [] };
  for (const n of Object.keys(SPECS)) if (n.endsWith(" add")) SPECS[n].keys.push("comment");
  // Longest path first so "ip dhcp-server network add" beats "ip dhcp-server".
  const NAMES = Object.keys(SPECS).sort((a, b) => b.length - a.length);

  function jalankanRouterOS(script: string, awal?: Partial<S>) {
    const router = initial();
    const keluaran: string[] = [];
    if (awal && typeof awal === "object") {
      const base = router as unknown as Record<string, unknown>;
      const given = awal as unknown as Record<string, unknown>;
      // Entries and nested fields of the wrong type are dropped, never thrown on.
      const shapes: Record<string, Record<string, string>> = {
        interfaces: { name: "string", running: "boolean" },
        addresses: { address: "string", network: "string", interface: "string" },
        pools: { name: "string", ranges: "string" },
        dhcpServers: { name: "string", interface: "string", addressPool: "string", disabled: "boolean" },
        dhcpNetworks: { address: "string", gateway: "string", dnsServer: "string" },
        nat: { chain: "string", action: "string", outInterface: "string", srcAddress: "string" },
        routes: { dstAddress: "string", gateway: "string" },
        bridges: { name: "string" },
        bridgePorts: { bridge: "string", interface: "string" },
        dhcpLeases: { address: "string", macAddress: "string", server: "string" },
        arp: { address: "string", macAddress: "string", interface: "string" },
        filter: { chain: "string", action: "string", protocol: "string", dstPort: "string", srcAddress: "string", inInterface: "string", connectionState: "string" },
        addressLists: { list: "string", address: "string" },
        queues: { name: "string", target: "string", maxLimit: "string" },
        services: { name: "string", port: "number", disabled: "boolean" },
        users: { name: "string", group: "string" },
      };
      // Fields with a default may be absent from an entry; present but mistyped drops it.
      const defaults: Record<string, Record<string, string | number>> = {
        interfaces: { arp: "enabled" },
        routes: { distance: 1 },
      };
      for (const k of Object.keys(base)) {
        const v = given[k];
        if (v === undefined || v === null) continue;
        const shape = shapes[k];
        if (shape) {
          if (!Array.isArray(v)) continue;
          const def = defaults[k] ?? {};
          const fields: Record<string, string> = { ...shape };
          for (const f of Object.keys(def)) fields[f] = typeof def[f];
          base[k] = v
            .filter((e) => e && typeof e === "object" && Object.keys(fields).every((f) => (e[f] === undefined && f in def) || typeof e[f] === fields[f]))
            .map((e) => Object.fromEntries(Object.keys(fields).map((f) => [f, e[f] ?? def[f]])));
        } else if (k === "dns") {
          if (typeof v !== "object" || Array.isArray(v)) continue;
          const d = v as { servers?: unknown; allowRemoteRequests?: unknown };
          if (Array.isArray(d.servers) && d.servers.every((x) => typeof x === "string")) router.dns.servers = [...d.servers];
          if (typeof d.allowRemoteRequests === "boolean") router.dns.allowRemoteRequests = d.allowRemoteRequests;
        } else if (typeof v === typeof base[k]) base[k] = v;
      }
    }

    const physical = String(script).split(/\r?\n/);
    if (physical.length > 1 && physical[physical.length - 1] === "") physical.pop();
    if (physical.length > MAX_LINES || physical.some((l) => l.length > MAX_LINE_LEN)) return { router, keluaran: ["script too long"] };

    // Join " \" continuations into logical lines, remembering the first physical line.
    const lines: { text: string; no: number }[] = [];
    for (let i = 0; i < physical.length; i++) {
      let text = physical[i].trim();
      const no = i + 1;
      while ((text.endsWith(" \\") || text === "\\") && i + 1 < physical.length) {
        text = text.slice(0, -1).trim() + " " + physical[++i].trim();
      }
      text = text.replace(/\s*\\$/, "").trim();
      if (text === "" || text[0] === "#") continue;
      lines.push({ text, no });
    }

    const printList = (head: string[], rows: string[][]) => {
      const t = table(["#", ...head], rows.map((r, i) => [String(i), ...r]));
      for (const l of t) keluaran.push(l);
    };
    const netCovers = (ip: number): boolean => {
      for (const a of router.addresses) {
        const c = cidr(a.address);
        if (c && ip4(a.address.split("/")[0]) === ip) return true;
        const n = ip4(a.network);
        if (c && n !== null && ((ip & maskOf(c.prefix)) >>> 0) === n) return true;
      }
      for (const r of router.routes) {
        const c = cidr(r.dstAddress);
        if (c && ((ip & maskOf(c.prefix)) >>> 0) === ((c.ip & maskOf(c.prefix)) >>> 0)) return true;
      }
      return false;
    };

    for (const { text, no } of lines) {
      keluaran.push(`[admin@${router.identity}] > ${text}`);
      const err = (m: string) => keluaran.push(m);
      const toks = tokenize(text);
      // Split the leading path: "/ip/address/add" or "/ip address add".
      const cut = toks.findIndex((t) => t.text.indexOf("=") > 0);
      const stop = cut < 0 ? toks.length : cut;
      const words: Tok[] = [];
      toks.slice(0, stop).forEach((t, i) => {
        if (i > 0 || t.text.indexOf("/") < 0) return void words.push(t);
        let off = 0;
        for (const seg of t.text.split("/")) {
          if (seg) words.push({ text: seg, col: t.col + off });
          off += seg.length + 1;
        }
      });
      const rest = toks.slice(stop);

      // Longest known command that is a prefix of the words.
      let name = "";
      let used = 0;
      for (const n of NAMES) {
        const p = n.split(" ");
        if (p.length <= words.length && p.every((w, i) => words[i].text === w)) {
          name = n;
          used = p.length;
          break;
        }
      }
      if (!name) {
        // Report the first word that stops matching any command.
        const known = new Set<string>();
        for (const n of NAMES) {
          const p = n.split(" ");
          for (let i = 1; i <= p.length; i++) known.add(p.slice(0, i).join(" "));
        }
        let bad = 0;
        while (bad < words.length && known.has(words.slice(0, bad + 1).map((w) => w.text).join(" "))) bad++;
        const w = words[Math.min(bad, words.length - 1)];
        err(`bad command name ${w ? w.text : text} (line ${no} column ${w ? w.col : 1})`);
        continue;
      }

      const spec = SPECS[name];
      const pos: Tok[] = words.slice(used);
      const args: Record<string, string> = Object.create(null);
      let failed = false;
      for (const t of rest) {
        const i = t.text.indexOf("=");
        if (i <= 0) {
          pos.push(t);
          continue;
        }
        const k = t.text.slice(0, i);
        if (!spec.keys.includes(k) || k === "__proto__" || k === "constructor" || k === "prototype") {
          err(`expected end of command (line ${no} column ${t.col})`);
          failed = true;
          break;
        }
        args[k] = t.text.slice(i + 1);
      }
      if (failed) continue;
      const maxPos = name === "ping" || name === "ip address remove" || name === "interface ethernet set" ? 1 : 0;
      if (pos.length > maxPos) {
        err(`expected end of command (line ${no} column ${pos[maxPos].col})`);
        continue;
      }
      const miss = spec.req.find((k) => args[k] === undefined || args[k] === "");
      if (miss) {
        err(`failure: missing required argument ${miss}`);
        continue;
      }
      const hasPhys = (n: string) => router.interfaces.some((i) => i.name === n);
      const hasIf = (n: string) => hasPhys(n) || router.bridges.some((b) => b.name === n);
      const macOk = (m: string) => /^([0-9a-fA-F]{2}:){5}[0-9a-fA-F]{2}$/.test(m);
      const g = (k: string) => args[k] ?? "";

      switch (name) {
        case "system identity set":
          router.identity = g("name");
          break;
        case "system identity print":
          err(`name: ${router.identity}`);
          break;
        case "interface print":
          printList(["FLAGS", "NAME", "TYPE"], router.interfaces.map((i) => [i.running ? "R" : "", i.name, "ether"]));
          break;
        case "interface ethernet print":
          printList(["NAME", "ARP"], router.interfaces.map((i) => [i.name, i.arp]));
          break;
        case "interface ethernet set": {
          const n = pos[0]?.text;
          if (n === undefined) err("failure: missing required argument name");
          else if (!["enabled", "disabled", "proxy-arp", "local-proxy-arp", "reply-only"].includes(g("arp"))) err("input does not match any value of arp");
          else if (!hasPhys(n)) err("no such item");
          else router.interfaces.find((i) => i.name === n)!.arp = g("arp");
          break;
        }
        case "ip arp add":
          if (!ip4(g("address"))) err("invalid value for argument address");
          else if (!macOk(g("mac-address"))) err("invalid value for argument mac-address");
          else if (!hasIf(g("interface"))) err("input does not match any value of interface");
          else if (router.arp.some((a) => a.address === g("address") && a.interface === g("interface"))) err("failure: already have such entry");
          else router.arp.push({ address: g("address"), macAddress: g("mac-address"), interface: g("interface") });
          break;
        case "interface bridge add":
          if (hasIf(g("name"))) err("failure: already have interface with such name");
          else router.bridges.push({ name: g("name") });
          break;
        case "interface bridge print":
          printList(["NAME"], router.bridges.map((b) => [b.name]));
          break;
        case "interface bridge port add":
          if (!router.bridges.some((b) => b.name === g("bridge"))) err("input does not match any value of bridge");
          else if (!hasPhys(g("interface"))) err("input does not match any value of interface");
          else if (router.bridgePorts.some((p) => p.interface === g("interface"))) err("failure: device already added as bridge port");
          else router.bridgePorts.push({ bridge: g("bridge"), interface: g("interface") });
          break;
        case "interface bridge port print":
          printList(["BRIDGE", "INTERFACE"], router.bridgePorts.map((p) => [p.bridge, p.interface]));
          break;
        case "ip dhcp-server lease add": {
          const mac = g("mac-address").toLowerCase();
          if (!ip4(g("address"))) err("invalid value for argument address");
          else if (!macOk(g("mac-address"))) err("invalid value for argument mac-address");
          else if (g("server") !== "" && !router.dhcpServers.some((d) => d.name === g("server"))) err("input does not match any value of server");
          else if (router.dhcpLeases.some((l) => l.address === g("address") || l.macAddress.toLowerCase() === mac)) err("failure: already have such entry");
          else router.dhcpLeases.push({ address: g("address"), macAddress: g("mac-address"), server: g("server") });
          break;
        }
        case "ip dhcp-server lease print":
          printList(["ADDRESS", "MAC-ADDRESS", "SERVER"], router.dhcpLeases.map((l) => [l.address, l.macAddress, l.server]));
          break;
        case "ip arp print":
          printList(["ADDRESS", "MAC-ADDRESS", "INTERFACE"], router.arp.map((a) => [a.address, a.macAddress, a.interface]));
          break;
        case "ip address add": {
          const c = cidr(g("address"));
          if (!c) err("invalid value for argument address");
          else if (!hasIf(g("interface"))) err("input does not match any value of interface");
          else if (router.addresses.some((a) => a.address === g("address") && a.interface === g("interface"))) err("failure: already have such address");
          else router.addresses.push({ address: g("address"), network: dotted((c.ip & maskOf(c.prefix)) >>> 0), interface: g("interface") });
          break;
        }
        case "ip address print":
          printList(["ADDRESS", "NETWORK", "INTERFACE"], router.addresses.map((a) => [a.address, a.network, a.interface]));
          break;
        case "ip address remove": {
          const n = pos[0]?.text;
          if (n === undefined) err("failure: missing required argument number");
          else if (!/^\d+$/.test(n) || Number(n) >= router.addresses.length) err("no such item");
          else router.addresses.splice(Number(n), 1);
          break;
        }
        case "ip pool add":
          router.pools.push({ name: g("name"), ranges: g("ranges") });
          break;
        case "ip pool print":
          printList(["NAME", "RANGES"], router.pools.map((p) => [p.name, p.ranges]));
          break;
        case "ip dhcp-server add":
          if (args["disabled"] !== undefined && args["disabled"] !== "yes" && args["disabled"] !== "no") err("invalid value for argument disabled");
          else if (!router.pools.some((p) => p.name === g("address-pool"))) err("input does not match any value of address-pool");
          else if (!hasIf(g("interface"))) err("input does not match any value of interface");
          else router.dhcpServers.push({ name: g("name"), interface: g("interface"), addressPool: g("address-pool"), disabled: args["disabled"] !== "no" });
          break;
        case "ip dhcp-server print":
          printList(["FLAGS", "NAME", "INTERFACE", "ADDRESS-POOL"], router.dhcpServers.map((d) => [d.disabled ? "X" : "", d.name, d.interface, d.addressPool]));
          break;
        case "ip dhcp-server network add":
          router.dhcpNetworks.push({ address: g("address"), gateway: g("gateway"), dnsServer: g("dns-server") });
          break;
        case "ip dhcp-server network print":
          printList(["ADDRESS", "GATEWAY", "DNS-SERVER"], router.dhcpNetworks.map((d) => [d.address, d.gateway, d.dnsServer]));
          break;
        case "ip firewall nat add":
          if (!["srcnat", "dstnat"].includes(g("chain"))) err("input does not match any value of chain");
          else if (!["accept", "masquerade", "dst-nat", "src-nat"].includes(g("action"))) err("input does not match any value of action");
          else router.nat.push({ chain: g("chain"), action: g("action"), outInterface: g("out-interface"), srcAddress: g("src-address") });
          break;
        case "ip firewall nat print":
          printList(["CHAIN", "ACTION", "OUT-INTERFACE", "SRC-ADDRESS"], router.nat.map((n) => [n.chain, n.action, n.outInterface, n.srcAddress]));
          break;
        case "ip route add": {
          const d = args["distance"];
          if (!cidr(g("dst-address"))) err("invalid value for argument dst-address");
          else if (ip4(g("gateway")) === null && !hasIf(g("gateway"))) err("invalid value for argument gateway");
          else if (d !== undefined && (!/^\d{1,3}$/.test(d) || Number(d) < 1 || Number(d) > 255)) err("invalid value for argument distance");
          else router.routes.push({ dstAddress: g("dst-address"), gateway: g("gateway"), distance: d === undefined ? 1 : Number(d) });
          break;
        }
        case "ip route print": {
          const rows = router.routes.map((r) => ["AS", r.dstAddress, r.gateway, String(r.distance)]);
          for (const a of router.addresses) {
            const c = cidr(a.address);
            if (c) rows.push(["DAc", `${a.network}/${c.prefix}`, a.interface, "0"]);
          }
          printList(["FLAGS", "DST-ADDRESS", "GATEWAY", "DISTANCE"], rows);
          break;
        }
        case "ip dns set": {
          const a = args["allow-remote-requests"];
          if (a !== undefined && a !== "yes" && a !== "no") {
            err("invalid value for argument allow-remote-requests");
            break;
          }
          if (args["servers"] !== undefined) router.dns.servers = g("servers").split(",").filter(Boolean);
          if (a !== undefined) router.dns.allowRemoteRequests = a === "yes";
          break;
        }
        case "ip dns print":
          err(`servers: ${router.dns.servers.join(",")}`);
          err(`allow-remote-requests: ${router.dns.allowRemoteRequests ? "yes" : "no"}`);
          break;
        case "ping": {
          const target = pos[0]?.text;
          if (target === undefined) {
            err("failure: missing required argument address");
            break;
          }
          const cs = args["count"] ?? "4";
          if (!/^\d+$/.test(cs) || Number(cs) < 1 || Number(cs) > 20) {
            err("invalid value for argument count");
            break;
          }
          const count = Number(cs);
          const t = ip4(target);
          const ok = t !== null && netCovers(t);
          for (let i = 0; i < count; i++) err(ok ? `${target} 56 64 1ms` : "timeout");
          err(`sent=${count} received=${ok ? count : 0} packet-loss=${ok ? 0 : 100}%`);
          break;
        }
      }
    }
    return { router, keluaran };
  }
  return { jalankanRouterOS };
}
