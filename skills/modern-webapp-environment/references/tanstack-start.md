# TanStack Start Module

Use this module when the target app should follow a TanStack Start boundary pattern.

## Boundaries

- Routes in `src/routes/**` own URL structure, loaders, route guards, and UI composition.
- Server functions live in feature-local modules such as `src/features/<feature>/api/functions.ts`.
- Feature-local dependency wiring lives next to server functions, for example `src/features/<feature>/api/dependencies.ts`.
- Server-only dependencies such as database clients, Node built-ins, secrets, and process env belong behind `@tanstack/react-start/server-only` boundaries.
- External/discoverable HTTP APIs can be mounted through request middleware in `src/start.ts`.

## Minimal Files

```text
src/router.tsx
src/start.ts
src/routes/__root.tsx
src/routes/index.tsx
vite.config.ts
```

## Vite Plugins

Use TanStack Start, React, Tailwind when selected by the target repo, and Nitro for production preview:

```ts
import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { nitro } from "nitro/vite";

export default defineConfig({
  resolve: { dedupe: ["react", "react-dom"], tsconfigPaths: true },
  plugins: [nitro(), tailwindcss(), tanstackStart(), viteReact()],
});
```

If the app exposes third-party HTTP endpoints, mount them in `src/start.ts` via request middleware and let unmatched requests call `next()`.
