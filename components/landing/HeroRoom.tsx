"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { coverSrc, type Presentation } from "@/lib/slides";

// Solid tints so the tab and the panel join without doubled transparency.
const FOLDER = "bg-[color-mix(in_oklab,var(--color-accent)_7%,var(--color-zinc-950))]";
const POCKET = "bg-[color-mix(in_oklab,var(--color-accent)_14%,var(--color-zinc-950))]";

// Where each cover sits in the folder, front first. Covers past the last slot
// wait, hidden, behind it.
const SLOTS = [
  "z-30 inset-x-12 top-16 sm:inset-x-14",
  "z-20 top-6 right-20 left-8 -rotate-3 brightness-(--dim-1)",
  "z-10 top-8 right-6 left-24 rotate-3 brightness-(--dim-2)",
];
const HIDDEN = `${SLOTS[2]} z-0 opacity-0`;
const PULL_OUT = 80; // px dragged before release files the cover away
const FLY = 700; // px the cover travels on its way out
const tilt = (dx: number) => Math.max(-15, Math.min(15, dx / 12));
const HOLD_MS = 200; // touch: hold this long before a drag, so a swipe scrolls

// A folder with real covers filed inside, their tops peeking over the front
// pocket. Drag the front cover up and out: it leaves, the next takes its
// place, and it drops back into the folder behind the rest. Click opens it.
// On touch the cover moves only after a short hold; a plain swipe scrolls.
export default function HeroRoom({ topics }: { topics: Presentation[] }) {
  const [order, setOrder] = useState(() => topics.map((_, i) => i));
  const [drag, setDrag] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const start = useRef<{ x: number; y: number } | null>(null);
  const moved = useRef(false);
  const armed = useRef(false);
  const hold = useRef<ReturnType<typeof setTimeout>>(undefined);
  const box = useRef<HTMLDivElement>(null);
  const dragRef = useRef({ x: 0, y: 0 });

  function moveTo(d: { x: number; y: number }) {
    dragRef.current = d;
    setDrag(d);
  }

  function follow(x: number, y: number) {
    if (!start.current) return;
    const dx = x - start.current.x;
    const dy = y - start.current.y;
    if (Math.hypot(dx, dy) > 5) moved.current = true;
    // Pulling down only gives a little; the pocket holds it.
    moveTo({ x: dx, y: dy < 0 ? dy : dy / 4 });
  }

  // Touch runs on touch events, not pointer events: Chrome cancels the
  // pointer as soon as a pan-y gesture moves. A drag arms after a short hold;
  // moving earlier is a swipe and scrolls. Added by hand because React's
  // touch listeners are passive and cannot stop the scroll.
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const onStart = (e: TouchEvent) => {
      if (!(e.target as Element).closest("[data-front]")) return;
      const t = e.touches[0];
      start.current = { x: t.clientX, y: t.clientY };
      moved.current = false;
      hold.current = setTimeout(() => {
        armed.current = true;
        setDragging(true);
        navigator.vibrate?.(10);
      }, HOLD_MS);
    };
    const onMove = (e: TouchEvent) => {
      if (!start.current) return;
      const t = e.touches[0];
      if (armed.current) {
        if (e.cancelable) e.preventDefault();
        follow(t.clientX, t.clientY);
      } else if (Math.hypot(t.clientX - start.current.x, t.clientY - start.current.y) > 8) {
        clearTimeout(hold.current);
        start.current = null;
        moved.current = true;
      }
    };
    el.addEventListener("touchstart", onStart, { passive: true });
    el.addEventListener("touchmove", onMove, { passive: false });
    el.addEventListener("touchend", release);
    el.addEventListener("touchcancel", release);
    return () => {
      el.removeEventListener("touchstart", onStart);
      el.removeEventListener("touchmove", onMove);
      el.removeEventListener("touchend", release);
      el.removeEventListener("touchcancel", release);
    };
    // Mounted once; everything it calls reads refs or setters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const front = topics[order[0]];
  if (!front) return null;

  // The cover flies out along the line it was pulled.
  function next(dir = { x: 0, y: -1 }) {
    const len = Math.hypot(dir.x, dir.y) || 1;
    moveTo({ x: (dir.x / len) * FLY, y: (dir.y / len) * FLY });
    setLeaving(true);
    setTimeout(() => {
      setOrder(([first, ...rest]) => [...rest, first]);
      setLeaving(false);
      moveTo({ x: 0, y: 0 });
    }, 250);
  }

  function release() {
    clearTimeout(hold.current);
    armed.current = false;
    if (start.current === null) return;
    start.current = null;
    setDragging(false);
    // Any pull that clears the pocket counts; one into the pocket springs back.
    const d = dragRef.current;
    if (Math.hypot(d.x, d.y) > PULL_OUT && d.y < 0 && topics.length > 1) next(d);
    else moveTo({ x: 0, y: 0 });
  }

  return (
    <div className="relative pt-8">
      {/* Tab, sitting on the panel's top edge; it covers the panel border
          beneath it so the two read as one sheet. */}
      <span aria-hidden className={`absolute top-0 left-0 z-10 h-[calc(2rem+1px)] w-2/5 rounded-t-xl border border-b-0 border-accent/30 ${FOLDER}`}>
        <span className="absolute top-3 right-4 size-2 rounded-full bg-accent-warm" />
      </span>

      <div ref={box} className={`relative aspect-4/3 rounded-2xl rounded-tl-none border border-accent/30 ${FOLDER}`}>
        {topics.map((t, i) => {
          const slot = order.indexOf(i);
          const isFront = slot === 0;
          const base = `absolute block aspect-video overflow-hidden rounded-lg border border-zinc-800/80 ${SLOTS[slot] ?? HIDDEN}`;
          const motion = dragging && isFront ? "" : "transition-[top,left,right,rotate,translate,transform,opacity,filter] duration-300 ease-out motion-reduce:transition-none";
          const img = <Image src={coverSrc(t)} alt="" fill sizes="(min-width: 1024px) 450px, 90vw" draggable={false} className="object-cover" priority={isFront} />;

          if (!isFront) return <div key={t.slug} aria-hidden className={`${base} ${motion}`}>{img}</div>;

          return (
            <Link
              key={t.slug}
              href={`/belajar/${t.slug}`}
              aria-label={`Buka materi ${t.title}`}
              aria-describedby="hero-room-hint"
              draggable={false}
              className={`${base} ${motion} cursor-grab touch-pan-y shadow-lg select-none [-webkit-touch-callout:none] hover:-translate-y-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:cursor-grabbing`}
              style={{
                transform: `translate(${drag.x}px, ${drag.y}px) rotate(${tilt(drag.x)}deg)`,
                opacity: leaving ? 0 : undefined,
              }}
              data-front
              onPointerDown={(e) => {
                if (e.pointerType === "touch") return;
                e.currentTarget.setPointerCapture(e.pointerId);
                start.current = { x: e.clientX, y: e.clientY };
                moved.current = false;
                armed.current = true;
                setDragging(true);
              }}
              onPointerMove={(e) => e.pointerType !== "touch" && armed.current && follow(e.clientX, e.clientY)}
              onPointerUp={(e) => e.pointerType !== "touch" && release()}
              onPointerCancel={(e) => e.pointerType !== "touch" && release()}
              onClick={(e) => moved.current && e.preventDefault()}
              onContextMenu={(e) => e.preventDefault()}
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
