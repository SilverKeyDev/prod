# SilverKey Client

TypeScript/React frontend: web app (`apps/web`) and React Native app (`apps/mobile`). Shared logic lives in `packages/`; UI lives in each app (or future shared `packages/ui`).

## Quick start

From repo root: `cd Client && pnpm install && pnpm dev:web`. See root [README.md](../README.md) for full setup.

## Running the mobile app (React Native / Expo)

The **web** dev stack is started by `./run-web.sh` (Flask + Vite). The **mobile** app is served by Metro on port 8081 and is **not** started by `run-web.sh`.

- To run the mobile app in the simulator/device: `cd Client && pnpm dev:mobile` (then press `i` for iOS or `a` for Android).
- To run the mobile app in the **browser** (Expo web): start Metro with `pnpm dev:mobile`, then open the URL Expo prints (e.g. `http://localhost:8081/apps/mobile/`). If you see a **404** for `index.ts.bundle` and "MIME type 'application/json' not executable", Metro wasn’t running or the path rewrite didn’t apply — ensure you started Metro from `Client` and try a cache reset: `pnpm dev:mobile -- --clear`. For API and health checks to hit the backend instead of Metro, set `EXPO_PUBLIC_API_BASE_URL=http://localhost:5000` (or your backend URL) in `.env` or your shell.

## Where to read more

- **Architecture and layers:** [.cursor/rules/frontend/frontend-architecture.mdc](../.cursor/rules/frontend/frontend-architecture.mdc) and [documentation/client/thin-app-architecture.md](../documentation/client/thin-app-architecture.md)
- **Lint and checks:** [documentation/client/LINTING.md](../documentation/client/LINTING.md)
- **Web-only / desktop-only files:** [.cursor/rules/frontend/platform-file-extensions.mdc](../.cursor/rules/frontend/platform-file-extensions.mdc)
- **Canonical docs (packages, platform, lint reference):** [documentation/client/](../documentation/client/README.md)
