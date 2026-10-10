export default function PageBackdrop() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
    >
      <div className="bg-dot-grid absolute inset-0 opacity-[0.08] [mask-image:linear-gradient(to_bottom,transparent,black_8%,black_92%,transparent)]" />
    </div>
  );
}
