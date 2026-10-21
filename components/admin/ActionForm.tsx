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
  ...data
}: {
  action: ActionName;
  className?: string;
  children: ReactNode;
  // data-confirm and friends (lib/confirm.ts).
  [key: `data-${string}`]: string | boolean | undefined;
}) {
  const [state, run, pending] = useActionState(rpc(action) as unknown as (state: FormState, form: FormData) => Promise<FormState>, {});
  return (
    <form action={run} className={className} aria-busy={pending} {...data}>
      {children}
      <p aria-live="polite" className={`basis-full text-sm empty:hidden ${state.error ? "text-red-500" : "text-accent"}`}>
        {state.error ?? state.ok}
      </p>
    </form>
  );
}
