# Local Deployment

## Normal Local Run

```bash
npm install
npm run dev
```

Open `http://127.0.0.1:3000`.

Production check:

```bash
npm run build
npm run start
```

## Codex Desktop Runtime

This workspace may not have `npm` on `PATH`, and the Codex-bundled Node runtime can reject the native Next.js SWC binary on macOS. For this local environment, keep npm/cache under `.tools/` and force the WASM compiler:

```bash
NEXT_TEST_WASM=1 NEXT_SWC_PATH=.tools/next-swc-cache \
  /Applications/Codex.app/Contents/Resources/node \
  .tools/package/bin/npm-cli.js run dev \
  --cache .tools/npm-cache -- --hostname 127.0.0.1
```

The committed app still uses ordinary Next.js/Vercel deployment. The WASM env is only a local runtime workaround.
