import { ArrowUpRight } from "lucide-react";

// The indigo circle with an arrow in a tile's corner: "this opens".
export default function ArrowBadge({ className = "" }: { className?: string }) {
  return (
    <span aria-hidden className={`grid size-11 shrink-0 place-items-center rounded-full bg-primary text-on-primary transition-transform group-hover:rotate-45 motion-reduce:transition-none ${className}`}>
      <ArrowUpRight className="size-5" />
    </span>
  );
}
