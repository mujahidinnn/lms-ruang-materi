// The eight stages every Studio project moves through, in order.
export const STAGES = [
  { id: "brief", title: "Brief" },
  { id: "brainstorming", title: "Brainstorming" },
  { id: "teknologi", title: "Memilih teknologi" },
  { id: "merancang", title: "Merancang" },
  { id: "ngoding", title: "Ngoding dan debugging" },
  { id: "uji", title: "Uji end-to-end" },
  { id: "deploy", title: "Deploy dan online" },
  { id: "dokumentasi", title: "Dokumentasi dan portofolio" },
] as const;
export type StageId = (typeof STAGES)[number]["id"];
export const STAGE_IDS = STAGES.map((s) => s.id) as [StageId, ...StageId[]];
export const stageTitle = (id: string) => STAGES.find((s) => s.id === id)?.title ?? id;
export const stageIndex = (id: string) => STAGES.findIndex((s) => s.id === id);

export const STUDIO_FEATURE = "studio-proyek";
export const LEVELS = { pemula: "Pemula", menengah: "Menengah", lanjut: "Lanjut", pro: "Pro" } as const;
