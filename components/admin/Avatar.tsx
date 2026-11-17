// Profile photo, or the first letter on a tile when there is none. Only
// https photos are used, and no referrer is sent to the photo host.
export default function Avatar({ name, src, admin = false, className = "size-11 text-base" }: { name: string; src?: string | null; admin?: boolean; className?: string }) {
  if (src?.startsWith("https://")) {
    return <img src={src} alt="" referrerPolicy="no-referrer" loading="lazy" className={`${className} shrink-0 rounded-2xl bg-zinc-800 object-cover`} />;
  }
  return (
    <span aria-hidden className={`${className} grid shrink-0 place-items-center rounded-2xl font-bold ${admin ? "bg-primary text-on-primary" : "bg-zinc-800 text-zinc-300"}`}>
      {name.charAt(0).toUpperCase()}
    </span>
  );
}
