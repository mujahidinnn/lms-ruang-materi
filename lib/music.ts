// A Spotify or YouTube (Music) share link to its embed URL, or null.
// YouTube goes through youtube-nocookie, so nothing is stored until it plays.
export function musicEmbed(link: string): string | null {
  let url: URL;
  try {
    url = new URL(link.trim());
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^www\./, "");

  if (host === "open.spotify.com") {
    const m = url.pathname.match(/^\/(?:intl-[\w-]+\/)?(track|album|playlist|artist|episode|show)\/([A-Za-z0-9]+)/);
    return m ? `https://open.spotify.com/embed/${m[1]}/${m[2]}` : null;
  }

  if (host === "youtube.com" || host === "music.youtube.com" || host === "m.youtube.com" || host === "youtu.be") {
    const id = host === "youtu.be" ? url.pathname.slice(1) : url.searchParams.get("v");
    const list = url.searchParams.get("list");
    const ok = (s: string | null) => !!s && /^[\w-]+$/.test(s);
    if (ok(id)) return `https://www.youtube-nocookie.com/embed/${id}${ok(list) ? `?list=${list}` : ""}`;
    if (ok(list)) return `https://www.youtube-nocookie.com/embed/videoseries?list=${list}`;
  }
  return null;
}
