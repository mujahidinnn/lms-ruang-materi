"use client";

import { useEffect, useState } from "react";

const WORDS = [
  "Belajar",
  "Presentasi",
  "Interaktif",
  "Digital",
  "Visual",
  "Modern",
  "Praktis",
  "Ringkas",
];
const INTERVAL_MS = 5000;

export default function AnimatedHeroTitle() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((current) => (current + 1) % WORDS.length);
    }, INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <h1 className="mt-4 max-w-2xl text-4xl leading-[1.05] font-semibold tracking-tight text-zinc-50 sm:text-6xl">
      <span className="text-accent">Ruang Materi</span>{" "}
      <span
        key={WORDS[index]}
        className="inline-block animate-word-in"
      >
        {WORDS[index]}
      </span>
    </h1>
  );
}
