"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

// The signed-in learner's finished chapters and resume chapter for one
// topic, read with their own session and filtered to their user id.
export function useChapterProgress(topicId: string, chapterIds: string[]) {
  const [signedIn, setSignedIn] = useState(false);
  const [done, setDone] = useState<Set<string>>(new Set());
  const [lastChapterId, setLast] = useState<string | null>(null);
  const key = chapterIds.join(",");

  useEffect(() => {
    const db = createClient();
    db.auth.getSession().then(async ({ data }) => {
      const uid = data.session?.user.id;
      if (!uid) return;
      const [{ data: rows }, { data: p }] = await Promise.all([
        db.from("chapter_progress").select("chapter_id").eq("user_id", uid).in("chapter_id", key.split(",")),
        db.from("progress").select("last_chapter_id").eq("user_id", uid).eq("topic_id", topicId).maybeSingle(),
      ]);
      setSignedIn(true);
      setDone(new Set((rows ?? []).map((r) => r.chapter_id as string)));
      setLast((p?.last_chapter_id as string | null) ?? null);
    });
  }, [topicId, key]);

  const markDone = useCallback((id: string) => setDone((d) => new Set(d).add(id)), []);
  return { signedIn, done, lastChapterId, markDone };
}
