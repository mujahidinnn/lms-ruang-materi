// GitHub Flow: alur tim (branch) dan alur kontributor luar (fork). Murni, tanpa DOM.
export type Alur = "tim" | "fork";
export type Aksi = "fork" | "branch" | "commit" | "push" | "pr" | "approve" | "minta" | "merge" | "hapus";
export type Pr = "belum" | "terbuka" | "perubahan" | "disetujui" | "merged";
export type Keadaan = { alur: Alur; fork: boolean; branch: boolean; commit: number; belumPush: number; pr: Pr; mainCommit: number; riwayat: Aksi[] };

export const MAKS_COMMIT = 3;
export const NAMA: Record<Aksi, string> = {
  fork: "Fork repo asli", branch: "Buat branch", commit: "Commit", push: "Push", pr: "Buka pull request",
  approve: "Review: approve", minta: "Review: minta perubahan", merge: "Merge", hapus: "Hapus branch",
};
export const NAMA_PR: Record<Pr, string> = { belum: "belum ada PR", terbuka: "terbuka, menunggu review", perubahan: "perlu perubahan", disetujui: "disetujui, siap merge", merged: "merged" };

export const awal = (alur: Alur): Keadaan => ({ alur, fork: false, branch: false, commit: 0, belumPush: 0, pr: "belum", mainCommit: 1, riwayat: [] });

export function tersedia(k: Keadaan): Aksi[] {
  const a: Aksi[] = [];
  if (k.alur === "fork" && !k.fork) return ["fork"];
  if (!k.branch) return ["branch"];
  const buka = k.pr !== "merged";
  if (buka && k.pr !== "disetujui" && k.commit < MAKS_COMMIT) a.push("commit");
  if (buka && k.belumPush > 0) a.push("push");
  if (k.pr === "belum" && k.commit > 0 && k.belumPush === 0) a.push("pr");
  if (k.pr === "terbuka") a.push("approve", "minta");
  if (k.pr === "disetujui" && k.belumPush === 0) a.push("merge");
  if (k.pr === "merged") a.push("hapus");
  return a;
}

export function terapkan(k: Keadaan, a: Aksi): Keadaan {
  if (!tersedia(k).includes(a)) return k;
  const n = { ...k, riwayat: [...k.riwayat, a] };
  if (a === "fork") n.fork = true;
  if (a === "branch") n.branch = true;
  if (a === "commit") { n.commit++; n.belumPush++; }
  if (a === "push") { n.belumPush = 0; if (k.pr === "perubahan") n.pr = "terbuka"; }
  if (a === "pr") n.pr = "terbuka";
  if (a === "approve") n.pr = "disetujui";
  if (a === "minta") n.pr = "perubahan";
  if (a === "merge") { n.pr = "merged"; n.mainCommit = k.mainCommit + k.commit + 1; } // commit branch + satu merge commit
  if (a === "hapus") n.branch = false;
  return n;
}

export function catatan(k: Keadaan): string {
  const tujuan = k.alur === "fork" ? "fork-mu" : "origin";
  const t: Record<Aksi, string> = {
    fork: "Salinan repo asli kini ada di akunmu. Kamu punya akses tulis ke fork, bukan ke repo asli.",
    branch: `Branch fitur dibuat dari main. Main tidak berubah: masih ${k.mainCommit} commit.`,
    commit: `Commit ke-${k.commit} ada di branch fitur, baru di laptop. Main tetap ${k.mainCommit} commit.`,
    push: k.pr === "perubahan" ? `Perbaikan di-push ke ${tujuan}. PR memuat commit baru dan kembali menunggu review.` : `Commit dikirim ke ${tujuan}. Di GitHub branch fitur sudah terlihat, main belum berubah.`,
    pr: k.alur === "fork" ? "PR terbuka dari branch di fork ke main repo asli. Pengelola bisa meninjau dan memberi komentar." : "PR terbuka dari branch fitur ke main. Reviewer bisa memberi komentar baris dan CI berjalan.",
    approve: "Reviewer menyetujui. Tombol merge siap dipakai.",
    minta: "Reviewer meminta perubahan. Merge terblokir sampai kamu commit perbaikan dan push ke branch yang sama.",
    merge: `Branch digabung ke main${k.alur === "fork" ? " repo asli" : ""}: main kini ${k.mainCommit} commit (${k.commit} commit fitur + 1 merge commit).`,
    hapus: "Branch fitur dihapus. Riwayat tetap ada di main, dan PR tetap bisa dibuka lagi untuk dibaca.",
  };
  const last = k.riwayat[k.riwayat.length - 1];
  if (!last) return k.alur === "fork" ? "Kamu kontributor luar tanpa akses tulis ke repo asli. Mulai dengan fork." : "Kamu anggota tim dengan akses tulis. Main berisi 1 commit. Mulai dengan membuat branch.";
  return t[last];
}
