// Builds supabase/templates/*.html (one shared layout, black/white/matcha like
// the app) and pushes them to the hosted project's Auth config.
//   node --env-file=.env.local scripts/email-templates.mjs [--push]
import { mkdirSync, writeFileSync } from "node:fs";

const REF = "uxvjbadahlfzslhzobpu";
const SITE = "https://ruang-materi.mujahidin.my.id";
const link = (type) => `{{ .SiteURL }}/masuk/callback?token_hash={{ .TokenHash }}&type=${type}`;

import { emailLayout } from "../lib/email-layout.mjs";

const ignore = "Tidak meminta email ini? Abaikan saja, akunmu tetap aman.";
const secure = "Bukan kamu yang melakukannya? Segera ganti kata sandi dan hubungi kami.";

// key = Supabase config suffix, file = supabase/templates name (config.toml).
const T = {
  magic_link: { file: "magic_link", subject: "Masuk ke Ruang Materi", chip: "Masuk", title: "Masuk ke Ruang Materi",
    intro: "Klik tombol di bawah untuk masuk. Tautan bisa dibuka di perangkat mana pun.",
    button: { label: "Masuk sekarang", url: link("email") }, meta: ["Berlaku 1 jam", "Sekali pakai"], fallback: true, note: ignore },
  confirmation: { file: "confirmation", subject: "Konfirmasi email kamu di Ruang Materi", chip: "Selamat datang", title: "Satu langkah lagi",
    intro: "Terima kasih sudah mendaftar. Konfirmasi emailmu supaya progres belajarmu tersimpan.",
    button: { label: "Konfirmasi email", url: link("email") }, meta: ["Berlaku 24 jam"], fallback: true, note: ignore },
  recovery: { file: "recovery", subject: "Buat kata sandi baru Ruang Materi", chip: "Kata sandi", title: "Buat kata sandi baru",
    intro: "Kami menerima permintaan untuk mengatur ulang kata sandimu. Klik tombol untuk membuat yang baru.",
    button: { label: "Buat kata sandi baru", url: link("recovery") }, meta: ["Berlaku 1 jam", "Sekali pakai"], fallback: true, note: ignore },
  email_change: { file: "email_change", subject: "Konfirmasi email baru Ruang Materi", chip: "Ganti email", title: "Konfirmasi email baru",
    intro: "Kamu meminta mengganti email akun ke <strong style=\"color:#ffffff;\">{{ .NewEmail }}</strong>. Konfirmasi supaya perubahannya berlaku.",
    button: { label: "Konfirmasi email baru", url: link("email_change") }, meta: ["Berlaku 24 jam"], fallback: true, note: ignore },
  invite: { file: "invite", subject: "Kamu diundang ke Ruang Materi", chip: "Undangan", title: "Kamu diundang bergabung",
    intro: "Seseorang mengundangmu belajar di Ruang Materi. Terima undangan untuk membuat akunmu.",
    button: { label: "Terima undangan", url: link("invite") }, meta: ["Berlaku 24 jam"], fallback: true, note: ignore },
  reauthentication: { file: "reauthentication", subject: "Kode verifikasi Ruang Materi", chip: "Verifikasi", title: "Kode verifikasimu",
    intro: "Masukkan kode ini untuk melanjutkan. Jangan bagikan ke siapa pun.", code: "{{ .Token }}", meta: ["Berlaku sebentar"], note: ignore },
  password_changed_notification: { file: "password_changed", subject: "Kata sandimu diganti", chip: "Keamanan akun", tone: "warn", title: "Kata sandimu diganti",
    intro: "Kata sandi akun <strong style=\"color:#ffffff;\">{{ .Email }}</strong> baru saja diganti.", button: { label: "Amankan akunku", url: SITE + "/profil#sandi" }, note: secure },
  email_changed_notification: { file: "email_changed", subject: "Email akunmu diganti", chip: "Keamanan akun", tone: "warn", title: "Email akunmu diganti",
    intro: "Email akunmu diganti dari <strong style=\"color:#ffffff;\">{{ .OldEmail }}</strong> ke <strong style=\"color:#ffffff;\">{{ .Email }}</strong>.", button: { label: "Amankan akunku", url: SITE + "/profil#sandi" }, note: secure },
  phone_changed_notification: { file: "phone_changed", subject: "Nomor telepon akunmu diganti", chip: "Keamanan akun", tone: "warn", title: "Nomor telepon diganti",
    intro: "Nomor telepon akun <strong style=\"color:#ffffff;\">{{ .Email }}</strong> baru saja diganti.", button: { label: "Amankan akunku", url: SITE + "/profil#sandi" }, note: secure },
  mfa_factor_enrolled_notification: { file: "mfa_enrolled", subject: "Metode verifikasi baru ditambahkan", chip: "Keamanan akun", tone: "warn", title: "Metode verifikasi baru",
    intro: "Metode verifikasi {{ .FactorType }} ditambahkan ke akun <strong style=\"color:#ffffff;\">{{ .Email }}</strong>.", button: { label: "Amankan akunku", url: SITE + "/profil#sandi" }, note: secure },
  mfa_factor_unenrolled_notification: { file: "mfa_unenrolled", subject: "Metode verifikasi dihapus", chip: "Keamanan akun", tone: "warn", title: "Metode verifikasi dihapus",
    intro: "Metode verifikasi {{ .FactorType }} dihapus dari akun <strong style=\"color:#ffffff;\">{{ .Email }}</strong>.", button: { label: "Amankan akunku", url: SITE + "/profil#sandi" }, note: secure },
  identity_linked_notification: { file: "identity_linked", subject: "Metode masuk baru ditautkan", chip: "Keamanan akun", tone: "warn", title: "Metode masuk baru",
    intro: "Metode masuk {{ .Provider }} ditautkan ke akun <strong style=\"color:#ffffff;\">{{ .Email }}</strong>.", button: { label: "Amankan akunku", url: SITE + "/profil#sandi" }, note: secure },
  identity_unlinked_notification: { file: "identity_unlinked", subject: "Metode masuk dilepas", chip: "Keamanan akun", tone: "warn", title: "Metode masuk dilepas",
    intro: "Metode masuk {{ .Provider }} dilepas dari akun <strong style=\"color:#ffffff;\">{{ .Email }}</strong>.", button: { label: "Amankan akunku", url: SITE + "/profil#sandi" }, note: secure },
};

mkdirSync("supabase/templates", { recursive: true });
const payload = {};
for (const [key, t] of Object.entries(T)) {
  const html = emailLayout({ site: SITE, title: t.title, intro: t.intro, chip: t.chip, tone: t.tone, button: t.button, code: t.code, meta: t.meta, fallback: t.fallback, footnote: t.note });
  writeFileSync(`supabase/templates/${t.file}.html`, html);
  payload[`mailer_subjects_${key}`] = t.subject;
  payload[`mailer_templates_${key}_content`] = html;
}

if (process.argv.includes("--push")) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${REF}/config/auth`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${process.env.SUPABASE_ACCESS_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  console.log("PATCH", res.status, res.ok ? "" : await res.text());
}
