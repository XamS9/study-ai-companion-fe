# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

> Per the note above: this is **Expo SDK 56**. APIs change between SDKs — check the versioned
> docs at https://docs.expo.dev/versions/v56.0.0/ before writing Expo/React Native code.

## Status

The MVP is implemented: auth/profile flows, the bottom-tab app (dashboard, subjects,
materials, exams, history, profile), the Drizzle schema + offline read-through cache, the
typed `@/api` resource hooks, Zustand stores, and full English/Spanish i18n are all in place.
It is the mobile half of a two-repo project; the Express API lives in the sibling
`studyai-companion-be` and is reached via `EXPO_PUBLIC_API_URL`.

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

- **Expo Router (file-based).** Routes live under `src/app/` (not the repo root). Two groups:
  `src/app/(auth)/` (login, register, forgot/reset password, verify email) and `src/app/(app)/`,
  whose `(tabs)/` subgroup holds the bottom-tab stacks (dashboard `index`, subjects, exams,
  history, profile); `settings` and `diagnostics` sit beside the tabs and slide in over them.
  `src/app/_layout.tsx` wires the providers (gesture handler → safe area → React Query → `DbProvider`)
  and `useProtectedRoute` redirects between the `(auth)` and `(app)` groups on auth status —
  with a carve-out so the `reset-password` recovery session isn't bounced into the app.
  `app.json` enables typed routes and the React Compiler; `"scheme": "studyaicompanionfe"` is
  the deep-link scheme for OAuth/email-confirmation redirects (`createSessionFromUrl` in
  `src/lib/auth-oauth.ts`).
- **Path alias.** `@/*` → `src/*` (see `tsconfig.json`); `@/assets/*` → `assets/*`.
- **State split.** Zustand for global/UI state — `src/store/` holds `auth` (Supabase session +
  profile), `theme`, and `language` (the latter two hydrate from AsyncStorage on boot). React
  Query owns server state. Generic clients live in `src/lib/` (`supabase.ts`, `query-client.ts`,
  the backend `api.ts` fetch wrapper, `ocr.ts`, `storage.ts` for avatar upload). Per-resource
  React Query hooks live in **`src/api/`** (`subjects`, `materials`, `exams`, `dashboard`, `ai`),
  each exporting a `*Keys` query-key factory and typed against `src/api/types.ts`.
- **`api.ts` fetch wrapper.** `apiFetch`/`api.{get,post,patch,delete}` prefix `EXPO_PUBLIC_API_URL`,
  attach the current Supabase access token as a Bearer header, unwrap the backend's `{ error }`
  message on failure, and treat 204 as `undefined`. Auth/profile flows talk to Supabase directly
  and don't go through this.
- **Offline-first read-through cache.** Implemented, not aspirational. `src/api` data hooks use
  `useCachedQuery` (`src/db/cached-query.ts`): it seeds React Query `initialData` synchronously
  from SQLite, refetches in the background and writes the response back, and on network failure
  serves the cached copy instead of erroring. The sync SQLite reads/writes live in
  `src/db/cache.ts` — **every** call is wrapped in `safeRead`/`safeWrite` so a cache failure
  degrades to network-only and never crashes a screen. List writes replace the full set
  (`notInArray`) so server deletions propagate; dashboard/activity aggregates are stored as JSON
  blobs in the `appCache` key/value table. Mutations still require connectivity. `DbProvider`
  (`src/db/provider.tsx`) applies pending migrations before children render, but renders anyway
  on migration failure (cache degrades gracefully). `expo-secure-store` holds the session token
  for offline login.
- **Env.** Public values use the `EXPO_PUBLIC_` prefix (`EXPO_PUBLIC_SUPABASE_URL`,
  `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `EXPO_PUBLIC_API_URL`) so they're inlined into the bundle —
  never put secrets here. The service-role key stays in the backend only.
- **i18n / theme.** i18next + expo-localization (config in `src/i18n/`, strings in
  `locales/{en,es}.json`); device language is auto-detected on first launch, then the `language`
  store applies any persisted override. **All UI strings go through `t(...)`** — both locale
  files must stay in sync. Theme is `useColorScheme` + the `theme` Zustand store (system/light/dark);
  `useResolvedScheme`/`useTheme` (`src/hooks/use-theme.ts`) resolve the active scheme, and the
  color/spacing/type tokens live in **`src/constants/theme.ts`** (`Colors`, `Spacing`, `ThemeColor`).
  Prefer the themed primitives in `src/components/` (`themed-text`, `themed-view`, `ui/*`) over
  raw RN views so colors track the theme; styling is RN `StyleSheet`, not NativeWind.

## Gotchas

- **On-device OCR (ML Kit) needs a dev build, not Expo Go.** `@react-native-ml-kit/text-recognition`
  is installed and wrapped in `src/lib/ocr.ts`. It is native code absent from Expo Go, so it only
  works in a development build (`npx expo run:android` or `eas build --profile development`) or a
  production build — calling it in Expo Go throws a linking error. The package uses the legacy
  native-module bridge (no TurboModule codegen); it runs under RN 0.85's new-arch interop. No Expo
  config plugin is required — autolinking handles it during prebuild. `expo-dev-client` is installed
  and build profiles live in `eas.json`.
- **Feature-detect optional native modules** before touching them. A native module is `null` in
  Expo Go and in any dev build compiled before the package was added, so accessing it throws. Guard
  with `requireOptionalNativeModule('ExpoLocation') != null` (see `diagnostics.tsx`) and surface a
  status instead of crashing — relevant for `expo-location`, ML Kit OCR, and anything else native.
- **ESLint is pinned to v9**, not 10 — `eslint-config-expo`'s bundled `eslint-plugin-react` is
  incompatible with ESLint 10. Don't bump it without updating the Expo config.
- pnpm build-script approvals live in `pnpm-workspace.yaml` (`allowBuilds`), not `package.json`
  (pnpm v10+ moved this).
