# Study AI Companion — Mobile (Expo)

React Native + Expo (SDK 56) frontend for the Study AI Companion MVP. Uses Expo Router
(file-based), Zustand + React Query for state/data, expo-sqlite + Drizzle for the offline
cache, Supabase for auth/storage, and i18next for Spanish/English.

> This repository currently contains the **startup boilerplate only** — dependencies,
> folder structure, and config. Feature code (screens, DB schema, API clients, stores)
> is implemented in a later session.

## Setup

```bash
nvm use                # Node 22 (pinned in .nvmrc; run `nvm install` once if missing)
pnpm install
cp .env.example .env   # fill in Supabase + API values
pnpm start             # or: pnpm android / pnpm ios / pnpm web
```

## Project structure

```
src/
├── app/              # Expo Router routes (file-based)
│   ├── (auth)/       # login, register, email verification (to be added)
│   └── (app)/        # dashboard, subjects, materials, exams, profile (to be added)
├── components/       # shared UI components (template starters included)
├── features/         # feature modules (subjects, materials, exams, auth…)
├── lib/              # supabase client, react-query client, backend API client
├── db/               # drizzle schema + migrations (expo-sqlite offline cache)
├── store/            # zustand stores (session, theme, language)
├── i18n/             # i18next config + locales/{en,es}.json
├── theme/            # color tokens, light/dark
├── hooks/  types/  constants/
```

The `@/*` path alias maps to `src/*` (see `tsconfig.json`).

## Scripts

| Script | Purpose |
|---|---|
| `pnpm start` | Start Metro / Expo dev server |
| `pnpm lint` | ESLint (eslint-config-expo) |
| `pnpm format` | Prettier write |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm db:generate` | Generate Drizzle SQL migrations from `src/db/schema.ts` |

## On-device OCR (ML Kit) — requires a dev build

`@react-native-ml-kit/text-recognition` (Google ML Kit, free, offline) is installed and wrapped
in `src/lib/ocr.ts`. It is **native code, so it does not run in Expo Go** — you must use a
development build (or any production/EAS build). Capture an image with expo-camera /
expo-image-picker and pass its `uri` to `recognizePlainText(uri)`.

**Android local-build prerequisites (verified working):**
- A full **JDK 17** — `openjdk-17-jdk`, *not* just the JRE. Without `javac`, Gradle 9.3.1
  tries to download a toolchain via the foojay plugin and crashes with
  `NoSuchFieldError: IBM_SEMERU`. Install: `sudo apt install openjdk-17-jdk`.
- `JAVA_HOME` and `ANDROID_HOME` exported in your shell (`~/.profile`):
  `JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64`, `ANDROID_HOME=$HOME/Android/Sdk`,
  with `$ANDROID_HOME/platform-tools` and `$ANDROID_HOME/emulator` on `PATH`.
- The **first** build auto-downloads NDK `27.1.12297006` + CMake `3.22.1` (licenses must be
  accepted — Android Studio does this) and takes ~12 min; later builds are far faster.

Build a dev client one of two ways:

```bash
# A) Local build — free, needs Android Studio (Android) or Xcode/macOS (iOS)
npx expo run:android        # builds + installs a dev client on device/emulator

# B) EAS cloud build — no local native toolchain needed
npm i -g eas-cli
eas login
eas build --profile development --platform android   # see eas.json
```

After installing the dev client once, run `pnpm start` and open the app through it (not Expo Go);
Fast Refresh works as normal.

### EAS free tier

EAS Build has a **free plan**: a limited number of builds per month on a shared (lower-priority)
queue — fine for occasional dev/preview builds, slower waits at peak. Paid plans add priority and
higher limits. Check current quotas at https://expo.dev/pricing. On Linux, **local Android builds
(`npx expo run:android`) are unlimited and free**; iOS builds require macOS/Xcode or EAS.

## Other follow-ups

- OAuth provider credentials (Google, GitHub, Microsoft) and the Supabase redirect URI must be
  configured in each provider console and the Supabase dashboard.

---

_Generated from [`create-expo-app`](https://www.npmjs.com/package/create-expo-app); original template notes below._

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

### Other setup steps

- To set up ESLint for linting, run `npx expo lint`, or follow our guide on ["Using ESLint and Prettier"](https://docs.expo.dev/guides/using-eslint/)
- If you'd like to set up unit testing, follow our guide on ["Unit Testing with Jest"](https://docs.expo.dev/develop/unit-testing/)
- Learn more about the TypeScript setup in this template in our guide on ["Using TypeScript"](https://docs.expo.dev/guides/typescript/)

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
