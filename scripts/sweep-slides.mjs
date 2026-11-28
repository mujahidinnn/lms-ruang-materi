// Removes slide folders in the `slides` bucket that no slides row points at:
// left behind by a deleted class, a re-import or a restyle. Folders with a
// file younger than a day are kept (an import or restyle may still be
// writing). Dry run by default; --hapus deletes. Needs SUPABASE_SERVICE_ROLE_KEY.
//
//   node --env-file=.env.local scripts/sweep-slides.mjs [--hapus]
import { createClient } from "@supabase/supabase-js";

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const del = process.argv.includes("--hapus");
const bucket = db.storage.from("slides");

async function list(prefix) {
  const out = [];
  for (let offset = 0; ; offset += 1000) {
    let data, error;
    for (let t = 0; t < 4; t++) { // long sweeps hit the odd "fetch failed"
      ({ data, error } = await bucket.list(prefix, { limit: 1000, offset }));
      if (!error) break;
      await new Promise((r) => setTimeout(r, 2000 * (t + 1)));
    }
    if (error) throw new Error(`${prefix}: ${error.message}`);
    out.push(...data);
    if (data.length < 1000) return out;
  }
}

const { data: rows, error } = await db.from("slides").select("path");
if (error) throw error;
const used = new Set(rows.map((r) => r.path.slice(0, r.path.lastIndexOf("/"))));
if (!used.size) throw new Error("slides kosong, berhenti supaya tidak menghapus semuanya");

const dayAgo = Date.now() - 864e5;
let files = 0;
for (const top of await list("")) {
  if (top.id) continue; // a file at the root, not a folder
  for (const sub of await list(top.name)) {
    if (sub.id) continue;
    const folder = `${top.name}/${sub.name}`;
    if (used.has(folder)) continue;
    const objs = (await list(folder)).filter((o) => o.id);
    if (objs.some((o) => new Date(o.updated_at ?? o.created_at).getTime() > dayAgo)) {
      console.log(`lewati ${folder} (berkas baru)`);
      continue;
    }
    files += objs.length;
    console.log(`${del ? "hapus" : "akan dihapus"} ${folder} (${objs.length} berkas)`);
    for (let i = 0; del && i < objs.length; i += 100) {
      const { error } = await bucket.remove(objs.slice(i, i + 100).map((o) => `${folder}/${o.name}`));
      if (error) throw new Error(`${folder}: ${error.message}`);
    }
  }
}
console.log(`${files} berkas ${del ? "dihapus" : "yatim; jalankan dengan --hapus untuk menghapus"}`);
