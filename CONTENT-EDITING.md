# Content editing guide

The Straight Path uses Payload CMS as its editorial source of truth. The
website and the Expo client must consume the same approved content contracts;
do not create a second live copy of editorial content.

## What lives where

| Location | Purpose |
| --- | --- |
| Payload collections | Live articles, comparisons, citations, scripture, glossary, and source library |
| `lib/content/` | Stable application-facing query and mapping boundary |
| `content-drafts/*.json` | Reviewed import material and reproducible deployment content sync |
| `data/*-tree.ts`, `data/site.ts`, `data/home.ts` | Code-defined navigation and branch structure |
| `data/content/` | Legacy seed/rollback evidence; confirm usage before editing |
| `mobile/assets/content/*.json` | Generated offline snapshot; never edit as editorial truth |

## Editing in Payload

1. Open `/admin` and authenticate with an authorized editor account.
2. Edit the relevant record and keep claims, quotations, and sources together.
3. Preserve Draft, Under review, Published, Source pending, and Verified as real
   workflow states.
4. Verify exact quotations and source URLs before changing evidence to
   Verified.
5. Publish only after the server-side evidence gate accepts the record.

Payload hooks revalidate the website after changes. No code deployment is
required for an ordinary approved CMS edit.

## Editing import drafts

`content-drafts/*.json` is used when reviewed content must be synchronized
reproducibly during a release. Before importing:

```powershell
npm run verify:drafts
npm run verify:key-scripture
npm run verify:quran -- .codex-quran-audit/quran-uthmani.json
```

The canonical Quran verifier takes precedence over readability or formatting.
Never rewrite Quranic Arabic or an approved translation to satisfy an editorial
score. Keep Bible quotations, hadith wording, manuscript claims, historical
claims, and scientific claims tied to the source that actually supports them.

The deployment `content-sync` target changes the persistent database and must
only run after a verified SQLite backup. Follow `DEPLOYMENT.md`; never replace
the persistent volume with the database produced during the image build.

## Code-defined structure

Category routes, navigation labels, homepage paths, and research trees are code
changes. Keep their links synchronized with Payload slugs, redirects, sitemap
generation, search, audio playback order, and the mobile structure export.

After a structural change, run the full web gate and exercise affected tree,
direct-link, hash, search, mobile-menu, and Arabic RTL flows in a browser.

## Mobile snapshot

The Expo app starts from a bundled offline snapshot and can refresh from the
public Payload API. With the website running, regenerate the snapshot from the
repository root:

```powershell
npx tsx scripts/export-mobile-content.ts
```

Review the generated diff and rerun the mobile checks before a store build.
Never hand-edit the generated JSON to hide drift from Payload.

## Required review posture

- Distinguish primary text, interpretation, scholarly position, disputed
  claim, inference, and editorial explanation.
- Keep the tone natural, respectful, accessible, and clearly favorable to
  Islam without misrepresenting another tradition.
- Preserve Arabic/English meaning, Quranic Arabic, RTL/LTR behavior,
  accessibility, and source attribution.
- If evidence is incomplete, retain an explicit gap or qualified status rather
  than smoothing it into a stronger claim.
