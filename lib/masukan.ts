// Feedback categories, shared by the form, the action and the admin inbox.
export const MASUKAN = [
  { id: "saran", label: "Saran fitur", hint: "Ide untuk fitur atau kelas baru" },
  { id: "bug", label: "Ada yang error", hint: "Sesuatu rusak atau tidak jalan" },
  { id: "konten", label: "Materi", hint: "Topik yang ingin ditambah atau diperbaiki" },
  { id: "tampilan", label: "Tampilan", hint: "Kesulitan memakai atau kurang nyaman dilihat" },
  { id: "lainnya", label: "Lainnya", hint: "Pujian, kritik, atau hal lain" },
] as const;
export type MasukanId = (typeof MASUKAN)[number]["id"];
export const MASUKAN_IDS = MASUKAN.map((m) => m.id) as [MasukanId, ...MasukanId[]];
