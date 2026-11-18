import { createClient } from "@/lib/supabase/server";

export type Person = {
  id: string;
  name: string;
  email: string;
  admin: boolean;
  me: boolean;
  pending: boolean; // invited, not accepted yet
  provider: string;
  avatar: string | null;
  joined: string;
  joinedAt: number;
  seen: string;
  seenFull: string;
  online: boolean;
  seenAt: number;
  referredBy: string | null;
  invited: number;
};

type Row = {
  user_id: string;
  email: string;
  display_name: string | null;
  role: "student" | "admin";
  provider: string;
  avatar_url: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  last_active_at: string | null;
  confirmed: boolean;
  referred_by_name: string | null;
  referral_count: number;
};

const fmt = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Asia/Jakarta",
});
const stamp = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Jakarta",
});
const day = (d: Date) => Math.floor((d.getTime() + 7 * 36e5) / 864e5); // WIB calendar day
function ago(iso: string | null) {
  if (!iso) return "Belum pernah masuk";
  const at = new Date(iso);
  const min = Math.floor((Date.now() - at.getTime()) / 6e4);
  if (min < 5) return "Baru saja aktif";
  if (min < 60) return `${min} menit lalu`;
  if (min < 60 * 6) return `${Math.floor(min / 60)} jam lalu`;
  const n = day(new Date()) - day(at);
  return n <= 0
    ? "Hari ini"
    : n === 1
      ? "Kemarin"
      : n < 30
        ? `${n} hari lalu`
        : fmt.format(at);
}

export async function loadPeople(meId: string): Promise<Person[]> {
  const { data } = await (await createClient()).rpc("admin_users");
  return ((data ?? []) as Row[]).map((r) => ({
    id: r.user_id,
    name: r.display_name || r.email.split("@")[0],
    email: r.email,
    admin: r.role === "admin",
    me: r.user_id === meId,
    pending: !r.confirmed,
    provider: r.provider,
    avatar: r.avatar_url,
    joined: fmt.format(new Date(r.created_at)),
    joinedAt: Date.parse(r.created_at),
    seen: ago(r.last_active_at ?? r.last_sign_in_at),
    seenFull: r.last_active_at ? stamp.format(new Date(r.last_active_at)) : "",
    online:
      !!r.last_active_at && Date.now() - Date.parse(r.last_active_at) < 6 * 6e4,
    seenAt: r.last_active_at ? Date.parse(r.last_active_at) : 0,
    referredBy: r.referred_by_name,
    invited: r.referral_count,
  }));
}
