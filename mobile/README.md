# The Straight Path — Mobile App (iOS + Android)

Expo (React Native) app sharing the website's approved content. Payload CMS is
the editorial source; a published-and-verified snapshot is bundled before each store build
so reading remains available offline.

## How it works

- **Bundled snapshot**: `assets/content/*.json` is generated from the public,
  published CMS records by
  `npx tsx scripts/export-mobile-content.ts` (run from the repo root with the
  site running). First launch works fully offline.
- **Updates**: regenerate the published-and-verified snapshot before a store build. The
  current app does not fetch editorial records at runtime.
- **Screens**: Home (main paths + bookmarks + Christian learning path),
  Library (categories), Search, Glossary, article reader (bookmark + font
  size), category detail, section study-trees, Source Library.
- **Reader features** (Apple Guideline 4.2 defense): offline reading,
  bookmarks, adjustable font size, native search.
- Dark mode follows the system and mirrors the website palette.

## Develop

```bash
cd mobile
npm ci
npx expo start            # scan QR with Expo Go (Android/iOS)
npx expo start --web      # run in the browser
```

## Refresh the bundled content snapshot

From the repo root, with the site running:

```bash
npx tsx scripts/export-mobile-content.ts
```

Re-run before every store build so first-launch offline content is current.
Production EAS builds also run a mandatory snapshot gate. A build stops if any
article is not published, any citation or scripture record is not verified, or
placeholder evidence remains. Internal development builds may still preview
work in progress, but they are not release artifacts.

## Build for the stores (EAS — no Mac needed)

One-time setup (your accounts, cannot be automated):

1. Create an Expo account, install EAS: `npm i -g eas-cli`, `eas login`.
2. Apple Developer Program — $99/year (individual).
3. Google Play Console — $25 one-time. **Personal accounts must run a closed
   test with 12 testers for 14 continuous days before production access —
   start this early.**
4. Confirm the public website and privacy policy at
   `https://thestraightpathislam.com` are available.
5. Regenerate and review the bundled content snapshot.

Then:

```bash
eas build --platform android --profile production
eas build --platform ios --profile production     # cloud macOS build
eas submit --platform android
eas submit --platform ios
```

Store-listing guidance (religious content): present the app as a sourced,
educational comparative-religion library; keep screenshots focused on clear
articles, citations, offline reading, bookmarks, and search.

## Not yet included (deliberate v1 scope)

- Arabic UI locale + full RTL flip (the content model and CMS localization
  are ready; ship when verified Arabic content exists).
- Push notifications for new published articles.
- Comparison-article dedicated layout (renders as a standard article).
