"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import { coverSrc, type Presentation } from "@/lib/slides";

// Solid tints so the tab and the panel join without doubled transparency.
const FOLDER = "bg-[color-mix(in_oklab,var(--color-accent)_7%,var(--color-zinc-950))]";
const POCKET = "bg-[color-mix(in_oklab,var(--color-accent)_14%,var(--color-zinc-950))]";

// Where each cover sits in the folder, front first. Covers past the last slot
// wait, hidden, behind it.
const SLOTS = [
  "z-30 inset-x-12 top-16 sm:inset-x-14",
  "z-20 top-6 right-20 left-8 -rotate-3 opacity-60",
  "z-10 top-8 right-6 left-24 rotate-3 opacity-60",
];
const HIDDEN = `${SLOTS[2]} z-0 opacity-0`;
const PULL_OUT = 80; // px dragged up before release files the cover away

// A folder with real covers filed inside, their tops peeking over the front
// pocket. Drag the front cover up and out: it leaves, the next takes its
// place, and it drops back into the folder behind the rest. Click opens it.
export default function HeroRoom({ topics }: { topics: Presentation[] }) {
  const [order, setOrder] = useState(() => topics.map((_, i) => i));
  const [dragY, setDragY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const start = useRef<number | null>(null);
  const moved = useRef(false);

  const front = topics[order[0]];
  if (!front) return null;

  function next() {
    setLeaving(true);
    setTimeout(() => {
      setOrder(([first, ...rest]) => [...rest, first]);
      setLeaving(false);
      setDragY(0);
    }, 250);
  }

  function release() {
    if (start.current === null) return;
    start.current = null;
    setDragging(false);
    if (dragY < -PULL_OUT && topics.length > 1) next();
    else setDragY(0);
  }

  return (
    <div className="relative pt-8">
      {/* Tab, sitting on the panel's top edge; it covers the panel border
          beneath it so the two read as one sheet. */}
      <span aria-hidden className={`absolute top-0 left-0 z-10 h-[calc(2rem+1px)] w-2/5 rounded-t-xl border border-b-0 border-accent/30 ${FOLDER}`}>
        <span className="absolute top-3 right-4 size-2 rounded-full bg-accent-warm" />
      </span>

      <div className={`relative aspect-4/3 rounded-2xl rounded-tl-none border border-accent/30 ${FOLDER}`}>
        {topics.map((t, i) => {
          const slot = order.indexOf(i);
          const isFront = slot === 0;
          const base = `absolute block aspect-video overflow-hidden rounded-lg border border-zinc-800/80 ${SLOTS[slot] ?? HIDDEN}`;
          const motion = dragging && isFront ? "" : "transition-[top,left,right,rotate,translate,transform,opacity] duration-300 ease-out motion-reduce:transition-none";
          const img = <Image src={coverSrc(t)} alt="" fill sizes="(min-width: 1024px) 450px, 90vw" draggable={false} className="object-cover" priority={isFront} />;

          if (!isFront) return <div key={t.slug} aria-hidden className={`${base} ${motion}`}>{img}</div>;

          return (
            <Link
              key={t.slug}
              href={`/belajar/${t.slug}`}
              aria-label={`Buka materi ${t.title}`}
              aria-describedby="hero-room-hint"
              draggable={false}
              className={`${base} ${motion} cursor-grab touch-none shadow-lg select-none hover:-translate-y-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:cursor-grabbing`}
              style={{
                transform: `translateY(${leaving ? "-130%" : `${dragY}px`})`,
                opacity: leaving ? 0 : undefined,
              }}
              onPointerDown={(e) => {
                e.currentTarget.setPointerCapture(e.pointerId);
                start.current = e.clientY;
                moved.current = false;
                setDragging(true);
              }}
              onPointerMove={(e) => {
                if (start.current === null) return;
                const dy = e.clientY - start.current;
                if (Math.abs(dy) > 5) moved.current = true;
                // Pulling down only gives a little; the pocket holds it.
                setDragY(dy < 0 ? dy : dy / 4);
              }}
              onPointerUp={release}
              onPointerCancel={release}
              onClick={(e) => moved.current && e.preventDefault()}
              onKeyDown={(e) => {
                if (e.key !== "ArrowUp" || topics.length < 2) return;
                e.preventDefault();
                next();
              }}
            >
              {img}
            </Link>
          );
        })}

        {/* Front pocket, holding the label. */}
        <div className={`pointer-events-none absolute inset-x-0 bottom-0 z-40 flex h-[40%] items-end rounded-2xl border-t border-accent/40 p-6 shadow-[0_-12px_24px_-16px_rgb(0_0_0/0.6)] sm:p-8 ${POCKET}`}>
          <p className="flex w-full items-baseline justify-between gap-4">
            <span>
              <span className="block text-sm text-accent">Mulai dari sini</span>
              <span className="text-lg font-semibold">{front.title}</span>
            </span>
            <span className="text-sm text-zinc-400 tabular-nums">{front.slideCount} slide</span>
          </p>
        </div>
      </div>
      <p id="hero-room-hint" className="sr-only">Tarik sampul ke atas atau tekan panah atas untuk melihat materi berikutnya.</p>
    </div>
  );
}
