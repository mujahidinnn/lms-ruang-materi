"use client";

import { ChevronLeft, ChevronRight, Send, WifiOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { kumpulkanUjian } from "@/app/ujian/actions";
import { primaryButton } from "@/components/ui/styles";

export type ExamQuestion = { id: string; prompt: string; code: string | null; options: string[] };
type Saved = { answers: Record<string, number>; doubts: string[] };

const WARN = [5 * 60, 60];

// No feedback until submit. Answers autosave to localStorage per attempt,
// leaving asks first, and the clock submits on its own at zero. The timer is
// text; its live region speaks only the 5 and 1 minute warnings.
export default function ExamRunner({ attemptId, deadline, questions }: { attemptId: string; deadline: string; questions: ExamQuestion[] }) {
  const router = useRouter();
  const key = `ruang-materi:ujian:${attemptId}`;
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [doubts, setDoubts] = useState<string[]>([]);
  const [left, setLeft] = useState<number | null>(null);
  const [warning, setWarning] = useState("");
  const [offline, setOffline] = useState(false);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const sent = useRef(false);

  const q = questions[i];
  const answered = Object.keys(answers).length;

  async function submit(auto = false) {
    if (sent.current) return;
    if (!auto) {
      const open = questions.length - answered;
      const msg = [open && `${open} soal belum dijawab`, doubts.length && `${doubts.length} soal ditandai ragu-ragu`].filter(Boolean).join(", ");
      if (!confirm(msg ? `${msg}. Kumpulkan sekarang?` : "Kumpulkan jawaban sekarang?")) return;
    }
    sent.current = true;
    setSending(true);
    const res = await kumpulkanUjian(attemptId, answers);
    if (res.error) {
      // An automatic submit is not retried every second; the button stays.
      sent.current = auto;
      setSending(false);
      setError(res.error);
      return;
    }
    try {
      localStorage.removeItem(key);
    } catch {}
    router.refresh();
  }

  // Restore, then keep saving.
  useEffect(() => {
    try {
      const saved: Saved | null = JSON.parse(localStorage.getItem(key) ?? "null");
      if (saved) {
        // Restoring from storage that only exists after mount.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setAnswers(saved.answers);
        setDoubts(saved.doubts);
      }
    } catch {}
  }, [key]);
  useEffect(() => {
    // Skip the empty first render, or it would overwrite what restore reads.
    if (!Object.keys(answers).length && !doubts.length) return;
    try {
      localStorage.setItem(key, JSON.stringify({ answers, doubts } satisfies Saved));
    } catch {}
  }, [key, answers, doubts]);

  useEffect(() => {
    const tick = () => {
      const s = Math.max(0, Math.round((new Date(deadline).getTime() - Date.now()) / 1000));
      setLeft(s);
      if (WARN.includes(s)) setWarning(s === 60 ? "Sisa waktu 1 menit." : "Sisa waktu 5 menit.");
      if (s === 0) submit(true);
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  });

  useEffect(() => {
    const onUnload = (e: BeforeUnloadEvent) => {
      if (!sent.current) e.preventDefault();
    };
    const net = () => setOffline(!navigator.onLine);
    net();
    window.addEventListener("beforeunload", onUnload);
    window.addEventListener("online", net);
    window.addEventListener("offline", net);
    return () => {
      window.removeEventListener("beforeunload", onUnload);
      window.removeEventListener("online", net);
      window.removeEventListener("offline", net);
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const n = Number(e.key);
      if (n >= 1 && n <= q.options.length) setAnswers((a) => ({ ...a, [q.id]: n - 1 }));
      if (e.key === "Enter" && !(e.target instanceof HTMLButtonElement) && i < questions.length - 1) setI(i + 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const low = left !== null && left <= 5 * 60;
  const doubt = doubts.includes(q.id);

  return (
    <div>
      <div className="sticky top-0 z-10 -mx-6 flex items-center justify-between gap-4 border-b border-zinc-800/80 bg-zinc-950/90 px-6 py-3 backdrop-blur sm:-mx-10 sm:px-10">
        <span className="text-sm text-zinc-400 tabular-nums">
          Soal {i + 1} dari {questions.length}
        </span>
        <span className={`font-mono text-lg tabular-nums ${low ? "text-accent-warm" : "text-zinc-50"}`}>
          <span className="sr-only">Sisa waktu </span>
          {left === null ? "--:--" : `${String(Math.floor(left / 60)).padStart(2, "0")}:${String(left % 60).padStart(2, "0")}`}
        </span>
      </div>
      <p aria-live="assertive" className="sr-only">{warning}</p>
      {offline && (
        <p role="status" className="mt-4 flex items-center gap-2 rounded-lg border border-accent-warm/40 px-3 py-2 text-sm text-accent-warm">
          <WifiOff aria-hidden className="size-4" /> Kamu sedang offline. Jawaban tetap tersimpan di perangkat ini.
        </p>
      )}

      <h2 className="mt-8 text-xl leading-snug font-semibold text-balance">{q.prompt}</h2>
      {q.code && (
        <pre className="scrollbar-thin mt-4 overflow-x-auto rounded-lg border border-zinc-800/80 bg-zinc-900 p-4 text-sm"><code className="font-mono">{q.code}</code></pre>
      )}

      <div role="radiogroup" aria-label="Pilihan jawaban" className="mt-6 grid gap-2">
        {q.options.map((opt, n) => (
          <button
            key={n}
            role="radio"
            aria-checked={answers[q.id] === n}
            onClick={() => setAnswers((a) => ({ ...a, [q.id]: n }))}
            className={`flex min-h-12 items-center gap-3 rounded-xl border px-4 py-3 text-left focus-visible:outline-2 focus-visible:outline-accent ${
              answers[q.id] === n ? "border-accent bg-accent/10" : "border-zinc-800 hover:border-zinc-600"
            }`}
          >
            <span className="grid size-6 shrink-0 place-items-center rounded-md border border-zinc-700 font-mono text-xs text-zinc-400">{n + 1}</span>
            <span className="flex-1">{opt}</span>
          </button>
        ))}
      </div>

      <label className="mt-4 inline-flex min-h-11 cursor-pointer items-center gap-2 text-sm text-zinc-400">
        <input
          type="checkbox"
          checked={doubt}
          onChange={() => setDoubts((d) => (doubt ? d.filter((x) => x !== q.id) : [...d, q.id]))}
          className="size-4 accent-(--accent-warm)"
        />
        Ragu-ragu
      </label>

      <div className="mt-6 flex items-center justify-between gap-3">
        <button
          onClick={() => setI(i - 1)}
          disabled={i === 0}
          className="inline-flex min-h-11 items-center gap-1 rounded-lg border border-zinc-800 pr-4 pl-3 text-sm hover:border-zinc-600 focus-visible:outline-2 focus-visible:outline-accent disabled:opacity-40"
        >
          <ChevronLeft aria-hidden className="size-4" />
          Sebelumnya
        </button>
        {i < questions.length - 1 ? (
          <button onClick={() => setI(i + 1)} className={primaryButton}>Berikutnya<ChevronRight aria-hidden className="size-4" /></button>
        ) : (
          <button onClick={() => submit()} disabled={sending || offline} className={primaryButton}>
            {!sending && <Send aria-hidden className="size-4" />}
            {sending ? "Mengumpulkan..." : "Kumpulkan"}
          </button>
        )}
      </div>
      <p aria-live="polite" className="mt-3 text-right text-sm text-red-500 empty:hidden">{error}</p>

      <nav aria-label="Daftar soal" className="mt-10 border-t border-zinc-800/80 pt-6">
        <ol className="grid grid-cols-[repeat(auto-fill,minmax(2.75rem,1fr))] gap-2">
          {questions.map((qq, n) => {
            const isDoubt = doubts.includes(qq.id);
            const done = answers[qq.id] !== undefined;
            return (
              <li key={qq.id}>
                <button
                  onClick={() => setI(n)}
                  aria-current={n === i ? "step" : undefined}
                  aria-label={`Soal ${n + 1}${done ? ", dijawab" : ""}${isDoubt ? ", ragu-ragu" : ""}`}
                  className={`relative grid size-11 place-items-center rounded-lg border font-mono text-sm tabular-nums focus-visible:outline-2 focus-visible:outline-accent ${
                    n === i ? "border-zinc-50" : isDoubt ? "border-accent-warm/60" : done ? "border-accent/40" : "border-zinc-800"
                  } ${done ? "bg-accent/10" : ""}`}
                >
                  {n + 1}
                  {isDoubt && <span aria-hidden className="absolute top-1 right-1 size-1.5 rounded-full bg-accent-warm" />}
                </button>
              </li>
            );
          })}
        </ol>
        <p className="mt-3 text-xs text-zinc-500 tabular-nums">
          {answered} dari {questions.length} dijawab
          {doubts.length > 0 && `, ${doubts.length} ragu-ragu`}
        </p>
        <button onClick={() => submit()} disabled={sending || offline} className="mt-4 min-h-11 text-sm text-zinc-400 hover:text-zinc-50 disabled:opacity-40">
          Kumpulkan sekarang
        </button>
      </nav>
    </div>
  );
}
