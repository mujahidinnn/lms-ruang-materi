// How /rpc arguments travel as JSON: FormData becomes { $form: entries }.
// Shared by the browser (lib/rpc.ts) and the endpoint (src/pages/rpc/[name].ts).
export function encodeArgs(args: unknown[]): unknown[] {
  return args.map((a) => (a instanceof FormData ? { $form: [...a].map(([k, v]) => [k, String(v)]) } : a));
}

export function decodeArgs(args: unknown[]): unknown[] {
  return args.map((a) => {
    if (a && typeof a === "object" && "$form" in a) {
      const form = new FormData();
      for (const [k, v] of (a as { $form: [string, string][] }).$form) form.append(k, v);
      return form;
    }
    return a;
  });
}

export type RpcReply = { ok: unknown; refresh?: boolean } | { redirect: string } | { error: string };
