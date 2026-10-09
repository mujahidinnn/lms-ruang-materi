export default function PageBackdrop() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
    >
      <div className="bg-dot-grid absolute inset-0 opacity-[0.08] [mask-image:linear-gradient(to_bottom,transparent,black_8%,black_92%,transparent)]" />
      <div className="bg-glow absolute -top-40 left-1/4 h-[32rem] w-[32rem] opacity-[0.16]" />
      <div className="bg-glow absolute top-[45%] -right-32 h-[32rem] w-[32rem] opacity-10" />
      <div className="bg-glow absolute bottom-[-10%] left-1/3 h-[32rem] w-[32rem] opacity-[0.16]" />
    </div>
  );
}
