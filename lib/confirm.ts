// One confirmation dialog for the whole app, in place of window.confirm:
// a native <dialog> (focus trap, Esc closes) styled like the rest.
//
// In script: if (await confirmDialog({ title: "Hapus?" })) ...
// On a form or a submit button, no script needed (installConfirmForms):
//   data-confirm="Judul" data-confirm-text="..." data-confirm-action="Hapus" data-confirm-danger
//   data-confirm-if="usia=" asks only when field usia has that value.

// nudge: the cancel button is the one we hope for (styled and focused as the
// main action), as in "Coba kuis dulu" against "Lewati saja".
export type ConfirmOptions = { title: string; text?: string; action?: string; cancel?: string; danger?: boolean; nudge?: boolean };

export function confirmDialog({ title, text, action = "Lanjutkan", cancel = "Batal", danger = false, nudge = false }: ConfirmOptions): Promise<boolean> {
  return new Promise((resolve) => {
    const d = document.createElement("dialog");
    d.className =
      "m-auto w-[min(28rem,calc(100vw-2rem))] rounded-[28px] border-2 border-noir bg-zinc-900 p-0 text-zinc-50 shadow-[6px_6px_0_0_var(--color-noir)] backdrop:bg-black/50 backdrop:backdrop-blur-sm";
    d.setAttribute("aria-labelledby", "konfirmasi-judul");
    const form = document.createElement("form");
    form.method = "dialog";
    form.className = "grid gap-5 p-6";
    const h = document.createElement("h2");
    h.id = "konfirmasi-judul";
    h.className = "text-xl font-bold tracking-tight";
    h.textContent = title;
    form.append(h);
    if (text) {
      const p = document.createElement("p");
      p.className = "-mt-3 text-sm leading-relaxed text-zinc-400";
      p.textContent = text;
      form.append(p);
    }
    const row = document.createElement("div");
    row.className = "flex flex-wrap justify-end gap-2";
    const no = document.createElement("button");
    no.value = "";
    no.textContent = cancel;
    const plain = "inline-flex min-h-11 items-center rounded-full bg-zinc-800 px-5 font-semibold hover:bg-zinc-700";
    const main = "inline-flex min-h-11 items-center rounded-full border-2 border-noir bg-primary px-5 font-bold text-on-primary";
    no.className = nudge ? main : plain;
    const yes = document.createElement("button");
    yes.value = "ya";
    yes.textContent = action;
    yes.className = danger
      ? "inline-flex min-h-11 items-center rounded-full bg-red-600 px-5 font-semibold text-white hover:bg-red-700"
      : nudge ? plain : main;
    row.append(no, yes);
    form.append(row);
    d.append(form);
    d.addEventListener("close", () => {
      resolve(d.returnValue === "ya");
      d.remove();
    });
    // A click on the backdrop cancels.
    d.addEventListener("click", (e) => e.target === d && d.close(""));
    document.body.append(d);
    d.showModal();
    // A destructive action starts on Batal, so Enter does no harm.
    (danger || nudge ? no : yes).focus();
  });
}

const confirmed = new WeakSet<HTMLFormElement>();

// Captures submits before React or the browser acts on them. A confirmed
// form is submitted again with the same submit button.
export function installConfirmForms() {
  document.addEventListener(
    "submit",
    (e) => {
      const form = e.target as HTMLFormElement;
      const submitter = (e as SubmitEvent).submitter as HTMLElement | null;
      const el = submitter?.dataset.confirm ? submitter : form.dataset.confirm ? form : null;
      if (!el) return;
      if (confirmed.has(form)) return void confirmed.delete(form);
      const only = el.dataset.confirmIf;
      if (only) {
        const [name, value] = only.split("=");
        if (String(new FormData(form).get(name) ?? "") !== value) return;
      }
      e.preventDefault();
      e.stopImmediatePropagation();
      confirmDialog({
        title: el.dataset.confirm!,
        text: el.dataset.confirmText,
        action: el.dataset.confirmAction,
        danger: "confirmDanger" in el.dataset,
      }).then((ok) => {
        if (!ok) return;
        confirmed.add(form);
        form.requestSubmit(submitter instanceof HTMLButtonElement || submitter instanceof HTMLInputElement ? submitter : undefined);
      });
    },
    true
  );
}
