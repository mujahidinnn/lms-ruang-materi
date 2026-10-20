const WEEKDAYS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

// This month, Monday first, with the days the learner studied filled in.
// `today` is YYYY-MM-DD in the learner's time zone; `studied` the same format.
export default function MonthCalendar({ today, studied }: { today: string; studied: Set<string> }) {
  const [y, m, d] = today.split("-").map(Number);
  const first = new Date(Date.UTC(y, m - 1, 1));
  const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const lead = (first.getUTCDay() + 6) % 7;
  const month = first.toLocaleDateString("id-ID", { month: "long", year: "numeric", timeZone: "UTC" });
  const iso = (day: number) => `${today.slice(0, 8)}${String(day).padStart(2, "0")}`;

  return (
    <div>
      <p className="font-semibold capitalize">{month}</p>
      <table className="mt-4 w-full table-fixed text-center text-sm tabular-nums">
        <caption className="sr-only">Hari belajar bulan ini</caption>
        <thead>
          <tr>{WEEKDAYS.map((w) => <th key={w} scope="col" className="pb-2 text-xs font-medium text-zinc-500">{w}</th>)}</tr>
        </thead>
        <tbody>
          {Array.from({ length: Math.ceil((lead + days) / 7) }, (_, row) => (
            <tr key={row}>
              {Array.from({ length: 7 }, (_, col) => {
                const day = row * 7 + col - lead + 1;
                if (day < 1 || day > days) return <td key={col} />;
                const on = studied.has(iso(day));
                return (
                  <td key={col} className="py-1">
                    <span
                      className={`mx-auto grid size-8 place-items-center rounded-full ${on ? "bg-primary font-semibold text-on-primary" : day > d ? "text-zinc-600" : "text-zinc-300"} ${day === d ? "ring-2 ring-accent ring-offset-2 ring-offset-zinc-900" : ""}`}
                    >
                      {day}
                      {on && <span className="sr-only"> (belajar)</span>}
                    </span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
