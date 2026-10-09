"use client";

import { useActionState, type ReactNode } from "react";
import type { RoadmapState } from "@/app/admin/roadmap/actions";

// A form whose action returns { error, ok }, shown under it.
export default function ActionForm({
  action,
  className,
  children,
}: {
  action: (state: RoadmapState, form: FormData) => Promise<RoadmapState>;
  className?: string;
  children: ReactNode;
}) {
  const [state, run, pending] = useActionState(action, {});
  return (
    <form action={run} className={className} aria-busy={pending}>
      {children}
      <p aria-live="polite" className={`basis-full text-sm empty:hidden ${state.error ? "text-red-500" : "text-accent"}`}>
        {state.error ?? state.ok}
      </p>
    </form>
  );
}
