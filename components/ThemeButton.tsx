"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

// Also read by the inline script in app/layout.tsx; keep the two in step.
const THEME_KEY = "ruang-materi:tema";
const NEXT = { sistem: "terang", terang: "gelap", gelap: "sistem" } as const;
const ICON = { sistem: Monitor, terang: Sun, gelap: Moon };
type Theme = keyof typeof NEXT;

// Cycles ikut sistem, terang, gelap. The choice lives in localStorage and on
// <html data-theme>; the inline script in app/layout.tsx applies it before
// the first paint.
export default function ThemeButton() {
  const [theme, setTheme] = useState<Theme>("sistem");
  useEffect(() => {
    const t = document.documentElement.dataset.theme;
    // Reading what the inline script set, which only exists after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTheme(t === "light" ? "terang" : t === "dark" ? "gelap" : "sistem");
  }, []);

  function cycle() {
    const next = NEXT[theme];
    setTheme(next);
    const attr = next === "terang" ? "light" : next === "gelap" ? "dark" : null;
    if (attr) document.documentElement.dataset.theme = attr;
    else delete document.documentElement.dataset.theme;
    try {
      if (attr) localStorage.setItem(THEME_KEY, attr);
      else localStorage.removeItem(THEME_KEY);
    } catch {}
  }

  const Icon = ICON[theme];
  return (
    <button
      type="button"
      onClick={cycle}
      aria-label={`Tema: ${theme === "sistem" ? "ikut sistem" : theme}. Ganti tema`}
      title={`Tema: ${theme === "sistem" ? "ikut sistem" : theme}`}
      className="grid size-11 place-items-center rounded-lg text-zinc-400 hover:text-zinc-50 focus-visible:outline-2 focus-visible:outline-accent"
    >
      <Icon aria-hidden className="size-5" />
    </button>
  );
}
