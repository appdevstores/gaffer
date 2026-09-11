# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

# Gaffer — project notes

Youth-soccer offline-first match-day manager (React Native + Expo SDK 57, TypeScript).
All data lives in a local SQLite DB (`expo-sqlite`, file `gaffer.db`). No cloud.

## Commands

- `npm run start` — Expo dev server (iOS/Android via Expo Go, or press `w` for web)
- `npm run ios` / `npm run android` — dev build on simulator/device
- `npx tsc --noEmit` — typecheck
- `npx expo export --platform all` — production bundle check (iOS + Android + web)
- `node scripts/serve-dist.mjs 8082` — serve the static web export with COOP/COEP headers (required by wa-sqlite); preview at http://localhost:8082

## Gotchas

- `metro.config.js` must keep `config.resolver.assetExts.push('wasm')` for expo-sqlite web support.
- Web dev mode (`expo start --web`) currently fails to bundle expo-sqlite's worker chunk
  ("Worker chunk not found") in SDK 57 — use the static export + serve-dist.mjs for web preview.
- There is no server-side component; storage purge (§7.B) deletes rows from `matches`,
  `match_players`, and `match_events` within one transaction.
- Premium (§8): v1.x is hardcoded unlocked (`isPremiumUnlocked()`); the v2 receipt-check seam
  lives in `src/core/premium.ts`.

## TestFlight / App Store builds

Prereqs: paid Apple Developer Program account, Expo account (`eas login`), and
App Store Connect agreement accepted.

- `eas login` — authenticate with your Expo account (interactive, run yourself)
- `eas build --platform ios --profile production` — cloud build of the .ipa
  (first run prompts to create the Apple distribution cert + provisioning
  profile; EAS will ask you to sign in to your Apple account)
- `eas submit --platform ios --profile production` — creates/updates the app in
  App Store Connect and uploads the build → then add it to TestFlight there
- Bundle ID: `com.gaffer.app` · `eas.json` has development/preview/production
  profiles; `preview` = internal distribution, `production` = TestFlight/App Store

## Layout

- `src/app/` — expo-router screens (gate → season → setup-match → match → storage)
- `src/core/` — types, SQLite schema/migrations, repo, premium
- `src/state/MatchProvider.tsx` — live match engine (clock, two-tap substitution, goals, flip)
- `src/components/` — PitchField (canvas + animations), Scoreboard, BenchRoster, tokens, etc.
- `src/lib/` — formations matrix, avatars, mailto export
