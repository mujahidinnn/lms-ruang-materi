import { CircleCheck, CircleDashed } from "lucide-react";

export default function StatusBadge({ status }: { status: string }) {
  const draft = status === "draft";
  const Icon = draft ? CircleDashed : CircleCheck;
  return (
    <span className={`inline-flex items-center gap-1 text-xs ${draft ? "text-zinc-400" : "text-accent"}`}>
      <Icon aria-hidden className="size-3.5" />
      {draft ? "Draf" : "Terbit"}
    </span>
  );
}
