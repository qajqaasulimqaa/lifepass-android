# LifePass

LifePass is a wellness membership app for discovering and booking venues — gyms, pools, spas, geothermal lagoons, yoga and more — across Iceland. This repository is the **React Native (Expo) rebuild** of the original native Swift iOS app, delivering a single codebase for **iOS and Android**.

## Features

- **Home** — personalised greeting, live weather-based suggestions, your next upcoming booking, and a "Most Popular Now" shelf ranked by review volume.
- **Explore** — searchable venue list + map (`react-native-maps`), collapsible filters (plan/premium + category groups).
- **Coach** — an AI concierge that recommends venues from natural-language prompts, backed by Claude (Anthropic) through a server-side proxy.
- **Bookings** — upcoming and past bookings.
- **Account** — subscription/plan, profile, top-ups.
- Venue detail, check-in, auth (Supabase), and push notifications.

## Tech stack

| Area | Choice |
|------|--------|
| Framework | [Expo](https://docs.expo.dev/versions/v54.0.0/) SDK 54, React Native 0.81, React 19 |
| Language | TypeScript 5.9 |
| Navigation | React Navigation v7 (native-stack + bottom-tabs) with a custom tab bar |
| Auth & data | Supabase (`@supabase/supabase-js`) + the LifePass REST API proxy |
| State | Zustand |
| Maps | `react-native-maps` |
| Native modules | `expo-camera`, `expo-location`, `expo-notifications`, `expo-av`, `expo-speech-recognition`, `expo-linear-gradient` |
| AI | Claude (Anthropic Messages API) via `api/coach.mjs` |

## Prerequisites

- **Node.js 20+** (uses `node --env-file`)
- **npm**
- The **Expo Go** app on your phone (quick start), or Xcode / Android Studio for native dev builds
- A Supabase project and access to the LifePass backend API

## Getting started

```bash
# 1. Install dependencies
npm install

# 2. Create your local env file (see "Environment variables" below)
#    .env.local is git-ignored — never commit secrets.

# 3. Start the Metro bundler for Expo Go
npx expo start -c --go
```

Then make sure your phone and computer are on the **same Wi-Fi network** and open the project:

- **iOS** — scan the QR code with the built-in **Camera** app (it hands off to Expo Go).
- **Android** — scan the QR code from **inside the Expo Go** app.

> `-c` clears the Metro cache; `--go` forces Expo Go mode. This project also has `expo-dev-client` installed, so without `--go` the CLI targets a custom dev build instead.

### Expo Go vs. a dev build

Most of the app runs in **Expo Go**, but some native features (notably **push notifications** and parts of camera/speech) are limited or unavailable there. For full native behaviour, build and run a dev client:

```bash
npx expo run:ios       # iOS dev build (requires Xcode)
npx expo run:android   # Android dev build (requires Android Studio)
```

## The Coach API

The AI Coach never ships the Anthropic key to the client. The app calls a small server (`api/coach.mjs`) that proxies the Anthropic Messages API, applies bearer auth and per-user rate limiting, and returns a normalized reply.

Run it locally:

```bash
# Put your Anthropic key in .env.local at the repo root:
#   ANTHROPIC_API_KEY=sk-ant-...
node --env-file=.env.local api/coach.mjs
# → listening on http://127.0.0.1:8787
```

Point the app at it by setting `EXPO_PUBLIC_LIFEPASS_API_URL` to your API base (see below). `api/coach.mjs` is also written as a Vercel-style handler — drop it into a Vercel project's `/api` folder and set `ANTHROPIC_API_KEY` in the project's environment.

## Environment variables

Variables prefixed `EXPO_PUBLIC_` are bundled into the app and read on the client. Everything else is **server-side only** and must never be exposed to the client.

| Variable | Where | Required | Description |
|----------|-------|----------|-------------|
| `EXPO_PUBLIC_SUPABASE_URL` | client | ✅ | Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | client | ✅ | Supabase anon/public key |
| `EXPO_PUBLIC_LIFEPASS_API_URL` | client | optional | LifePass REST base (defaults to `https://www.lifepass.is/api/v1`) |
| `ANTHROPIC_API_KEY` | server (`api/coach.mjs`) | ✅ for Coach | Anthropic API key — server-side only |
| `COACH_DAILY_LIMIT` | server (`api/coach.mjs`) | optional | Per-user daily message cap (default `10`) |

Env is loaded from `.env` and `.env.local` (the latter git-ignored). Never commit real keys.

## Project structure

```
src/
├── api/          # LifePass REST client (bearer auth in front of Supabase)
├── coach/        # Coach conversation logic
├── components/   # Shared UI (BrandedTopBar, Wordmark, BookItPill, …)
├── data/         # Static data (categories, coach categories & questions)
├── hooks/        # Custom hooks (e.g. useWeather)
├── navigation/   # Tab navigator, custom tab bar, stacks
├── screens/      # account · auth · booking · bookings · checkin · coach · explore · home · venue
├── services/     # Non-Supabase services (weather, notifications)
├── stores/       # Zustand stores (authStore)
├── supabase/     # Supabase client, hooks, services, types
├── theme/        # Colors / design tokens
├── types/        # Shared TypeScript types
└── utils/
api/              # Coach API proxy (local dev + Vercel handler)
```

## Scripts

| Command | What it does |
|---------|--------------|
| `npm start` | Start Metro (add `-c --go` for a clean Expo Go run) |
| `npm run ios` | Build & run the iOS dev client |
| `npm run android` | Build & run the Android dev client |
| `npm run web` | Run in the browser (limited; maps/native modules degrade) |
| `npx tsc --noEmit` | Type-check the project |

## Notes

- **Expo is pinned to SDK 54.** Read the versioned docs at <https://docs.expo.dev/versions/v54.0.0/> before adding or upgrading packages.
- **Android is edge-to-edge** (`edgeToEdgeEnabled: true`). Screens draw behind the system bars — use `react-native-safe-area-context` for insets, and handle the keyboard by measured height for bottom-anchored inputs.
- This app mirrors the original native Swift iOS app as its design source of truth; UI and behaviour are kept at parity across both.
