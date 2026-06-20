# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

> Per the note above: this is **Expo SDK 56**. APIs change between SDKs — check the versioned
> docs at https://docs.expo.dev/versions/v56.0.0/ before writing Expo/React Native code.

## Status

This repo is **startup boilerplate**, not a feature-complete app. It has the full dependency
stack, folder structure, and config in place, plus the template's starter screens. The MVP
screens, Drizzle schema, Supabase/API clients, Zustand stores, and i18n resources are still
to be implemented — most `src/` subfolders are empty (`.gitkeep`). It is the mobile half of a
two-repo project; the Express API lives in the sibling `studyai-companion-be`.

## Commands

Use Node 22 (`nvm use` — pinned in `.nvmrc`) and pnpm.

| Command | Purpose |
|---|---|
| `pnpm start` | Start Metro / Expo dev server (then press `a`/`i`/`w`, or scan for Expo Go) |
| `pnpm android` / `pnpm ios` / `pnpm web` | Start targeting a platform |
| `pnpm lint` | `expo lint` (ESLint, eslint-config-expo) |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm format` | Prettier write |
| `pnpm db:generate` | Generate Drizzle SQL migrations from `src/db/schema.ts` |

No test runner is configured yet. `expo-env.d.ts` is generated on first `expo start` and is
gitignored — if typecheck complains about missing CSS-module types, run `pnpm start` once.

## Architecture

- **Expo Router (file-based).** Routes live under `src/app/` (not the repo root). Route groups
  are scaffolded: `src/app/(auth)/` (login, register, email verification) and `src/app/(app)/`
  (dashboard, subjects, materials, exams, profile) — currently empty pending screens.
  `app.json` enables typed routes and the React Compiler; `"scheme": "studyaicompanionfe"` is
  the deep-link scheme used for OAuth redirects.
- **Path alias.** `@/*` → `src/*` (see `tsconfig.json`); `@/assets/*` → `assets/*`.
- **State split.** Zustand for global/UI state (session, theme, language); React Query for
  server state / data fetching from the Express backend. Stores belong in `src/store/`,
  clients in `src/lib/` (`supabase.ts`, react-query client, backend `api.ts`).
- **Offline-first data.** `expo-sqlite` + Drizzle ORM is the on-device cache (schema +
  migrations under `src/db/`). The MVP intent: screens read from SQLite first and sync to
  Supabase when connectivity returns (`@react-native-community/netinfo`); exam results taken
  offline are queued locally. `expo-file-system` caches PDFs/images; `expo-secure-store` holds
  the session token for offline login.
- **Env.** Public values use the `EXPO_PUBLIC_` prefix (`EXPO_PUBLIC_SUPABASE_URL`,
  `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `EXPO_PUBLIC_API_URL`) so they're inlined into the bundle —
  never put secrets here. The service-role key stays in the backend only.
- **i18n / theme.** i18next + expo-localization (Spanish/English, config + `locales/` under
  `src/i18n/`). Theme is RN `useColorScheme` + Zustand + AsyncStorage (light/dark), with token
  files under `src/theme/`.

## Gotchas

- **On-device OCR (ML Kit) needs a dev build, not Expo Go.** `@react-native-ml-kit/text-recognition`
  is installed and wrapped in `src/lib/ocr.ts`. It is native code absent from Expo Go, so it only
  works in a development build (`npx expo run:android` or `eas build --profile development`) or a
  production build — calling it in Expo Go throws a linking error. The package uses the legacy
  native-module bridge (no TurboModule codegen); it runs under RN 0.85's new-arch interop. No Expo
  config plugin is required — autolinking handles it during prebuild. `expo-dev-client` is installed
  and build profiles live in `eas.json`.
- **ESLint is pinned to v9**, not 10 — `eslint-config-expo`'s bundled `eslint-plugin-react` is
  incompatible with ESLint 10. Don't bump it without updating the Expo config.
- pnpm build-script approvals live in `pnpm-workspace.yaml` (`allowBuilds`), not `package.json`
  (pnpm v10+ moved this).
