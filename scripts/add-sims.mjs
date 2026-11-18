// Adds ![judul](sim:nama) embeds to chapters, in content/drafts and (with
// --db) in the live chapters, as the dev admin. Idempotent: a chapter that
// already has the embed is skipped. Live bodies are patched in place, never
// replaced by the draft, so admin edits survive.
//
//   npm run add:sims            (drafts)   npm run add:sims -- --db
import { readFileSync, writeFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

// `before` is the heading the block goes in front of.
const ADD = [
  { topic: "administrasi-server-dan-keamanan", chapter: "peran-sysadmin-dan-infrastruktur", before: "## Kesalahan umum di tahap awal", sim: "load-balancer",
    text: "## Load balancer: membagi beban\n\nSatu server punya batas. Load balancer berdiri di depan beberapa server dan membagi request yang masuk, sehingga tidak ada server yang kewalahan. Ia juga memeriksa kesehatan server: yang mati dilewati, dan pengguna tidak menyadarinya.\n\n![Load balancer membagi request ke tiga server](sim:load-balancer)\n\nCoba matikan dua server, lalu kirim banyak request. Server yang tersisa menanggung semuanya, dan itu alasan kapasitas cadangan perlu dihitung sejak awal.\n\n" },
  { topic: "jaringan-komputer", chapter: "model-osi-dan-tcp-ip", before: "## TCP dan UDP", sim: "enkapsulasi",
    text: "![Enkapsulasi: data dibungkus header di tiap lapisan](sim:enkapsulasi)\n\n" },
  { topic: "iot-otomasi-tingkat-lanjut", chapter: "mqtt-topik-dan-wildcard", before: "## Menulis pencocok topik", sim: "mqtt-pubsub",
    text: "![Publish/subscribe lewat broker dengan filter wildcard](sim:mqtt-pubsub)\n\n" },
  { topic: "pemrograman-mikrokontroler", chapter: "adc-dan-pwm", before: "## Empat pemakaian PWM", sim: "pwm",
    text: "![PWM: duty cycle menentukan tegangan rata-rata](sim:pwm)\n\n" },
];

const patch = (body, a) => {
  if (body.includes(`](sim:${a.sim})`)) return null;
  const i = body.indexOf(`\n${a.before}\n`);
  if (i < 0) throw new Error(`${a.chapter}: anchor not found`);
  return body.slice(0, i + 1) + a.text + body.slice(i + 1);
};

// Drafts are edited as raw text so the files keep their formatting.
const esc = (t) => JSON.stringify(t).slice(1, -1);
for (const a of ADD) {
  const f = `content/drafts/${a.topic}.json`;
  const raw = readFileSync(f, "utf8");
  const key = `\\n${esc(a.before)}\\n`;
  let state = "skip";
  if (!raw.includes(`](sim:${a.sim})`)) {
    if (raw.split(key).length !== 2) throw new Error(`${a.chapter}: anchor not unique in draft`);
    writeFileSync(f, raw.replace(key, () => `\\n${esc(a.text)}${esc(a.before)}\\n`));
    state = "ok";
  }
  console.log("draft", a.chapter, state);
}

if (process.argv.includes("--db")) {
  const env = process.env;
  const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, { auth: { persistSession: false } });
  const { error: e } = await db.auth.signInWithPassword({ email: env.DEV_ADMIN_EMAIL, password: env.DEV_ADMIN_PASSWORD });
  if (e) throw new Error(`login: ${e.message}`);
  if ((await db.rpc("is_admin")).data !== true) throw new Error("not signed in as admin");
  for (const a of ADD) {
    const { data: rows, error } = await db.from("chapters").select("id, body, topics!inner(slug)").eq("slug", a.chapter).eq("topics.slug", a.topic);
    if (error) throw new Error(error.message);
    for (const r of rows) {
      const next = patch(r.body, a);
      if (next) { const { error: u } = await db.from("chapters").update({ body: next }).eq("id", r.id); if (u) throw new Error(u.message); }
      console.log("db", a.chapter, next ? "ok" : "skip");
    }
  }
}
