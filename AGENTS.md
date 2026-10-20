# Agent notes

The app is Astro 7 (`output: "server"`, Vercel adapter) with React 19 islands.
GUIDELINE.md, "Architecture", is the map: pages in `src/pages`, server
functions in `lib/actions` reached through `/rpc/<name>`, the request store in
`lib/request.ts`. Read it before changing routing, auth, or data loading.
