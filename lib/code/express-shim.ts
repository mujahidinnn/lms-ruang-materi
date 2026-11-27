// A tiny Express for exercises: enough of app/req/res to write and test
// route handlers. Self-contained (no imports, no outer references) so its
// source can be injected into the browser sandbox as text.
export function expressShim() {
  type Req = { method: string; path: string; params: Record<string, string>; query: Record<string, string>; body: unknown; headers: Record<string, string> };
  type Res = { status(s: number): Res; json(v: unknown): Res; send(v: unknown): Res; sendStatus(s: number): Res; end(): Res; set(k: string, v: string): Res; header(k: string, v: string): Res; setHeader(k: string, v: string): Res };
  type Handler = (req: Req, res: Res, next: () => void) => unknown;
  type Route = (path: string, ...handlers: Handler[]) => App;
  type App = { use(fn: Handler): App; listen(port?: number, cb?: () => void): App; get: Route; post: Route; put: Route; patch: Route; delete: Route };
  const routes: { method: string; parts: string[]; handlers: Handler[] }[] = [];
  const middleware: Handler[] = [];
  const split = (p: string) => p.split("/").filter(Boolean);

  function express() {
    const route = (method: string): Route => (path, ...handlers) => (routes.push({ method, parts: split(path), handlers }), app);
    const app: App = {
      use: (fn) => (middleware.push(fn), app),
      listen: (_port, cb) => (cb?.(), app),
      get: route("GET"),
      post: route("POST"),
      put: route("PUT"),
      patch: route("PATCH"),
      delete: route("DELETE"),
    };
    return app;
  }
  express.json = () => (_req: unknown, _res: unknown, next: () => void) => next();

  // headers: request headers (any case); a response carries `headers` only when the handler set some.
  async function request(method: string, path: string, body?: unknown, headers: Record<string, string> = {}) {
    const [pathname, search = ""] = path.split("?");
    // Parsed by hand: the Node check runner's vm context has no URLSearchParams.
    const query = Object.fromEntries(
      search.split("&").filter(Boolean).map((kv) => kv.split("=").map((x) => decodeURIComponent(x.replace(/\+/g, " "))) as [string, string])
    );
    const parts = split(pathname);
    for (const r of routes) {
      if (r.method !== method.toUpperCase() || r.parts.length !== parts.length) continue;
      const params: Record<string, string> = {};
      const match = r.parts.every((p, i) => (p.startsWith(":") ? ((params[p.slice(1)] = decodeURIComponent(parts[i])), true) : p === parts[i]));
      if (!match) continue;
      let status = 200;
      let sent: unknown;
      let done = false;
      const out: Record<string, string> = {};
      const set = (k: string, v: string) => ((out[k.toLowerCase()] = String(v)), res);
      const res: Res = {
        status: (s: number) => ((status = s), res),
        json: (v: unknown) => ((sent = v), (done = true), res),
        send: (v: unknown) => ((sent = v), (done = true), res),
        sendStatus: (s: number) => ((status = s), (sent = String(s)), (done = true), res),
        end: () => ((done = true), res),
        set,
        header: set,
        setHeader: set,
      };
      const req: Req = { method: method.toUpperCase(), path: pathname, params, query, body: body ?? {}, headers: Object.fromEntries(Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v])) };
      for (const fn of [...middleware, ...r.handlers]) {
        let next = false;
        await fn(req, res, () => (next = true));
        if (done || !next) break;
      }
      return Object.keys(out).length ? { status, body: sent, headers: out } : { status, body: sent };
    }
    return { status: 404, body: "Not Found" };
  }

  const mod = { exports: {} as unknown };
  const require = (name: string): typeof express => {
    if (name === "express") return express;
    throw new Error(`Modul ${name} tidak tersedia di latihan ini`);
  };
  return { require, request, module: mod };
}
