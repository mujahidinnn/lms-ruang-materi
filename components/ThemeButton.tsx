"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

// Also read by the inline script in app/layout.tsx; keep the two in step.
const THEME_KEY = "ruang-materi:tema";

// Light is the design; dark is a choice. The choice lives in localStorage and
// on <html data-theme="dark">, applied before first paint by app/layout.tsx.
export default function ThemeButton() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    // Reading what the inline script set, which only exists after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDark(document.documentElement.dataset.theme === "dark");
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    if (next) document.documentElement.dataset.theme = "dark";
    else delete document.documentElement.dataset.theme;
    try {
      if (next) localStorage.setItem(THEME_KEY, "dark");
      else localStorage.removeItem(THEME_KEY);
    } catch {}
  }

  const Icon = dark ? Sun : Moon;
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "Pakai tema terang" : "Pakai tema gelap"}
      aria-pressed={dark}
      className="grid size-11 place-items-center rounded-full bg-zinc-900 text-zinc-300 shadow-soft hover:text-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      <Icon aria-hidden className="size-5" />
    </button>
  );
}
