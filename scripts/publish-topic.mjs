// Publishes a drafted topic as the dev admin, the same RPC as "Terbitkan" in
// /admin/topik, and optionally places it on a roadmap after another topic:
//
//   npm run publish:topic -- expressjs --track backend-dasar --after nodejs
//
// The placement adds a node right after --after (later nodes shift by one),
// an edge from that node, and republishes the track.
import { createClient } from "@supabase/supabase-js";
import { steadyFetch } from "../lib/steady-fetch.ts";

const env = process.env;
const args = process.argv.slice(2);
const opt = (name) => (args.includes(name) ? args[args.indexOf(name) + 1] : undefined);
const slug = args.find((a, i) => !a.startsWith("--") && !args[i - 1]?.startsWith("--"));
if (!slug) throw new Error("usage: publish:topic -- <slug> [--track <slug> --after <slug>]");

const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, { auth: { persistSession: false }, global: { fetch: steadyFetch } });
const { error: loginError } = await db.auth.signInWithPassword({ email: env.DEV_ADMIN_EMAIL, password: env.DEV_ADMIN_PASSWORD });
if (loginError) throw new Error(`login: ${loginError.message}`);
// A failed sign-in would otherwise run every call below as anon.
const { data: admin } = await db.rpc("is_admin");
if (admin !== true) throw new Error("not signed in as admin");

const { error } = await db.rpc("publish_topic", { p_slug: slug });
if (error) throw new Error(`publish_topic: ${error.message}`);
console.log(slug, "terbit");

const track = opt("--track");
const after = opt("--after");
if (track && after) {
  const { data: t } = await db.from("tracks").select("id, track_nodes(id, position, topics(slug))").eq("slug", track).single();
  if (!t) throw new Error(`track ${track} tidak ditemukan`);
  const nodes = t.track_nodes.toSorted((a, b) => a.position - b.position);
  const prev = nodes.find((n) => n.topics?.slug === after);
  if (!prev) throw new Error(`${after} tidak ada di ${track}`);
  if (nodes.some((n) => n.topics?.slug === slug)) {
    console.log(slug, "sudah ada di", track);
  } else {
    for (const n of nodes.filter((n) => n.position > prev.position).toReversed()) {
      const { error: e } = await db.from("track_nodes").update({ position: n.position + 1, status: "draft" }).eq("id", n.id);
      if (e) throw new Error(`shift: ${e.message}`);
    }
    const { data: topic } = await db.from("topics").select("id").eq("slug", slug).single();
    const { data: node, error: e1 } = await db.from("track_nodes").insert({ track_id: t.id, topic_id: topic.id, position: prev.position + 1 }).select("id").single();
    if (e1) throw new Error(`node: ${e1.message}`);
    const { error: e2 } = await db.from("track_edges").insert({ from_node_id: prev.id, to_node_id: node.id });
    if (e2) throw new Error(`edge: ${e2.message}`);
    console.log(slug, "masuk", track, "setelah", after);
  }
  const { error: e3 } = await db.rpc("publish_track", { p_slug: track });
  if (e3) throw new Error(`publish_track: ${e3.message}`);
  console.log(track, "terbit ulang");
}
