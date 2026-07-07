# Roadmap — Editable Content + iOS/Android Mobile App

The plan for taking The Straight Path (الصراط المستقيم) from a static site with
content in code to: (1) content editable from any device through an admin UI,
(2) a professional installable phone experience, and (3) native iOS and
Android apps that share the same content — edit once, both update.

Synthesized from a codebase audit plus three independently designed
architecture proposals (optimized for speed, quality, and solo-maintainer
cost). Two of three designs independently chose Payload CMS; all three chose
the same mobile path (PWA → Expo/React Native).

---

## Decisions

| Question | Decision | Why |
| --- | --- | --- |
| CMS | **Payload CMS 3**, embedded inside this Next.js app at `/admin` | Installs into this repo (one codebase, one deploy). Schemas map 1:1 from `types/content.ts`. Built-in drafts/versions implement the draft → under-review → published workflow. A publish hook can **hard-block publishing any article citing an unverified source** — the no-fabrication constitution becomes enforced code. Built-in `en`/`ar` localization for the Arabic milestone. Auto-generated REST API feeds the mobile app for free. $0 software cost. |
| Mobile | **Stage A: PWA now. Stage B: Expo (React Native) app** built via EAS Build cloud | PWA is 2–3 days and makes the site installable/offline immediately. Expo reuses TypeScript, React knowledge, and the shared content types; EAS Build compiles signed iOS binaries in the cloud — **no Mac needed on Windows 11**. |
| Rejected | Capacitor WebView wrapper | Apple Guideline 4.2 ("minimum functionality") routinely rejects websites repackaged as apps — the exact profile of this site in a wrapper. |
| Rejected | Flutter | New language (Dart), zero reuse of the TypeScript types/logic, no benefit for a text-centric reading app. |
| Rejected | Sanity / Strapi / Directus | Content leaves the repo into a third-party cloud (Sanity), or a second server to run forever (Strapi/Directus). |
| Lighter alternative | Keystatic (git-based CMS) | Keeps the site 100% static with zero database ($0, simplest ops) — but weaker editorial workflow, no instant publish, and editing leaks git concepts (branches/PRs) to the editor. Choose this only if avoiding a database matters more than editing comfort. |

**Costs:** Payload is free (MIT). Hosting: Vercel free tier + Neon Postgres
free tier ≈ $0/mo. Apple Developer $99/year. Google Play $25 one-time.
EAS Build free tier suffices for a solo release cadence (paid $19/mo only if
needed at launch).

---

## Track 1 — Editable content (Payload CMS)

### Phase 0 — Consolidate the content seam (2–4 days, pure refactor, no new deps)
The audit found ~17 files importing data files directly, bypassing `lib/content`.
Fix the seam before adding a CMS so refactor bugs are isolated from CMS bugs:

- Split `types/content.ts`: React-free domain types (`types/domain.ts`) vs UI prop types — the mobile app will import the domain types.
- Route `data/site.ts`, `data/home.ts`, and the 4 tree files behind new `lib/content` helpers; update the 10 category pages, homepage, 4 section pages, `SiteNavigation`, `SiteFooter`.
- Move `getCategoryMetadata` (Next-specific) out of `data/site.ts` into `lib/seo.ts`.
- Flip every `lib/content` helper to `async` now, while they still read local arrays (behavior-identical, verifiable), absorbing the ripple through `CategoryPage`, `sitemap.ts`, `generateMetadata`.
- Decide draft visibility deliberately: today all 13 drafts are publicly routable and in the sitemap; add a published-only filter option.
- Delete dead exports (`getGlossaryTerm`, `getSourceLibraryItems`, `data/content/index.ts`).

### Phase 1 — Install Payload + model the schema (4–6 days)
- Add Payload 3 (`@payloadcms/next`), SQLite locally / Neon Postgres in production; admin at `/admin`.
- Collections mirroring the domain types: articles, citations, glossary, Quran/Bible verses, comparison articles, source library; globals for home + trees. Closed unions (`CategorySlug`, `TopicTag`) become fixed-option select fields.
- **Enable `en`/`ar` localization on day one** (retrofitting localization later is a painful migration).
- Enable versions + drafts; editorial statuses draft / under-review / published; `pending`/`verified` on citations and sources.

### Phase 2 — Migrate data + constitution-as-code (2–4 days)
- Seed script imports the existing `data/content/*.ts`, materializes factory defaults, writes via Payload's Local API — placeholders preserved exactly, nothing invented.
- **The no-fabrication gate:** a `beforeChange` hook rejects `published` status unless every linked citation/source is `verified` and no `[VERIFIED ... PENDING]` placeholder remains.
- Parity script diffing Payload output vs the old TS arrays; keep the old data files frozen in-repo as rollback until cutover passes.
- Nightly database backup (Neon point-in-time restore + pg_dump artifact).

### Phase 3 — Cut the website over to Payload (3–5 days)
- Rewrite `lib/content` helper bodies as Local API queries (signatures already async from Phase 0 — callers untouched).
- On-demand revalidation hooks: publishing from the admin updates the live site **in seconds, no rebuild, no redeploy**.
- Draft preview via Next `draftMode()` — view unpublished articles at their real URL.
- Published-only sitemap/search/static params; then delete the frozen data files.

