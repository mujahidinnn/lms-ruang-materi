// Class strings shared by more than one feature (GUIDELINE, Style).

const focus = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

// The one main action on a screen: an ink pill.
export const primaryButton =
  `inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-zinc-50 px-6 font-semibold text-zinc-950 transition-colors hover:bg-zinc-300 disabled:opacity-50 ${focus}`;

// Everything else: a white pill on the canvas.
export const secondaryButton =
  `inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-zinc-900 px-5 text-sm font-medium text-zinc-50 shadow-soft transition-colors hover:bg-zinc-800 disabled:opacity-50 ${focus}`;

// Round icon button, white on the canvas.
export const iconButton =
  `grid size-11 shrink-0 place-items-center rounded-full bg-zinc-900 text-zinc-300 shadow-soft transition-colors hover:text-zinc-50 ${focus}`;

// A white surface on the lavender canvas.
export const card = "rounded-[28px] bg-zinc-900 shadow-soft";

// Pill chip for counts, filters and small states. Pass the background:
// chip + " bg-tile-mint", or mutedChip for the plain grey one.
export const chip = "inline-flex min-h-8 items-center gap-1.5 rounded-full px-3 text-xs font-medium text-zinc-300";
export const mutedChip = `${chip} bg-zinc-800`;

// Pastel tiles, handed out in turn so neighbours differ.
const TILES = ["bg-tile-lavender", "bg-tile-mint", "bg-tile-butter", "bg-tile-pink", "bg-tile-sky", "bg-tile-peach"];
export const tile = (i: number) => TILES[i % TILES.length];
