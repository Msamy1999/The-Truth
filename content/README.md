# Content Standards

This folder is reserved for future articles, MDX files, and structured study notes.

Content rules for future phases:

- Keep scripture, interpretation, historical context, and argument clearly separated.
- Every Quran verse shown on the site must include Arabic text, English translation, surah and ayah reference, and translation/source attribution.
- Every Bible verse must include book, chapter, verse, and translation/version.
- Do not publish unsourced religious, historical, hadith, or academic claims.
- Use "citation needed" or "source pending" when exact source data is not ready.
- Keep the tone respectful, confident, and seeker-friendly.

## Data Model

The Phase 4 content model lives in `types/content.ts`, with sample draft data under `data/content/` and query helpers under `lib/content/`.

Placeholder content is intentionally marked draft/source-pending. Do not promote any article to `reviewed` or `published` until scripture text, translations, historical claims, and citations have been verified.

## Article Templates

Articles render through `/articles/[slug]`. Use this route for all long-form study pages so category pages can link to the same article without duplicating templates. Comparison articles can attach additional structured comparison data while keeping the same article metadata, citations, and related-article behavior.
