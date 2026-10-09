"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

// Records that a signed-in learner opened this topic (progress "sedang"),
// which also lets its flashcards join their schedule. getSession() reads the
// local cookie, so logged-out visits make no request. RLS checks the insert.
export default function MarkOpened({ topicId }: { topicId: string }) {
  useEffect(() => {
    const db = createClient();
    db.auth.getSession().then(({ data }) => {
      if (!data.session) return;
      db.from("progress").upsert({ topic_id: topicId }, { onConflict: "user_id,topic_id", ignoreDuplicates: true }).then();
    });
  }, [topicId]);
  return null;
}
