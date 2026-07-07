# Content Editing Guide

How the content of The Straight Path (الصراط المستقيم) is stored today, how to
edit it, and the recommended path once a mobile app is added.

## Where content lives today

There is **no database and no CMS yet**. Every piece of content is a
TypeScript data file inside the repository, compiled into the site at build
time:

| File | What it holds |
| --- | --- |
| `data/content/articles.ts` | All articles: titles, summaries, section headings and body text |
| `data/content/scripture.ts` | Quran/Bible verse records (all placeholder until verified) |
| `data/content/citations.ts` | Citation records referenced by articles |
| `data/content/comparison-articles.ts` | Structured comparison articles (perspectives, objections, conclusion) |
| `data/content/glossary.ts` | Glossary terms and definitions |
| `data/content/source-library.ts` | Source library entries with pending/verified status |
| `data/site.ts` | The 12 categories, their descriptions, topic lists, navigation |
| `data/home.ts` | Homepage content: main paths, Christian learning path, method list |
| `data/islam-christianity-tree.ts` and the other `*-tree.ts` files | The expandable tree outlines |
| `types/content.ts` | The shape (schema) of every content type above |

## How to edit content now

1. Open the relevant file above and edit the text.
2. If the dev server is running (`npm run dev`), the change appears instantly.
3. For the live/deployed site, commit and redeploy — content is baked in at
   build time, so **every edit requires a rebuild**.

This is fine while one developer maintains everything, but it has limits:
non-developers cannot edit, there is no edit history per article, and a
future mobile app cannot read TypeScript files.

## Recommended path for web + mobile (one source of truth)

The goal: edit content once, and have it update **both** the website and the
mobile app. That requires moving content out of code and behind an **API**.
The standard architecture is a **headless CMS**:

```
                 ┌──────────────┐
   Editors ────► │ Headless CMS │  (admin UI + database + publish workflow)
                 └──────┬───────┘
                        │ JSON over HTTPS
          ┌─────────────┼──────────────┐
          ▼                            ▼
   Next.js website              Mobile app (React Native / Flutter)
```

### Recommended options, in order

1. **Payload CMS** (recommended) — TypeScript-native and installs *inside
   this same Next.js project*, so one repo and one deployment. The schemas in
   `types/content.ts` translate almost 1:1 into Payload collections. Free and
   self-hosted, with an admin UI, draft/publish workflow, roles, and a REST +
   GraphQL API the mobile app can consume. The existing
   `draft / under-review / published` and `pending / verified` status fields
   map directly onto its workflow — which matches this project's
   verify-before-publish constitution.

2. **Sanity** — hosted (zero server maintenance), generous free tier, strong
   editorial UI. Slightly less "one repo" but faster to stand up.

3. **Interim low-effort step** — move the article/glossary/source data from
   `.ts` into `.json` files and expose them through Next.js API routes
   (`app/api/content/...`). The mobile app could read those endpoints, but
   edits would still require a redeploy, so treat this only as a stepping
   stone.

### Migration outline (when ready)

1. Define Payload/Sanity collections mirroring `types/content.ts`
   (Article, QuranVerse, BibleVerse, Citation, GlossaryTerm, SourceLibraryItem,
   ComparisonTopic).
2. Write a one-time import script that loads the current `data/content/*.ts`
   records into the CMS.
3. Swap the helper functions in `lib/content/index.ts` from importing local
   files to fetching from the CMS — page components do not need to change,
   because they already go through those helpers.
4. Point the mobile app at the same API.

Step 3 is the reason the current architecture was built around
`lib/content/` helpers: the pages never touch the data files directly, so the
storage backend can be replaced without rewriting the UI.

## Phase 0 status (completed)

The seam consolidation from ROADMAP.md is done:

- Every `lib/content` helper is now **async** — callers already await them, so
  swapping the internals to CMS queries will not touch any page.
