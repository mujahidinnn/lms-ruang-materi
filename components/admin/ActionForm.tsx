"use client";

import { useActionState, type ReactNode } from "react";

type FormState = { error?: string; ok?: string };

// A form whose action returns { error, ok }, shown under it.
export default function ActionForm({
  action,
  className,
  children,
}: {
  action: (state: FormState, form: FormData) => Promise<FormState>;
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
