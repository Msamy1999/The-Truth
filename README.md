# The Straight Path (الصراط المستقيم)

A mobile-first Next.js Islamic research library foundation for sincere seekers, source-aware study, and respectful comparison where needed.

## Tech Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Local structured content and data folders for future expansion

## Scripts

```bash
npm run dev
npm run build
npm run typecheck
```

## Project Structure

```text
app/                  App Router routes, layout, metadata, and global styles
components/layout/    Site shell components
components/ui/        Reusable UI primitives
components/content/   Research and content-focused reusable components
data/                 Local structured data
content/              Future MDX/articles and study notes
lib/                  Shared utilities
types/                Shared TypeScript types
```

## Design System Components

- `Container`, `Section`, `PageHeader`, and `Breadcrumbs` for page structure
- `TopicCard`, `VerseCard`, `ComparisonBlock`, `Citation`, `Callout`, `ExpandableStudy`, and `FAQItem` for research pages
- `Tag`, `Card`, and `ButtonLink` as small UI primitives

## Site Map

The main category routes are defined in `data/site.ts` and rendered through a shared category template:

- `/`
- `/search`
- `/method`
- `/islam-overview`
- `/islam-christianity`
- `/atheism-agnosticism`
- `/people-of-palestine`
- `/the-quran-and-the-bible`
- `/jesus-in-islam-and-christianity`
- `/preservation`
- `/difficult-questions`
- `/scientific-signs`
- `/religious-history`
- `/historical-evidence`
- `/tawhid-and-the-trinity`
- `/salvation-and-purpose-of-life`
- `/war-and-violence`
- `/women`
- `/prophecies`
- `/questions`
- `/glossary`
- `/sources`
- `/language-demo`

## Content Architecture

Phase 4 adds structured draft data under `data/content/` and helper functions under `lib/content/`.

- `Article` records include status, audience level, sections, citation ids, and related articles.
- `QuranVerse` and `BibleVerse` records are shaped for verified scripture text and source attribution.
- `Citation`, `ComparisonTopic`, and `GlossaryTerm` records support safer future article pages.
- Placeholder scripture and citations must stay draft/source-pending until verified.

## Article Routing

Phase 5 uses `/articles/[slug]` for long-form articles instead of category-specific article routes. This keeps one reusable article renderer for content that may belong to a category but also cross-link across Jesus, scripture, preservation, history, and source-library topics.

- `ArticleLayout` renders the shared research article shell.
- `ComparisonArticleLayout` renders structured comparison articles inside that shell.
- Draft examples: `/articles/who-is-jesus` and `/articles/was-the-quran-preserved`.

## SEO, Trust, and Accessibility Notes

- Global metadata, Open Graph defaults, `robots.ts`, and `sitemap.ts` live in the App Router.
- `/method` explains the research method, educational disclaimer, draft status labels, and correction posture.
- Article status is shown with visible labels: Draft, Under review, and Published.
- The layout includes a keyboard-accessible skip link and the mobile navigation uses explicit labels and focus states.
- Light mode is the default for first-time visitors. The header theme toggle (`components/ui/ThemeToggle.tsx`) still allows an explicit dark choice; the choice persists in `localStorage` and is applied before first paint by an inline script in `app/layout.tsx`.
- The mobile menu closes on Escape and its panel stays in the DOM so `aria-controls` always resolves.
- Search, glossary, and source-library filters are the only intentionally client-side research tools for now.

## Tree-Style Navigation

`components/content/ResearchTree.tsx` renders a folder-tree/sitemap-style list (connector lines, expand/collapse via native `<details>`, optional status and tag pills) instead of a card grid. It is used for:

- `/islam-christianity` (`data/islam-christianity-tree.ts`) — the nine former comparison categories as expandable branches with their subtopics.
- `/islam-overview`, `/atheism-agnosticism`, and `/people-of-palestine` (`data/islam-overview-tree.ts`, `data/atheism-agnosticism-tree.ts`, `data/people-of-palestine-tree.ts`) — flat beginner outlines.
- The homepage "Main paths" section (`data/home.ts`, `mainPaths`) — the five top-level entry points into the library.

Nodes without an `href` render as plain descriptive rows rather than a link to nowhere; only topics with a real draft article or page get a link.

## Phase 1 Scope

This phase intentionally uses placeholder content only. Future phases should add sourced articles, verse cards, comparison tables, citations, topic hubs, glossary entries, and deeper study sections without fabricating citations.
