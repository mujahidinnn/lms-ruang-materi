"use client";

import { useEffect, useRef, useState } from "react";
import { rpc } from "@/lib/rpc";
import { SLUG_RE, toSlug } from "@/lib/slug";
import { field } from "./editor";

const cek = rpc("slugTersedia");

type Props = {
  kind: "topics" | "tracks" | "chapters";
  // The slug as saved; typing it back is not "taken". Leave empty for a new item.
  defaultValue?: string;
  // Name of the title input in the same form: while the slug is untouched it follows the title (new items).
  followTitle?: string;
  topic?: string;
  chapterId?: string;
  name?: string;
  onValue?: (slug: string) => void;
  className?: string;
};

// A slug input that checks the slug is free as you type, and can write itself from the title.
export default function SlugField({ kind, defaultValue = "", followTitle, topic, chapterId, name = "slug", onValue, className = "" }: Props) {
  const [value, setValue] = useState(defaultValue);
  const [touched, setTouched] = useState(Boolean(defaultValue));
  const [status, setStatus] = useState<{ ok?: boolean; message?: string }>({});
  const ref = useRef<HTMLInputElement>(null);

  const set = (v: string) => {
    setValue(v);
    onValue?.(v);
  };

  // New items: follow the title until the slug is edited by hand.
  useEffect(() => {
    if (!followTitle) return;
    const title = ref.current?.form?.elements.namedItem(followTitle);
    if (!(title instanceof HTMLInputElement)) return;
    const on = () => !touched && set(toSlug(title.value));
    title.addEventListener("input", on);
    return () => title.removeEventListener("input", on);
  }, [followTitle, touched]);

  useEffect(() => {
    if (!value || value === defaultValue) return setStatus({});
    if (!SLUG_RE.test(value)) return setStatus({ ok: false, message: "Hanya huruf kecil, angka dan tanda hubung." });
    let stale = false;
    setStatus({});
    const t = setTimeout(async () => {
      try {
        const res = await cek({ kind, slug: value, topic, chapterId });
        if (!stale) setStatus(res);
      } catch {
        if (!stale) setStatus({});
      }
    }, 350);
    return () => {
      stale = true;
      clearTimeout(t);
    };
  }, [value, defaultValue, kind, topic, chapterId]);

  return (
    <span className={`block ${className}`}>
      <input
        ref={ref}
        name={name}
        value={value}
        required
        maxLength={60}
        pattern="[a-z0-9\-]+"
        spellCheck={false}
        autoComplete="off"
        aria-invalid={status.ok === false}
        aria-describedby={`${name}-status`}
        onChange={(e) => (setTouched(true), set(e.target.value.toLowerCase().replace(/\s+/g, "-")))}
        className={`${field} mt-1 font-mono ${status.ok === false ? "border-red-500" : ""}`}
      />
      <span id={`${name}-status`} aria-live="polite" className={`mt-1 block min-h-5 text-xs ${status.ok === false ? "text-red-500" : "text-zinc-500"}`}>
        {status.ok === false ? status.message : status.ok ? "Slug tersedia." : value && value !== defaultValue ? "Memeriksa..." : ""}
      </span>
    </span>
  );
}
