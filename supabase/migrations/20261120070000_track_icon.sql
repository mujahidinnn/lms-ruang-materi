-- Roadmap icon: null = automatic by slug, a preset key, or inline <svg> markup
-- (shown through <img>, so it never runs as page markup).
alter table public.tracks add column icon text
  check (icon is null or (length(icon) <= 8192 and (icon ~ '^[a-z-]+$' or (icon ~ '^<svg[\s>]' and icon ~ '</svg>\s*$'))));
