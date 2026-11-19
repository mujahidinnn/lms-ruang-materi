// Tooltips that work on touch: `title` never shows on phones, so elements
// carry `data-tip` instead. Hover (mouse) or tap/focus shows a small label
// clamped inside the viewport; it goes away on the next tap, scroll or after 3s.
export function installTips() {
  let el: HTMLElement | null = null;
  let timer: number | undefined;
  const hide = () => {
    clearTimeout(timer);
    el?.remove();
    el = null;
  };
  const show = (target: HTMLElement) => {
    hide();
    const text = target.dataset.tip;
    if (!text) return;
    el = document.createElement("div");
    el.setAttribute("role", "tooltip");
    el.className = "pointer-events-none fixed z-50 w-max max-w-[min(18rem,calc(100vw-1rem))] rounded-lg bg-noir px-3 py-1.5 text-xs font-medium text-on-noir shadow-soft";
    el.textContent = text;
    document.body.append(el);
    const r = target.getBoundingClientRect();
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    const left = Math.min(Math.max(8, r.left + r.width / 2 - w / 2), innerWidth - w - 8);
    const top = r.top - h - 8 < 8 ? r.bottom + 8 : r.top - h - 8;
    el.style.left = `${left}px`;
    el.style.top = `${top}px`;
    timer = window.setTimeout(hide, 3000);
  };
  const tip = (e: Event) => (e.target as Element | null)?.closest<HTMLElement>("[data-tip]") ?? null;
  document.addEventListener("pointerover", (e) => { if (e.pointerType === "mouse") { const t = tip(e); if (t) show(t); } });
  document.addEventListener("pointerout", (e) => { if (e.pointerType === "mouse" && tip(e)) hide(); });
  document.addEventListener("click", (e) => { const t = tip(e); if (t) show(t); else hide(); });
  document.addEventListener("focusin", (e) => { const t = tip(e); if (t) show(t); });
  document.addEventListener("focusout", hide);
  addEventListener("scroll", hide, { passive: true, capture: true });
}
