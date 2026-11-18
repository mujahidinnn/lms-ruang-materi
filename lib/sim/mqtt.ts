// MQTT topic filter match: `+` is one level, `#` is the rest (last only).
export function matches(filter: string, topic: string): boolean {
  const f = filter.split("/");
  const t = topic.split("/");
  for (let i = 0; i < f.length; i++) {
    if (f[i] === "#") return i === f.length - 1;
    if (i >= t.length || (f[i] !== "+" && f[i] !== t[i])) return false;
  }
  return f.length === t.length;
}
