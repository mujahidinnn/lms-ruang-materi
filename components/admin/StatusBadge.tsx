export default function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`w-fit rounded-md px-2 py-0.5 text-xs ${status === "draft" ? "bg-zinc-800 text-zinc-300" : "bg-accent/15 text-accent"}`}>
      {status === "draft" ? "draf" : "terbit"}
    </span>
  );
}
