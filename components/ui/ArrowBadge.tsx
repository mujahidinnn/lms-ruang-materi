import { ArrowUpRight } from "lucide-react";

// The ink circle with an arrow in a tile's corner: "this opens".
export default function ArrowBadge({ className = "" }: { className?: string }) {
  return (
    <span aria-hidden className={`grid size-11 shrink-0 place-items-center rounded-full bg-zinc-50 text-zinc-950 transition-transform group-hover:rotate-45 motion-reduce:transition-none ${className}`}>
      <ArrowUpRight className="size-5" />
    </span>
  );
}
