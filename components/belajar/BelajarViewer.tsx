"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import PresentationViewer from "@/components/PresentationViewer";
import { createClient } from "@/lib/supabase/client";
import type { Topic } from "@/lib/content";

// The slide viewer plus the signed-in learner's progress: opening the topic
// marks it "sedang" (so its flashcards join the schedule), the viewer resumes
// at the last slide, and moving through slides saves it. getSession() reads
// the local cookie, so logged-out visits make no request.
export default function BelajarViewer({ presentation }: { presentation: Topic }) {
  const topic = presentation.id;
  const [resumeAt, setResumeAt] = useState<number | null>(null);
  const ready = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    const db = createClient();
    db.auth.getSession().then(async ({ data }) => {
      if (!data.session) return;
      const { data: row } = await db.from("progress").select("last_slide").eq("topic_id", topic).maybeSingle();
      await db.rpc("touch_progress", { p_topic: topic });
      if (row?.last_slide) setResumeAt(row.last_slide);
      ready.current = true;
    });
    return () => clearTimeout(timer.current);
  }, [topic]);

  const onSlide = useCallback(
    (i: number) => {
      if (!ready.current) return;
      clearTimeout(timer.current);
      timer.current = setTimeout(() => createClient().rpc("touch_progress", { p_topic: topic, p_slide: i }).then(), 1500);
    },
    [topic]
  );

  return <PresentationViewer presentation={presentation} resumeAt={resumeAt} onSlide={onSlide} />;
}
