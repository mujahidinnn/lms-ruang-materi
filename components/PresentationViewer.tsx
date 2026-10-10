"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  LayoutPanelTop,
  Maximize,
  Minimize,
  PanelBottom,
  PanelLeft,
  PanelRight,
  PanelTop,
} from "lucide-react";
import { thumbSrc, type Presentation } from "@/lib/slides";

type NavPosition = "bottom" | "top" | "left" | "right";

const NAV_POSITIONS: { id: NavPosition; label: string; icon: typeof PanelBottom }[] = [
  { id: "bottom", label: "Bawah", icon: PanelBottom },
  { id: "top", label: "Atas", icon: PanelTop },
  { id: "left", label: "Kiri", icon: PanelLeft },
  { id: "right", label: "Kanan", icon: PanelRight },
];

export default function PresentationViewer({
  presentation,
  resumeAt = null,
  onSlide,
}: {
  presentation: Presentation;
  resumeAt?: number | null;
  onSlide?: (index: number) => void;
}) {
  const { title, slides } = presentation;
  const [index, setIndex] = useState(0);
  // Jump once when a saved position arrives after mount.
  const [resumed, setResumed] = useState<number | null>(null);
  if (resumeAt !== null && resumeAt !== resumed) {
    setResumed(resumeAt);
    setIndex(Math.min(Math.max(resumeAt, 0), slides.length - 1));
  }
  useEffect(() => onSlide?.(index), [index, onSlide]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [navPosition, setNavPosition] = useState<NavPosition>("bottom");
  const [isLayoutMenuOpen, setIsLayoutMenuOpen] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const thumbRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const layoutMenuRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);

  const slide = slides[index];
  const isFirst = index === 0;
  const isLast = index === slides.length - 1;
  const isVerticalNav = navPosition === "left" || navPosition === "right";

  const goTo = useCallback(
    (next: number) => {
      setIndex(Math.min(Math.max(next, 0), slides.length - 1));
    },
    [slides.length]
  );

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      switch (event.key) {
        case "ArrowRight":
        case "ArrowDown":
        case "PageDown":
        case " ":
          event.preventDefault();
          goTo(index + 1);
          break;
        case "ArrowLeft":
        case "ArrowUp":
        case "PageUp":
          event.preventDefault();
          goTo(index - 1);
          break;
        case "Home":
          event.preventDefault();
          goTo(0);
          break;
        case "End":
          event.preventDefault();
          goTo(slides.length - 1);
          break;
        case "f":
        case "F":
          toggleFullscreen();
          break;
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [index, goTo, slides.length]);

  useEffect(() => {
    thumbRefs.current[index]?.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  }, [index]);

  // Warm the cache for the neighbouring slides so navigation doesn't wait on
  // a network fetch of a 3200px image.
  useEffect(() => {
    for (const neighbour of [slides[index + 1], slides[index - 1]]) {
      if (neighbour) new window.Image().src = neighbour.src;
    }
  }, [index, slides]);

  useEffect(() => {
    function onFullscreenChange() {
      const active = Boolean(document.fullscreenElement);
      setIsFullscreen(active);
      if (!active) screen.orientation?.unlock?.();
    }
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  useEffect(() => {
    if (!isLayoutMenuOpen) return;
    function onPointerDown(event: MouseEvent) {
      if (!layoutMenuRef.current?.contains(event.target as Node)) {
        setIsLayoutMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [isLayoutMenuOpen]);

  async function toggleFullscreen() {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
      return;
    }
    try {
      await stageRef.current?.requestFullscreen();
      // Orientation lock only works while fullscreen, and only on touch
      // devices that support it (Android Chrome; iOS Safari does not).
      if (window.matchMedia("(pointer: coarse)").matches) {
        await (
          screen.orientation as ScreenOrientation & {
            lock?: (orientation: "landscape") => Promise<void>;
          }
        ).lock?.("landscape");
      }
    } catch {
      // Fullscreen or orientation lock denied/unsupported: keep going.
    }
  }

  function onTouchStart(event: React.TouchEvent) {
    touchStartX.current = event.touches[0].clientX;
  }

  function onTouchEnd(event: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const delta = event.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(delta) > 50) {
      goTo(delta < 0 ? index + 1 : index - 1);
    }
    touchStartX.current = null;
  }

  const ActiveLayoutIcon =
    NAV_POSITIONS.find((p) => p.id === navPosition)?.icon ?? LayoutPanelTop;

  const navPaddingClass = isVerticalNav
    ? navPosition === "left"
      ? "py-3 pl-3 pr-5"
      : "py-3 pr-3 pl-5"
    : navPosition === "top"
    ? "px-4 pb-5 pt-3 short:pb-2! short:pt-1.5! sm:px-6"
    : "px-4 pb-3 pt-5 short:pb-1.5! short:pt-2! sm:px-6";

  const navBorderClass = isVerticalNav
    ? navPosition === "left"
      ? "border-r border-zinc-800/80"
      : "border-l border-zinc-800/80"
    : navPosition === "top"
    ? "border-b border-zinc-800/80"
    : "border-t border-zinc-800/80";

  const navList = (
    <nav
      aria-label="Navigasi slide"
      className={`scrollbar-thin flex shrink-0 gap-3 short:gap-1.5! ${navBorderClass} ${navPaddingClass} ${
        isVerticalNav
          ? "w-40 flex-col overflow-y-auto sm:w-48"
          : "flex-row overflow-x-auto"
      }`}
    >
      {slides.map((thumb, i) => (
        <div
          key={thumb.src}
          className={`relative shrink-0 ${isVerticalNav ? "w-full" : ""}`}
        >
          <span
            aria-hidden="true"
            className={`absolute rounded-full bg-zinc-50 transition-opacity ${
              i === index ? "opacity-100" : "opacity-0"
            } ${
              isVerticalNav
                ? navPosition === "left"
                  ? "-right-2.5 top-1/2 h-1.5 w-1.5 -translate-y-1/2"
                  : "-left-2.5 top-1/2 h-1.5 w-1.5 -translate-y-1/2"
                : navPosition === "top"
                ? "-bottom-2.5 left-1/2 h-1.5 w-1.5 -translate-x-1/2"
                : "-top-2.5 left-1/2 h-1.5 w-1.5 -translate-x-1/2"
            }`}
          />
          <button
            ref={(el) => {
              thumbRefs.current[i] = el;
            }}
            type="button"
            onClick={() => goTo(i)}
            aria-label={`Ke slide ${i + 1}`}
            aria-current={i === index}
            className={`relative aspect-video overflow-hidden rounded-md border transition-colors ${
              isVerticalNav ? "w-full" : "h-14 shrink-0 short:h-9! sm:h-16"
            } ${
              i === index
                ? "border-zinc-50"
                : "border-zinc-800/80 hover:border-zinc-700"
            }`}
          >
            <Image
              src={thumbSrc(thumb)}
              alt=""
              fill
              sizes="112px"
              className="object-cover"
            />
          </button>
        </div>
      ))}
    </nav>
  );

  const stage = (
    <div
      ref={stageRef}
      className={`relative flex min-h-0 flex-1 items-center justify-center bg-zinc-950 [container-type:size] ${
        isFullscreen ? "" : "p-3 short:p-1.5! sm:p-6"
      }`}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Largest 16:9 box that fits the stage, so object-contain never
          letterboxes inside it (slides are all 3200x1800). */}
      <div
        style={{
          width: isFullscreen
            ? "min(100cqw, calc(100cqh * 16 / 9))"
            : "min(100cqw, 72rem, calc(100cqh * 16 / 9))",
        }}
        className={`relative aspect-video overflow-hidden bg-zinc-900 ${
          isFullscreen ? "" : "rounded-lg"
        }`}
      >
        <Image
          key={slide.src}
          src={slide.src}
          alt={`${title}, slide ${index + 1} dari ${slides.length}`}
          fill
          fetchPriority="high"
          sizes={isFullscreen ? "100vw" : "(min-width: 1280px) 1152px, 100vw"}
          className="object-contain"
        />
      </div>

      <button
        type="button"
        onClick={() => goTo(index - 1)}
        disabled={isFirst}
        aria-label="Slide sebelumnya"
        className="absolute left-3 top-1/2 hidden -translate-y-1/2 items-center justify-center rounded-md border border-zinc-800/80 bg-zinc-950/80 p-2 text-zinc-300 transition-colors hover:border-zinc-700 hover:text-zinc-50 disabled:pointer-events-none disabled:opacity-0 sm:flex"
      >
        <ChevronLeft className="h-5 w-5" strokeWidth={1.75} />
      </button>
      <button
        type="button"
        onClick={() => goTo(index + 1)}
        disabled={isLast}
        aria-label="Slide berikutnya"
        className="absolute right-3 top-1/2 hidden -translate-y-1/2 items-center justify-center rounded-md border border-zinc-800/80 bg-zinc-950/80 p-2 text-zinc-300 transition-colors hover:border-zinc-700 hover:text-zinc-50 disabled:pointer-events-none disabled:opacity-0 sm:flex"
      >
        <ChevronRight className="h-5 w-5" strokeWidth={1.75} />
      </button>
    </div>
  );

  return (
    <div className="flex h-dvh flex-col bg-zinc-950 text-zinc-50">
      <header className="flex shrink-0 items-center justify-between gap-4 border-b border-zinc-800/80 px-4 py-3 short:py-1.5! sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/"
            aria-label="Kembali ke beranda"
            className="relative flex h-9 w-9 shrink-0 items-center after:absolute after:-inset-1 after:content-[''] short:after:-inset-2 justify-center rounded-md border border-zinc-800/80 text-zinc-400 transition-colors hover:border-zinc-700 hover:text-zinc-50 short:h-7! short:w-7!"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={1.75} />
          </Link>
          <h1 className="truncate text-sm font-medium tracking-tight text-zinc-200">
            {title}
          </h1>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span className="font-mono text-xs tabular-nums text-zinc-500">
            {String(index + 1).padStart(2, "0")} /{" "}
            {String(slides.length).padStart(2, "0")}
          </span>
          <div className="relative" ref={layoutMenuRef}>
            <button
              type="button"
              onClick={() => setIsLayoutMenuOpen((open) => !open)}
              aria-label="Atur posisi daftar slide"
              aria-expanded={isLayoutMenuOpen}
              className="relative flex h-9 w-9 items-center after:absolute after:-inset-1 after:content-[''] short:after:-inset-2 justify-center rounded-md border border-zinc-800/80 text-zinc-400 transition-colors hover:border-zinc-700 hover:text-zinc-50 short:h-7! short:w-7!"
            >
              <ActiveLayoutIcon className="h-4 w-4" strokeWidth={1.75} />
            </button>
            {isLayoutMenuOpen && (
              <div className="absolute right-0 top-11 z-10 w-40 overflow-hidden rounded-md border border-zinc-800/80 bg-zinc-900 py-1 shadow-lg shadow-black/40">
                {NAV_POSITIONS.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      setNavPosition(id);
                      setIsLayoutMenuOpen(false);
                    }}
                    className={`flex min-h-11 w-full items-center gap-2.5 px-3 text-left text-xs transition-colors ${
                      id === navPosition
                        ? "bg-zinc-800/80 text-zinc-50"
                        : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-50"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={toggleFullscreen}
            aria-label={isFullscreen ? "Keluar layar penuh" : "Layar penuh"}
            className="relative flex h-9 w-9 items-center after:absolute after:-inset-1 after:content-[''] short:after:-inset-2 justify-center rounded-md border border-zinc-800/80 text-zinc-400 transition-colors hover:border-zinc-700 hover:text-zinc-50"
          >
            {isFullscreen ? (
              <Minimize className="h-4 w-4" strokeWidth={1.75} />
            ) : (
              <Maximize className="h-4 w-4" strokeWidth={1.75} />
            )}
          </button>
        </div>
      </header>

      <div className="relative h-px w-full bg-zinc-900">
        <div
          className="h-full bg-zinc-50 transition-[width] duration-300 ease-out"
          style={{ width: `${((index + 1) / slides.length) * 100}%` }}
        />
      </div>

      <div
        className={`flex min-h-0 flex-1 ${
          isVerticalNav ? "flex-row" : "flex-col"
        }`}
      >
        {(navPosition === "top" || navPosition === "left") && navList}
        {stage}
        {(navPosition === "bottom" || navPosition === "right") && navList}
      </div>
    </div>
  );
}
