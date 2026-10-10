"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import {
  Check,
  Copy,
  Download,
  ExternalLink,
  Eye,
  Monitor,
  Smartphone,
  X,
} from "lucide-react";
import type { TemplateEntry } from "@/data/templates";

type Device = "desktop" | "mobile";

const DEVICES: { id: Device; label: string; icon: typeof Monitor }[] = [
  { id: "desktop", label: "Desktop", icon: Monitor },
  { id: "mobile", label: "Mobile", icon: Smartphone },
];

const buttonClass =
  "inline-flex min-h-11 items-center gap-2 rounded-md border px-3.5 text-sm font-medium transition-colors";

function CopyCodeButton({
  file,
  label,
  className,
}: {
  file: string;
  label: string;
  className: string;
}) {
  const [status, setStatus] = useState<"idle" | "copied" | "error">("idle");

  useEffect(() => {
    if (status === "idle") return;
    const timer = setTimeout(() => setStatus("idle"), 2000);
    return () => clearTimeout(timer);
  }, [status]);

  async function copy() {
    try {
      const res = await fetch(`/templates/${file}`);
      if (!res.ok) throw new Error(res.statusText);
      await navigator.clipboard.writeText(await res.text());
      setStatus("copied");
    } catch {
      setStatus("error");
    }
  }

  const Icon = status === "copied" ? Check : Copy;
  return (
    <button type="button" onClick={copy} className={className}>
      <Icon className="h-4 w-4" strokeWidth={1.75} />
      <span aria-live="polite">
        {status === "copied" ? "Tersalin" : status === "error" ? "Gagal" : label}
      </span>
    </button>
  );
}

export default function TemplateGallery({
  templates,
}: {
  templates: TemplateEntry[];
}) {
  const [active, setActive] = useState<TemplateEntry | null>(null);
  const [device, setDevice] = useState<Device>("desktop");

  const closeRef = useRef<HTMLButtonElement>(null);

  // Focus moves into the dialog on open and back to the opener on close.
  useEffect(() => {
    if (!active) return;
    const opener = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setActive(null);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
      opener?.focus();
    };
  }, [active]);

  function openPreview(template: TemplateEntry) {
    setDevice("desktop");
    setActive(template);
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8 lg:grid-cols-3">
        {templates.map((template) => {
          const href = `/templates/${template.file}`;
          return (
            <article
              key={template.slug}
              className="flex flex-col overflow-hidden rounded-lg border border-zinc-800/80 bg-zinc-950 transition-colors hover:border-zinc-700"
            >
              <button
                type="button"
                onClick={() => openPreview(template)}
                aria-label={`Preview ${template.title}`}
                className="group relative aspect-video overflow-hidden border-b border-zinc-800/80"
              >
                <Image
                  src={template.preview}
                  alt={`Tampilan template ${template.title}`}
                  fill
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover transition-transform duration-300 ease-out group-hover:scale-[1.02]"
                />
              </button>
              <div className="flex flex-1 flex-col gap-4 p-6">
                <div className="flex flex-1 flex-col gap-3">
                  <h3 className="text-xl font-semibold tracking-tight text-zinc-50">
                    {template.title}
                  </h3>
                  <p className="flex-1 text-sm leading-relaxed text-zinc-400">
                    {template.description}
                  </p>
                  <span className="font-mono text-xs tracking-wide text-zinc-500 uppercase">
                    {template.tags.join(" · ")}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => openPreview(template)}
                    className={`${buttonClass} border-zinc-50 bg-zinc-50 text-zinc-950 hover:bg-zinc-200`}
                  >
                    <Eye className="h-4 w-4" strokeWidth={1.75} />
                    Preview
                  </button>
                  <a
                    href={href}
                    download={template.file}
                    className={`${buttonClass} border-zinc-800 text-zinc-300 hover:border-zinc-600 hover:text-zinc-50`}
                  >
                    <Download className="h-4 w-4" strokeWidth={1.75} />
                    Unduh Kode
                  </a>
                  <CopyCodeButton
                    file={template.file}
                    label="Salin Kode"
                    className={`${buttonClass} border-zinc-800 text-zinc-300 hover:border-zinc-600 hover:text-zinc-50`}
                  />
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {active && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Preview ${active.title}`}
          className="fixed inset-0 z-50 flex flex-col bg-zinc-950"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800/80 px-4 py-3 sm:px-6">
            <h3 className="truncate text-sm font-semibold text-zinc-50">
              {active.title}
            </h3>
            <div className="flex items-center gap-2">
              <div className="hidden overflow-hidden rounded-md border border-zinc-800 sm:flex">
                {DEVICES.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setDevice(id)}
                    aria-label={label}
                    aria-pressed={device === id}
                    className={`grid size-11 place-items-center transition-colors ${
                      device === id
                        ? "bg-zinc-800 text-zinc-50"
                        : "text-zinc-500 hover:text-zinc-200"
                    }`}
                  >
                    <Icon className="h-4 w-4" strokeWidth={1.75} />
                  </button>
                ))}
              </div>
              <a
                href={`/templates/${active.file}`}
                target="_blank"
                rel="noopener noreferrer"
                className={`${buttonClass} hidden border-zinc-800 text-zinc-300 hover:border-zinc-600 hover:text-zinc-50 sm:inline-flex`}
              >
                <ExternalLink className="h-4 w-4" strokeWidth={1.75} />
                Tab baru
              </a>
              <a
                href={`/templates/${active.file}`}
                download={active.file}
                className={`${buttonClass} border-zinc-800 text-zinc-300 hover:border-zinc-600 hover:text-zinc-50`}
              >
                <Download className="h-4 w-4" strokeWidth={1.75} />
                Unduh
              </a>
              <CopyCodeButton
                file={active.file}
                label="Salin"
                className={`${buttonClass} border-zinc-800 text-zinc-300 hover:border-zinc-600 hover:text-zinc-50`}
              />
              <button
                ref={closeRef}
                type="button"
                onClick={() => setActive(null)}
                aria-label="Tutup preview"
                className="grid size-11 place-items-center rounded-md border border-zinc-800 text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-50"
              >
                <X className="h-4 w-4" strokeWidth={1.75} />
              </button>
            </div>
          </div>
          <div className="flex min-h-0 flex-1 justify-center bg-zinc-900">
            <iframe
              key={active.slug}
              src={`/templates/${active.file}`}
              title={`Preview ${active.title}`}
              sandbox="allow-scripts allow-popups"
              className={`h-full bg-white transition-[width] duration-200 ${
                device === "mobile"
                  ? "w-full sm:w-[390px] sm:border-x sm:border-zinc-800"
                  : "w-full"
              }`}
            />
          </div>
        </div>
      )}
    </>
  );
}
