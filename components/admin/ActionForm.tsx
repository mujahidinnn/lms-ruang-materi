"use client";

import { useActionState, type ReactNode } from "react";
import type { ActionName } from "@/lib/actions";
import { rpc } from "@/lib/rpc";

type FormState = { error?: string; ok?: string };

// A form whose action returns { error, ok }, shown under it. The action goes
// by name, because an island's props must be plain data.
export default function ActionForm({
  action,
  className,
  children,
}: {
  action: ActionName;
  className?: string;
  children: ReactNode;
}) {
  const [state, run, pending] = useActionState(rpc(action) as unknown as (state: FormState, form: FormData) => Promise<FormState>, {});
  return (
    <form action={run} className={className} aria-busy={pending}>
      {children}
      <p aria-live="polite" className={`basis-full text-sm empty:hidden ${state.error ? "text-red-500" : "text-accent"}`}>
        {state.error ?? state.ok}
      </p>
    </form>
  );
}
