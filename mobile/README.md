# The Straight Path — Mobile App (iOS + Android)

Expo (React Native) app sharing content with the website. One content source:
the Payload CMS. Edit in `/admin` on the site → the site updates in seconds →
the app picks up changes on next launch via the content-manifest delta check.

## How it works

- **Bundled snapshot**: `assets/content/*.json` is generated from the CMS by
  `npx tsx scripts/export-mobile-content.ts` (run from the repo root with the
  site running). First launch works fully offline.
- **Live refresh**: if `EXPO_PUBLIC_API_URL` is set, the app checks
  `/api/content-manifest` on launch; when content changed it refetches and
  caches to AsyncStorage. No app-store release is ever needed for content.
- **Screens**: Home (main paths + bookmarks + Christian learning path),
  Library (categories), Search, Glossary, article reader (bookmark + font
  size), category detail, section study-trees, Source Library.
- **Reader features** (Apple Guideline 4.2 defense): offline reading,
  bookmarks, adjustable font size, native search.
- Dark mode follows the system and mirrors the website palette.

## Develop

```bash
cd mobile
npm install
npx expo start            # scan QR with Expo Go (Android/iOS)
npx expo start --web      # run in the browser
```

Set the API for live refresh in `.env` or the shell:
`EXPO_PUBLIC_API_URL=http://192.168.x.x:3000` (your machine's LAN IP so a
phone on the same Wi-Fi can reach the dev server).

## Refresh the bundled content snapshot

From the repo root, with the site running:

```bash
npx tsx scripts/export-mobile-content.ts
```

Re-run before every store build so first-launch offline content is current.

## Build for the stores (EAS — no Mac needed)

One-time setup (your accounts, cannot be automated):

1. Create an Expo account, install EAS: `npm i -g eas-cli`, `eas login`.
2. Apple Developer Program — $99/year (individual).
3. Google Play Console — $25 one-time. **Personal accounts must run a closed
   test with 12 testers for 14 continuous days before production access —
   start this early.**
4. Deploy the website + CMS publicly (Vercel + Neon Postgres per ROADMAP.md)
   and put the real URL into `eas.json` (`EXPO_PUBLIC_API_URL`) — replace
   `https://YOUR-DEPLOYED-SITE.example`.
5. Host a privacy policy page on the site (both stores require the URL; the
   app collects no data, keeping the forms trivial).

Then:

```bash
eas build --platform android --profile production
eas build --platform ios --profile production     # cloud macOS build
eas submit --platform android
eas submit --platform ios
```

Store-listing guidance (religious content): present the app as a sourced,
educational comparative-religion library; keep screenshots showing the
citation-first, source-pending design. See ROADMAP.md → "Store accounts and
submission" for the full review-posture notes (Apple 1.1/4.2, Play policies).

## Not yet included (deliberate v1 scope)

- Arabic UI locale + full RTL flip (the content model and CMS localization
  are ready; ship when verified Arabic content exists).
- Push notifications for new published articles.
- Comparison-article dedicated layout (renders as a standard article).
