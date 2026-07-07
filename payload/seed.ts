/**
 * One-time (idempotent) seed: migrates the legacy TypeScript data files into
 * Payload, preserving every placeholder marker exactly — nothing is invented.
 *
 * Run with the dev server STOPPED (SQLite write lock):
 *   npx payload run payload/seed.ts
 */
import { getPayload } from "payload";
import { articles } from "../data/content/articles";
import { citations } from "../data/content/citations";
import { comparisonArticles } from "../data/content/comparison-articles";
import { glossaryTerms } from "../data/content/glossary";
import { sourceLibraryCategories } from "../data/content/source-library";
import { bibleVerses, quranVerses } from "../data/content/scripture";
import config from "../payload.config";

async function main() {
  const payload = await getPayload({ config });

  async function upsert<T extends Record<string, unknown>>(
    collection:
      | "citations"
      | "quran-verses"
      | "bible-verses"
      | "glossary-terms"
      | "source-library-categories"
      | "source-library-items"
      | "articles"
      | "comparison-articles",
    whereField: string,
    whereValue: string,
    data: T,
  ): Promise<string | number> {
    const existing = await payload.find({
      collection,
      where: { [whereField]: { equals: whereValue } },
      limit: 1,
      depth: 0,
    });

    if (existing.docs[0]) {
      const updated = await payload.update({
        collection,
        id: existing.docs[0].id,
        data,
        depth: 0,
      });
      return updated.id;
    }

    const created = await payload.create({ collection, data: data as never, depth: 0 });
    return created.id;
  }

  // 1. Citations ------------------------------------------------------------
  const citationIdByKey = new Map<string, string | number>();
  for (const citation of citations) {
    const id = await upsert("citations", "citationKey", citation.id, {
      citationKey: citation.id,
      type: citation.type,
      title: citation.title,
      author: citation.author,
      publisher: citation.publisher,
      year: citation.year,
      url: citation.url,
      note: citation.note,
      status: "pending",
    });
    citationIdByKey.set(citation.id, id);
  }
  console.log(`citations: ${citationIdByKey.size}`);

  const toCitationIds = (keys: string[] | undefined) =>
    (keys ?? [])
      .map((key) => citationIdByKey.get(key))
      .filter((id): id is string | number => id !== undefined);

  // 2. Scripture ------------------------------------------------------------
  const quranIdByReference = new Map<string, string | number>();
  for (const verse of quranVerses) {
    const id = await upsert("quran-verses", "reference", verse.reference, {
      surahName: verse.surahName,
      surahNumber: verse.surahNumber,
      ayahNumber: verse.ayahNumber,
      arabic: verse.arabic,
      translation: verse.translation,
      translator: verse.translator,
      reference: verse.reference,
      arabicTafsirNote: verse.arabicTafsirNote,
      notes: verse.notes,
      status: "pending",
    });
    quranIdByReference.set(verse.reference, id);
  }

  const bibleIdByReference = new Map<string, string | number>();
  for (const verse of bibleVerses) {
    const id = await upsert("bible-verses", "reference", verse.reference, {
      book: verse.book,
      chapter: verse.chapter,
      verse: String(verse.verse),
      text: verse.text,
      arabicText: verse.arabicText,
      arabicSource: verse.arabicSource,
      version: verse.version,
      reference: verse.reference,
      notes: verse.notes,
      status: "pending",
    });
    bibleIdByReference.set(verse.reference, id);
  }
  console.log(
    `scripture: ${quranIdByReference.size} quran, ${bibleIdByReference.size} bible`,
  );

  // 3. Glossary (two passes: terms, then self-relations) ---------------------
  const glossaryIdByTerm = new Map<string, string | number>();
  for (const term of glossaryTerms) {
    const id = await upsert("glossary-terms", "term", term.term, {
      term: term.term,
      pronunciation: term.pronunciation,
      definition: term.definition,
      category: term.category,
      citations: toCitationIds(term.citations),
    });
    glossaryIdByTerm.set(term.term, id);
  }
  for (const term of glossaryTerms) {
    const relatedIds = term.relatedTerms
      .map((name) => glossaryIdByTerm.get(name))
      .filter((id): id is string | number => id !== undefined);
    if (relatedIds.length > 0) {
      await payload.update({
        collection: "glossary-terms",
        id: glossaryIdByTerm.get(term.term)!,
        data: { relatedTerms: relatedIds as number[] },
        depth: 0,
      });
    }
  }
  console.log(`glossary terms: ${glossaryIdByTerm.size}`);

  // 4. Source library ---------------------------------------------------------
  let sourceItemCount = 0;
  for (const [index, category] of sourceLibraryCategories.entries()) {
    const categoryId = await upsert(
      "source-library-categories",
      "title",
      category.title,
      {
        title: category.title,
        description: category.description,
        order: index,
      },
    );

    for (const item of category.items) {
      await upsert("source-library-items", "title", item.title, {
        title: item.title,
        type: item.type,
        category: categoryId,
        authorOrPublisher: item.authorOrPublisher,
        year: item.year,
        url: item.url,
        notes: item.notes,
        status: item.status,
      });
      sourceItemCount += 1;
    }
  }
  console.log(
    `source library: ${sourceLibraryCategories.length} categories, ${sourceItemCount} items`,
  );

  // 5. Articles (two passes: records, then self-relations) --------------------
  const articleIdBySlug = new Map<string, string | number>();
  for (const article of articles) {
    const id = await upsert("articles", "slug", article.slug, {
      slug: article.slug,
      title: article.title,
      subtitle: article.subtitle,
      category: article.category,
      audienceLevel: article.audienceLevel,
      summary: article.summary,
      tags: article.tags,
      status: article.status,
      lastUpdated: article.lastUpdated,
      sections: article.sections.map((section) => ({
        sectionId: section.id,
        title: section.title,
        kind: section.kind,
        body: section.body,
        citations: toCitationIds(section.citationIds),
      })),
      citations: toCitationIds(article.citations),
    });
    articleIdBySlug.set(article.slug, id);
  }
  for (const article of articles) {
    const relatedIds = article.relatedArticles
      .map((slug) => articleIdBySlug.get(slug))
      .filter((id): id is string | number => id !== undefined);
    if (relatedIds.length > 0) {
      await payload.update({
        collection: "articles",
        id: articleIdBySlug.get(article.slug)!,
        data: { relatedArticles: relatedIds as number[] },
        depth: 0,
      });
    }
  }
  console.log(`articles: ${articleIdBySlug.size}`);

  // 6. Comparison articles -----------------------------------------------------
  for (const comparison of comparisonArticles) {
    await upsert("comparison-articles", "slug", comparison.slug, {
      slug: comparison.slug,
      status: "draft",
      mainQuestion: comparison.mainQuestion,
      beginnerSummary: comparison.beginnerSummary,
      quranicPerspective: comparison.quranicPerspective,
      biblicalPerspective: comparison.biblicalPerspective,
      historicalContext: comparison.historicalContext,
      christianInterpretation: comparison.christianInterpretation,
      islamicResponse: comparison.islamicResponse,
      keyDifferences: comparison.keyDifferences.map((difference) => ({
        difference,
      })),
      commonObjections: comparison.commonObjections,
      respectfulConclusion: comparison.respectfulConclusion,
      quranVerses: comparison.quranVerses
        .map((verse) => quranIdByReference.get(verse.reference))
        .filter((id): id is string | number => id !== undefined),
      bibleVerses: comparison.bibleVerses
        .map((verse) => bibleIdByReference.get(verse.reference))
        .filter((id): id is string | number => id !== undefined),
      sources: toCitationIds(comparison.sources),
      relatedTopics: comparison.relatedTopics.map((topic) => ({ topic })),
    });
  }
  console.log(`comparison articles: ${comparisonArticles.length}`);

  console.log("Seed complete.");
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
