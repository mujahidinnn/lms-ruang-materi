import { beforeEach, expect, test, vi } from "vitest";

const calls: string[] = [];
let refuse = new Set<string>();
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: { getSession: async () => ({ data: { session: {} } }) },
    rpc: async (name: string, args: Record<string, string>) => {
      const id = args.p_chapter ?? args.p_exercise;
      calls.push(`${name}:${id}`);
      return { error: refuse.has(id) ? { message: "consent" } : null };
    },
  }),
}));
vi.mock("@/lib/rpc", () => ({ rpc: () => async () => ({ saved: true }) }));

const store = new Map<string, string>();
vi.stubGlobal("localStorage", {
  getItem: (k: string) => store.get(k) ?? null,
  setItem: (k: string, v: string) => void store.set(k, v),
  removeItem: (k: string) => void store.delete(k),
});
vi.stubGlobal("window", { dispatchEvent: () => true });
vi.stubGlobal("CustomEvent", class { constructor(public type: string) {} });

const { PENDING_KEY, flushPending, keepChapter, keepCode } = await import("./pending");

beforeEach(() => {
  calls.length = 0;
  store.clear();
  refuse = new Set();
});

test("sends code passes before chapters, then clears", async () => {
  keepChapter("bab1");
  keepCode({ rpc: "pass_code_exercise", param: "p_exercise", id: "ex1", code: {} });
  await flushPending();
  expect(calls).toEqual(["pass_code_exercise:ex1", "complete_chapter:bab1"]);
  expect(store.has(PENDING_KEY)).toBe(false);
});

test("keeps what the server refused for the next try", async () => {
  keepChapter("bab1");
  keepChapter("bab2");
  refuse = new Set(["bab2"]);
  await flushPending();
  expect(JSON.parse(store.get(PENDING_KEY)!).chapters).toEqual(["bab2"]);
});
