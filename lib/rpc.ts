import type { ActionName, Actions } from "@/lib/actions";
import { encodeArgs, type RpcReply } from "@/lib/rpc-wire";

// The browser side of a server action: the same signature, run on the server
// through POST /rpc/<name>. A redirect() there navigates here; refresh()
// there reloads the page once the call is done.
export function rpc<K extends ActionName>(name: K): Actions[K] {
  return (async (...args: unknown[]) => {
    const res = await fetch(`/rpc/${name}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(encodeArgs(args)),
    });
    if (res.status === 404) throw new Error("Tidak ditemukan.");
    const reply = (await res.json()) as RpcReply;
    if ("redirect" in reply) {
      location.assign(reply.redirect);
      return new Promise(() => {});
    }
    if ("error" in reply) throw new Error(reply.error);
    if (reply.refresh) setTimeout(() => location.reload(), 0);
    return reply.ok;
  }) as Actions[K];
}
