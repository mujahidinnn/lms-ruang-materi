import { type ReactNode, useState } from "react";
import Frame, { simButton, simGhost } from "./Frame";

// Layers from the top down; each adds its own header on the way out.
const LAYERS = [
  { name: "Aplikasi", unit: "Data", header: "", note: "Browser menyiapkan permintaan HTTP: isi pesan yang ingin dikirim.", color: "#e8efd6" },
  { name: "Transport", unit: "Segmen", header: "Header TCP", note: "TCP menambah header: port asal dan tujuan, nomor urut.", color: "#b5d36f" },
  { name: "Internet", unit: "Paket", header: "Header IP", note: "IP menambah header: alamat IP asal dan tujuan.", color: "#f2c879" },
  { name: "Akses jaringan", unit: "Frame", header: "Header Ethernet", note: "Ethernet menambah header dan trailer: alamat MAC dan pemeriksa kesalahan.", color: "#8fc5ea" },
];

// Boxes inside boxes: the outermost layer is the last header added.
function Nest({ depth, children }: { depth: number; children: ReactNode }): ReactNode {
  if (depth === 0) return children;
  const l = LAYERS[depth];
  return (
    <div key={depth} className="sim-pop relative rounded-xl border-2 px-2.5 pt-6 pb-2.5" style={{ borderColor: l.color, background: `${l.color}1a` }}>
      <span className="absolute top-1 left-2 text-[11px] font-bold" style={{ color: l.color }}>{l.header}</span>
      <Nest depth={depth - 1}>{children}</Nest>
      {depth === 3 && <span className="mt-2 block rounded-md px-2 py-0.5 text-center text-[11px] font-bold text-[#12140d]" style={{ background: l.color }}>Trailer (pemeriksa kesalahan)</span>}
    </div>
  );
}

export default function Enkapsulasi({ title }: { title: string }) {
  const [step, setStep] = useState(0);
  // 0..3 wraps going down; 4..6 unwraps at the receiver.
  const down = step <= 3;
  const depth = down ? step : 6 - step;
  const caption = down ? LAYERS[depth].note : `Penerima membuka ${LAYERS[depth + 1].header.toLowerCase()} dan meneruskan sisanya ke atas.`;

  return (
    <Frame title={title} hint="Maju satu langkah untuk melihat data dibungkus di pengirim, lalu dibuka lapis demi lapis di penerima.">
      <div className="sim-stage p-3 sm:p-4">
        <div className="flex items-center gap-2 text-xs font-bold" aria-hidden>
          <span className={down ? "text-[#b5d36f]" : "text-zinc-500"}>Pengirim</span>
          <div className="flex flex-1 items-center">
            {Array.from({ length: 7 }, (_, i) => (
              <div key={i} className="flex flex-1 items-center last:flex-none">
                <span className={`size-3 shrink-0 rounded-full ${i === step ? "bg-[#b5d36f] shadow-[0_0_10px_#b5d36f]" : i < step ? "bg-[#6b7d3c]" : "bg-zinc-700"}`} />
                {i < 6 && <span className={`h-0.5 flex-1 ${i === 3 ? "border-t-2 border-dashed border-zinc-500 bg-transparent" : i < step ? "bg-[#6b7d3c]" : "bg-zinc-700"}`} />}
              </div>
            ))}
          </div>
          <span className={!down ? "text-[#b5d36f]" : "text-zinc-500"}>Penerima</span>
        </div>

        <div className="mt-4 grid min-h-52 place-items-center" role="img" aria-label={`${LAYERS[depth].unit}: data dibungkus ${depth} lapis header`}>
          <div className="w-full max-w-sm">
            <Nest depth={depth}>
              <div className="rounded-lg bg-[#e8efd6] px-3 py-4 text-center font-extrabold text-[#12140d]">Data: GET /index.html</div>
            </Nest>
          </div>
        </div>
        <p className="text-center text-sm font-extrabold" style={{ color: LAYERS[depth].color }}>{LAYERS[depth].unit}</p>
      </div>

      <div className="mt-3 grid grid-cols-4 gap-1 text-center text-xs font-bold">
        {LAYERS.map((l, i) => (
          <div key={l.name} aria-current={i === depth ? "step" : undefined} className="rounded-xl px-1 py-2 aria-[current=step]:text-[#12140d] bg-zinc-800 text-zinc-400" style={i === depth ? { background: l.color } : undefined}>{l.name}</div>
        ))}
      </div>
      <p aria-live="polite" className="mt-3 min-h-12 text-sm text-zinc-300">{caption}</p>

      <div className="mt-2 flex flex-wrap gap-2">
        <button type="button" disabled={step === 0} onClick={() => setStep(step - 1)} className={simGhost}>Mundur</button>
        <button type="button" disabled={step === 6} onClick={() => setStep(step + 1)} className={simButton}>{step < 3 ? "Bungkus lagi" : step === 3 ? "Kirim lewat kabel" : "Buka lapisan"}</button>
        {step > 0 && <button type="button" onClick={() => setStep(0)} className="min-h-11 px-2 text-sm text-zinc-400 underline underline-offset-2">Ulangi</button>}
      </div>
    </Frame>
  );
}
