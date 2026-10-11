// Inserts `__lp();` at the start of every braced for/while/do body, so a
// runaway loop throws once the run is over its time limit even when it runs
// on the page's own thread. Strings, template literals and comments are
// skipped.
// ponytail: regex literals and brace-less loop bodies are not guarded; a
// parser (acorn) if exercises ever need them.
export function guardLoops(src: string): string {
  let out = "";
  let i = 0;
  const ident = (c: string | undefined) => !!c && /[\w$.]/.test(c);

  // Index just past a string, template literal or comment starting at j.
  const skip = (j: number): number => {
    const c = src[j];
    if (c === "/" && src[j + 1] === "/") {
      const end = src.indexOf("\n", j);
      return end < 0 ? src.length : end;
    }
    if (c === "/" && src[j + 1] === "*") {
      const end = src.indexOf("*/", j + 2);
      return end < 0 ? src.length : end + 2;
    }
    if (c === "'" || c === '"' || c === "`") {
      let k = j + 1;
      while (k < src.length && src[k] !== c) k += src[k] === "\\" ? 2 : 1;
      return k + 1;
    }
    return j;
  };

  // Index just past the ")" that closes the "(" at j.
  const closeParen = (j: number): number => {
    let depth = 0;
    for (let k = j; k < src.length; k++) {
      const s = skip(k);
      if (s !== k) {
        k = s - 1;
        continue;
      }
      if (src[k] === "(") depth++;
      else if (src[k] === ")" && --depth === 0) return k + 1;
    }
    return src.length;
  };

  const ws = (j: number) => {
    while (j < src.length && /\s/.test(src[j])) j++;
    return j;
  };

  while (i < src.length) {
    const s = skip(i);
    if (s !== i) {
      out += src.slice(i, s);
      i = s;
      continue;
    }
    const word = /^(for|while|do)\b/.exec(src.slice(i, i + 6));
    if (word && !ident(src[i - 1])) {
      let j = i + word[1].length;
      if (word[1] !== "do") {
        const open = ws(j);
        if (src[open] !== "(") {
          out += src[i++];
          continue;
        }
        j = closeParen(open);
      }
      const brace = ws(j);
      if (src[brace] === "{") {
        out += src.slice(i, brace + 1) + "__lp();";
        i = brace + 1;
        continue;
      }
      out += src.slice(i, j);
      i = j;
      continue;
    }
    out += src[i++];
  }
  return out;
}
