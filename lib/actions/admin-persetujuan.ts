import { z } from "zod";
import { ACTIONS, type ActionName } from "@/lib/actions";
import { audit } from "@/lib/audit";
import { APPROVER, requireUser } from "@/lib/dal";
import { NotFound, Redirect, notFound, refresh } from "@/lib/request";
import { decodeArgs } from "@/lib/rpc-wire";
import { createClient } from "@/lib/supabase/server";

type State = { error?: string; ok?: string };
type Row = { id: number; action: string; args: unknown[]; requested_email: string };

const id = z.coerce.number().int().positive();

async function approver() {
  const user = await requireUser("/admin/persetujuan");
  if (user.email !== APPROVER) notFound();
  return user;
}

// Moves one pending row to its decision; null when someone already decided,
// so a double click never runs the change twice.
async function claim(form: FormData, status: "approved" | "rejected", note = "") {
  const { data } = await (await createClient())
    .from("admin_approvals")
    .update({ status, note: note.slice(0, 300), decided_at: new Date().toISOString() })
    .eq("id", id.parse(form.get("id")))
    .eq("status", "pending")
    .select("id, action, args, requested_email")
    .maybeSingle();
  refresh();
  return data as Row | null;
}

async function fail(row: Row, note: string): Promise<State> {
  await (await createClient()).from("admin_approvals").update({ status: "failed", note: note.slice(0, 300) }).eq("id", row.id);
  return { error: `Gagal dijalankan: ${note}` };
}

// Runs the stored call as the approver, so requireAdmin lets it through.
export async function setujuiPerubahan(_: State, form: FormData): Promise<State> {
  const user = await approver();
  const row = await claim(form, "approved");
  if (!row) return { error: "Sudah diputuskan." };
  const fn = Object.hasOwn(ACTIONS, row.action) ? (ACTIONS[row.action as ActionName] as (...a: unknown[]) => Promise<unknown>) : null;
  if (!fn) return fail(row, "aksi tidak dikenal.");
  try {
    const out = (await fn(...decodeArgs(row.args))) as State | null;
    if (out && typeof out === "object" && out.error) return fail(row, out.error);
  } catch (e) {
    if (!(e instanceof Redirect) && !(e instanceof NotFound)) return fail(row, e instanceof Error ? e.message : "kesalahan server.");
  }
  await audit(user, "Setujui perubahan", `${row.action} dari ${row.requested_email}`, [["Aksi", row.action], ["Diminta oleh", row.requested_email], ["Nomor permintaan", String(row.id)]]);
  return { ok: "Disetujui dan dijalankan." };
}

export async function tolakPerubahan(_: State, form: FormData): Promise<State> {
  const user = await approver();
  const row = await claim(form, "rejected", String(form.get("note") ?? ""));
  if (!row) return { error: "Sudah diputuskan." };
  await audit(user, "Tolak perubahan", `${row.action} dari ${row.requested_email}`, [["Aksi", row.action], ["Diminta oleh", row.requested_email], ["Nomor permintaan", String(row.id)], ["Alasan", String(form.get("note") ?? "")]]);
  return { ok: "Ditolak." };
}
