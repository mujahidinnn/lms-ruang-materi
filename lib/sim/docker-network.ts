export type Net = "bridge" | "user";
export type Target = "name" | "ip";
export type Result = { ok: boolean; cmd: string; msg: string };

export const IP = { bridge: { web: "172.17.0.2", db: "172.17.0.3" }, user: { web: "172.20.0.2", db: "172.20.0.3" } } as const;

// web -> db, both containers share the chosen network.
export function webToDb(net: Net, by: Target): Result {
  if (by === "ip") {
    const ip = IP[net].db;
    return { ok: true, cmd: `docker exec web ping -c1 ${ip}`, msg: `Berhasil: 64 bytes from ${ip}. Lewat IP selalu bisa, tetapi IP berubah saat container dibuat ulang.` };
  }
  return net === "user"
    ? { ok: true, cmd: "docker exec web ping -c1 db", msg: `Berhasil: db diterjemahkan menjadi ${IP.user.db} oleh DNS internal Docker.` }
    : { ok: false, cmd: "docker exec web ping -c1 db", msg: "Gagal: ping: bad address 'db'. Network bridge bawaan tidak punya DNS nama container." };
}

// host -> web:80, only reachable through a published port.
export function hostToWeb(published: boolean): Result {
  return published
    ? { ok: true, cmd: "curl http://localhost:8080", msg: "Berhasil: HTTP 200. Port 8080 host diteruskan ke port 80 container." }
    : { ok: false, cmd: "curl http://localhost:8080", msg: "Gagal: Connection refused. Tanpa -p, port container tidak terbuka di host." };
}

export const commands = (net: Net, published: boolean) => {
  const n = net === "user" ? " --network app-net" : "";
  const p = published ? " -p 8080:80" : "";
  return [
    ...(net === "user" ? ["docker network create app-net"] : []),
    `docker run -d --name db${n} postgres:17-alpine`,
    `docker run -d --name web${n}${p} nginx:alpine`,
  ];
};
