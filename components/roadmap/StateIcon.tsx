import { Check, Circle, CircleDot, Minus } from "lucide-react";
import type { NodeState } from "@/lib/roadmap";

// Shape carries the state too, never color alone.
export default function StateIcon({ state }: { state: NodeState }) {
  const cls = "size-4 shrink-0";
  if (state === "selesai") return <Check aria-hidden className={`${cls} text-accent`} strokeWidth={3} />;
  if (state === "sedang") return <CircleDot aria-hidden className={`${cls} text-accent`} />;
  if (state === "dilewati") return <Minus aria-hidden className={`${cls} text-zinc-500`} />;
  return <Circle aria-hidden className={`${cls} text-zinc-600`} />;
}
