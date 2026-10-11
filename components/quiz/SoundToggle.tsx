"use client";

import { Volume2, VolumeX } from "lucide-react";
import { useEffect, useState } from "react";
import { setSoundOn, soundOn } from "@/lib/feedback";

export default function SoundToggle() {
  const [on, setOn] = useState(true);
  useEffect(() => {
    // The saved choice only exists in the browser.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOn(soundOn());
  }, []);
  return (
    <button
      type="button"
      onClick={() => {
        setSoundOn(!on);
        setOn(!on);
      }}
      aria-pressed={on}
      aria-label={on ? "Matikan suara" : "Nyalakan suara"}
      className="grid size-11 place-items-center rounded-full bg-zinc-900 text-zinc-400 shadow-soft hover:text-zinc-50 focus-visible:outline-2 focus-visible:outline-accent"
    >
      {on ? <Volume2 aria-hidden className="size-5" /> : <VolumeX aria-hidden className="size-5" />}
    </button>
  );
}
