import type { APIRoute } from "astro";
import { ACTIONS, type ActionName } from "@/lib/actions";
import { currentRequest, NotFound, Redirect } from "@/lib/request";
import { decodeArgs, type RpcReply } from "@/lib/rpc-wire";
import { safeNext } from "@/lib/safe-next";

// Runs one function from lib/actions. JSON bodies come from lib/rpc.ts and
// get a JSON reply. Plain HTML form posts (no JS yet) get a 303 back to the
// page, or to wherever the action redirected.
export const POST: APIRoute = async ({ params, request, url }) => {
  const fn = Object.hasOwn(ACTIONS, params.name ?? "") ? (ACTIONS[params.name as ActionName] as (...a: unknown[]) => Promise<unknown>) : null;
  if (!fn) return new Response(null, { status: 404 });
  // Astro's checkOrigin covers form posts; JSON gets the same check here.
  if (request.headers.get("origin") !== url.origin) return new Response(null, { status: 403 });

  const json = request.headers.get("content-type")?.startsWith("application/json");
  const ref = new URL(request.headers.get("referer") ?? "/", url);
  const back = ref.origin === url.origin ? safeNext(ref.pathname + ref.search) : "/";
  let reply: RpcReply;
  try {
    const args = json ? decodeArgs(await request.json()) : fn.length >= 2 ? [undefined, await request.formData()] : [await request.formData()];
    reply = { ok: (await fn(...args)) ?? null, refresh: currentRequest().refresh };
  } catch (e) {
    if (e instanceof NotFound) return new Response(null, { status: 404 });
    if (!(e instanceof Redirect)) {
      console.error(`rpc ${params.name}`, e);
      reply = { error: "Terjadi kesalahan di server. Coba lagi." };
    } else reply = { redirect: e.to };
  }
  if (!json) return new Response(null, { status: 303, headers: { location: "redirect" in reply ? reply.redirect : back } });
  return Response.json(reply);
};
