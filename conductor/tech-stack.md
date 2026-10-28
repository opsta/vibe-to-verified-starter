# Technology Stack

## Languages & Core Tools

- **Language:** TypeScript (`~7.0.2`, ES2022, strict mode enabled, bundler module resolution)
- **Build Tool & Dev Server:** Vite (`^8.3.5`)
- **Runtime / UI:** Vanilla TypeScript + standard DOM APIs (mounted via `src/ui/app.ts`)

## Backend & Data Store

- **Backend / Persistence:** Firebase (`^13.1.0`) — Firestore (`src/core/firestore-store.ts`) and Firebase Anonymous Auth (`src/main.ts`)
- **In-Memory Store:** `createMemoryStore()` (`src/core/memory-store.ts`) for local demo mode and unit/integration testing without network calls

## Testing & Verification

- **Test Runner:** Vitest (`^5.0.5`) with `jsdom` (`^30.1.3`) environment for UI tests in `src/ui/**/*.test.ts`
- **Firestore Rules Testing:** `@firebase/rules-unit-testing` (`^6.0.0`)
- **Contract Verification:** `npm run verify:contract` (`tsc --noEmit && vitest run && node scripts/check-core.mjs && node scripts/check-tests.mjs && node scripts/check.mjs`)

## Constraints

- **No Extra Dependencies:** Do not add packages to `package.json`.
- **Read-Only Core:** `src/core/` and all files listed in `CORE.lock` must never be modified.
