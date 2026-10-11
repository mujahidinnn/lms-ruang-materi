"use client";

import { useEffect } from "react";
import { celebrate, playWin } from "@/lib/feedback";

// Fires the "dorr" once when a passed exam result appears.
export default function Celebrate() {
  useEffect(() => {
    playWin();
    celebrate();
  }, []);
  return null;
}
