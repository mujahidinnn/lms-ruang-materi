export const CLASSES = [
  { id: "1", label: "O(1)", name: "konstan", color: "#e8efd6", f: () => 1 },
  { id: "log", label: "O(log n)", name: "logaritmik", color: "#8fc5ea", f: (n: number) => Math.log2(n) },
  { id: "n", label: "O(n)", name: "linear", color: "#b5d36f", f: (n: number) => n },
  { id: "nlog", label: "O(n log n)", name: "linearitmik", color: "#f2c879", f: (n: number) => n * Math.log2(n) },
  { id: "n2", label: "O(n²)", name: "kuadratik", color: "#f5a98e", f: (n: number) => n * n },
  { id: "2n", label: "O(2ⁿ)", name: "eksponensial", color: "#c9a8ff", f: (n: number) => 2 ** n },
] as const;

const UNITS: [number, string][] = [[1e12, "triliun"], [1e9, "miliar"], [1e6, "juta"], [1e3, "ribu"]];

export function fmt(v: number): string {
  if (v >= 1e15) return "> 1 kuadriliun";
  if (v < 1000) return (Number.isInteger(v) ? String(v) : v.toFixed(1)).replace(".", ",");
  const [d, u] = UNITS.find(([d]) => v >= d)!;
  return `${(v / d).toFixed(1).replace(/\.0$/, "").replace(".", ",")} ${u}`;
}