- **All** structure data (categories, home content, research trees) now flows
  through `lib/content` too; no page or component imports `data/` directly.
- Domain types are React-free in `types/domain.ts` (shareable with the mobile
  app); UI prop types live in `types/ui.ts`; `types/content.ts` re-exports
  both for compatibility.
- Navigation config lives in `lib/navigation.ts` (deliberately code-level).
- Category SEO metadata construction lives in `lib/seo.ts`
  (`getCategoryMetadata`, async).
- `getArticles({ includeDrafts })` exists; drafts are still included by
  default while the whole library is placeholders — flip when real verified
  content starts publishing.

## CMS Phase 1 status (completed)

Payload CMS 3 is installed **inside** this Next.js app:

- Admin panel at `/admin` (first visit shows create-first-user). The site's
  pages moved into `app/(frontend)/` so the admin's root layout can coexist;
  URLs did not change.
- Collections defined in `payload/collections/`: articles (drafts+versions),
  comparison-articles (drafts+versions), citations, quran-verses,
  bible-verses, glossary-terms, source-library-categories,
  source-library-items, users (owner/reviewer roles).
- `en`/`ar` localization enabled from day one (Arabic marked RTL); localized
  fields: titles, summaries, section bodies, definitions, comparison prose.
- Verification scaffolding in place: citations and scripture carry
  `pending/verified` status + `verifiedBy`/`verifiedDate`/`sourceAttribution`
  fields. The publish-blocking hook lands in Phase 2.
- Database: SQLite at `payload/payload.db` (gitignored) for local dev;
  production will use Postgres (Neon). Secrets in `.env` (gitignored).
- REST API is locked by default (403 unauthenticated) — public read
  endpoints open deliberately in Phase 4.
- Generated types at `types/payload-types.ts` (`npx payload generate:types`).
- Toolchain: upgraded to Next 16.2 + React 19.2 (Payload requires it),
  project is now ESM (`"type": "module"`).

## CMS Phases 2–4 status (completed)

**The CMS is now live — the website reads all editorial content from Payload.**

- **Seed done:** all 13 articles, 16 glossary terms, 4 citations, 2 scripture
  placeholders, 9 source categories + 9 items, and the comparison article were
  migrated (`payload/seed.ts`, idempotent) and verified field-by-field against
  the legacy files (`payload/parity-check.ts` — run both with
  `npx tsx --env-file=.env <script>`; `payload run` silently no-ops on this
  setup, use tsx directly via `env $(cat .env | xargs) npx tsx <script>`).
- **Publish gate live:** `payload/hooks/blockUnverifiedPublish.ts` blocks
  `status: published` on any article/comparison that links a pending citation,
  an unverified verse, or still contains placeholder markers
  (`[VERIFIED ... PENDING]`, `[Add Quran verse:`, "Source pending",
  "citation needed"). Verified by a negative test.
- **Cutover done:** `lib/content` helpers now query the Payload Local API and
  map documents back to the domain types; no page changed. The legacy
  `data/content/*.ts` files remain only as the seed source / rollback and are
  no longer read by the site.
- **Instant publishing:** afterChange/afterDelete hooks revalidate the site,
  so edits at `/admin` go live in seconds with no rebuild.
- **Public API open (Phase 4):** content collections are world-readable via
  REST (`/api/articles`, `/api/glossary-terms`, ...); writes and the users
  collection stay authenticated. `/api/content-manifest` returns
  per-collection counts + `lastUpdated` for the mobile app's delta sync.

## How to edit content NOW

1. Open `/admin` in any browser (desktop or phone).
2. First visit: create the admin account.
3. Edit articles, glossary terms, citations, source library records; save.
4. The live site updates within seconds — no rebuild, no deploy.
5. To publish an article for real, every linked citation must first be marked
   Verified — the gate will otherwise refuse with a clear message.

Site structure (categories, navigation, research trees, homepage sections)
remains code-defined by design — editing those is still a code change.
