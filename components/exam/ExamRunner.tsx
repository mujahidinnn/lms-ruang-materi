"use client";

import { ChevronLeft, ChevronRight, Send, WifiOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { kumpulkanUjian } from "@/app/ujian/actions";
import { primaryButton, secondaryButton, tile } from "@/components/ui/styles";

export type ExamQuestion = { id: string; prompt: string; code: string | null; options: string[] };
type Saved = { answers: Record<string, number>; doubts: string[] };


// No feedback until submit. Answers autosave to localStorage per attempt,
// leaving asks first, and the clock submits on its own at zero. The timer is
// text; its live region speaks only the 5 and 1 minute warnings.
export default function ExamRunner({ attemptId, secondsLeft, questions }: { attemptId: string; secondsLeft: number; questions: ExamQuestion[] }) {
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
  const warned = useRef(0);
  // Local deadline from the server's remaining seconds, not the device clock.
  const [deadline] = useState(() => Date.now() + secondsLeft * 1000);

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
    let res;
    try {
      res = await kumpulkanUjian(attemptId, answers);
    } catch {
      res = { error: "Koneksi terputus. Jawabanmu masih tersimpan, coba kumpulkan lagi." };
    }
    if (res.error) {
      // Not retried every second; the learner presses Kumpulkan again.
      sent.current = false;
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
      const s = Math.max(0, Math.round((deadline - Date.now()) / 1000));
      setLeft(s);
      // Thresholds, not exact seconds: a throttled tab can skip a second.
      if (s <= 60 && warned.current < 2) {
        warned.current = 2;
        setWarning("Sisa waktu 1 menit.");
      } else if (s <= 5 * 60 && warned.current < 1) {
        warned.current = 1;
        setWarning("Sisa waktu 5 menit.");
      }
      if (s === 0 && !error) submit(true);
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
      <div className="sticky top-3 z-10 flex items-center justify-between gap-4 rounded-full bg-zinc-900/90 py-2 pr-2 pl-5 shadow-soft backdrop-blur">
        <span className="text-sm text-zinc-400 tabular-nums">
          Soal {i + 1} dari {questions.length}
        </span>
        <span className={`rounded-full px-4 py-1.5 font-mono text-lg font-semibold tabular-nums ${low ? "bg-tile-peach text-zinc-50" : "bg-zinc-800 text-zinc-50"}`}>
          <span className="sr-only">Sisa waktu </span>
          {left === null ? "--:--" : `${String(Math.floor(left / 60)).padStart(2, "0")}:${String(left % 60).padStart(2, "0")}`}
        </span>
      </div>
      <p aria-live="assertive" className="sr-only">{warning}</p>
      {offline && (
        <p role="status" className="mt-4 flex items-center gap-2 rounded-2xl bg-tile-butter px-4 py-3 text-sm">
          <WifiOff aria-hidden className="size-4" /> Kamu sedang offline. Jawaban tetap tersimpan di perangkat ini.
        </p>
      )}

      <h2 className="mt-8 text-2xl leading-snug font-bold tracking-tight text-balance">{q.prompt}</h2>
      {q.code && (
        <pre className="scrollbar-thin mt-4 overflow-x-auto rounded-2xl bg-zinc-900 p-5 text-sm shadow-soft"><code className="font-mono">{q.code}</code></pre>
      )}

      <div role="group" aria-label="Pilihan jawaban" className="mt-6 grid gap-2">
        {q.options.map((opt, n) => (
          <button
            key={n}
            aria-pressed={answers[q.id] === n}
            onClick={() => setAnswers((a) => ({ ...a, [q.id]: n }))}
            className={`flex min-h-14 items-center gap-3 rounded-2xl border-2 bg-zinc-900 px-3 py-2.5 text-left shadow-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
              answers[q.id] === n ? "border-zinc-50" : "border-transparent hover:border-zinc-700"
            }`}
          >
            <span className={`grid size-8 shrink-0 place-items-center rounded-full text-xs font-semibold text-zinc-200 ${tile(n)}`}>{n + 1}</span>
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
          className={`${secondaryButton} disabled:opacity-40`}
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

      <nav aria-label="Daftar soal" className="mt-10 rounded-[28px] bg-zinc-800/50 p-5">
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
                  className={`relative grid size-11 place-items-center rounded-full text-sm font-medium tabular-nums focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                    n === i ? "bg-zinc-50 text-zinc-950" : isDoubt ? "bg-tile-butter" : done ? "bg-tile-mint" : "bg-zinc-900 shadow-soft"
                  }`}
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