### Phase 4 — Public API for the app + phone editing (2–3 days)
- Read-only public REST endpoints (published content only, `?locale=en|ar`), mutations locked behind auth; GraphQL disabled.
- `/api/content/manifest` (per-collection `updatedAt`) so the mobile app can cheaply detect changes and delta-sync.
- Verify the full editorial loop **from a phone browser**: Payload's admin is responsive — log in at `/admin`, edit with autosave, preview, publish. Add `/admin` to the phone home screen as an "editor app".
- One-page editor guide documenting the verify-before-publish rule.

**Result:** edit any article/verse/citation/glossary term from phone or
desktop → publish → website updates in seconds → mobile app picks it up on
next sync. No developer needed for content work; no app-store review ever
needed for content changes.

---

## Track 2 — Pro phone + native apps

### Phase A — PWA hardening (2–3 days — do this immediately, independent of everything)
Audit found the site has **no manifest, no icons, no service worker** — it
cannot be installed and has no offline support:

- `app/manifest.ts` (EN + AR name, `display: standalone`, theme colors matching the existing light/dark palette).
- Icon set generated from the existing `app/icon.svg`: 192/512 PNGs + maskable + `apple-icon.png`; `appleWebApp` metadata.
- Serwist service worker: precache the shell, runtime-cache articles, offline fallback page.
- Verify Add-to-Home-Screen + offline reading on Android Chrome and iOS Safari.

This alone gives an app-like, installable, offline-capable phone experience this week.

### Phase B — Expo app scaffold (7–10 days, start once the Phase 4 API is stable)
- npm workspaces: `apps/web`, `apps/mobile`, `packages/content-client` (typed API fetchers + sync logic + the React-free domain types — shared by web and app).
- `create-expo-app` with Expo Router + TypeScript; screens mirroring the site: home paths, categories, article reader, glossary, sources, search; dark mode matching the web palette.
- Arabic/RTL from day one: bundle a proper Quranic font (KFGQPC Uthmanic or Amiri) via `expo-font`; Arabic verse blocks render RTL inside the English-first UI; test ligature shaping on real Android devices.

### Phase C — Offline + the features that clear Apple review (5–8 days)
- Offline-first: content snapshot bundled in the binary (first launch works in airplane mode), then delta-sync against the manifest endpoint; unpublished content is removed from devices on sync (matters for the verification constitution).
- Bookmarks, reading position, font-size control, share sheet — genuinely useful **and** the defense against Apple Guideline 4.2 ("minimum functionality"). Never submit a bare content viewer.
- App icon + splash from the existing brand; internal builds via EAS.

### Phase D — Store accounts and submission (3–5 days of work + 2–4 weeks calendar time)
- **Start accounts at Phase B kickoff, not at the end** — Google Play personal accounts must run a closed test with **12 testers opted in for 14 continuous days** before production access. This is the single biggest schedule risk; recruit testers early and start the clock with a rough build.
- Apple Developer Program $99/yr (individual, no D-U-N-S); EAS Build/Submit handles iOS signing and upload from Windows.
- Privacy policy page on the website (required by both stores). With no accounts/analytics the app declares "no data collected" — keeps both privacy forms trivial.
- Religious-content review posture: both stores permit religious/educational apps; the risk is *tone* (Apple 1.1 / Play hate-speech policy). The citation-first, no-fabrication design is the defense — scholarly framing in the app, screenshots, and store copy; reviewer notes describing a sourced comparative-religion reference library. Budget 1–2 rejection/resubmission cycles as a first-time developer.
- After launch: content updates flow through the API with no store review; JS-level fixes ship over-the-air via EAS Update; ~1–2 days/year of maintenance builds for store SDK-level requirements.

---

## Sequencing and effort summary

```
Now            → Phase A (PWA)                    2–3 days   ← instant phone win
               → Phase 0 (seam refactor)          2–4 days
Then           → Phases 1–4 (CMS)                 11–18 days
After API      → Phases B–C (Expo app)            12–18 days
In parallel    → Phase D store accounts + testers (calendar time, start early)
```

Realistic solo timeline: **6–9 calendar weeks** of part-time work to have the
CMS live and apps submitted.

## The honest risks

1. **The real long pole is content, not code.** Every verse, citation, and source is still a `[VERIFIED ... PENDING]` placeholder. The CMS makes verification enforceable but cannot do the verification — publishing real articles (Quran text from a verified source like the Tanzil/King Fahd Complex text, licensed Bible translations) is editorial work that gates any public launch.
2. **Google Play's 12-tester/14-day rule** is pure calendar time a solo developer cannot compress — start it early.
3. **Apple review subjectivity** on comparative-religion content — mitigated by tone and citations, never guaranteed; budget for a rejection cycle.
4. **New operational surface:** the site goes from zero-infrastructure static to owning a database and an auth-bearing admin. Backups and 2FA on `/admin` are non-negotiable.
5. Adding a new site *category* (not article) remains a code change by design (icons/routes/unions live in code) — document it rather than fight it.
