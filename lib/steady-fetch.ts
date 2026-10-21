// fetch for long local scripts (imports): a dropped connection (fetch throws
// before any response) is retried with backoff for about 30 s. An import
// makes ~100 requests, and one flaky packet used to fail it whole. Answers
// with an error status are returned as they are.
export async function steadyFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  for (let n = 0; ; n++) {
    try {
      return await fetch(input, init);
    } catch (e) {
      if (n >= 5 || init?.signal?.aborted) throw e;
      await new Promise((r) => setTimeout(r, 1000 * 2 ** n));
    }
  }
}
