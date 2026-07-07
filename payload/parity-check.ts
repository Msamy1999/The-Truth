/**
 * Parity check: compares Payload's content against the legacy TypeScript
 * data files, field by field for the critical surfaces. Exits non-zero on
 * any mismatch. Run: npx payload run payload/parity-check.ts
 */
import { getPayload } from "payload";
import { articles } from "../data/content/articles";
import { citations } from "../data/content/citations";
import { comparisonArticles } from "../data/content/comparison-articles";
import { glossaryTerms } from "../data/content/glossary";
import { sourceLibraryCategories } from "../data/content/source-library";
import config from "../payload.config";

const problems: string[] = [];

function expect(condition: boolean, message: string) {
  if (!condition) {
    problems.push(message);
  }
}

async function main() {
  const payload = await getPayload({ config });

  // Counts ---------------------------------------------------------------
  const counts = {
    articles: (await payload.count({ collection: "articles" })).totalDocs,
    citations: (await payload.count({ collection: "citations" })).totalDocs,
    glossary: (await payload.count({ collection: "glossary-terms" })).totalDocs,
    sourceCategories: (
      await payload.count({ collection: "source-library-categories" })
    ).totalDocs,
    sourceItems: (await payload.count({ collection: "source-library-items" }))
      .totalDocs,
    comparisons: (await payload.count({ collection: "comparison-articles" }))
      .totalDocs,
    quranVerses: (await payload.count({ collection: "quran-verses" })).totalDocs,
    bibleVerses: (await payload.count({ collection: "bible-verses" })).totalDocs,
  };

  const expectedSourceItems = sourceLibraryCategories.reduce(
    (total, category) => total + category.items.length,
    0,
  );

  expect(
    counts.articles === articles.length,
    `articles: ${counts.articles} != ${articles.length}`,
  );
  expect(
    counts.citations === citations.length,
    `citations: ${counts.citations} != ${citations.length}`,
  );
  expect(
    counts.glossary === glossaryTerms.length,
    `glossary: ${counts.glossary} != ${glossaryTerms.length}`,
  );
  expect(
    counts.sourceCategories === sourceLibraryCategories.length,
    `source categories: ${counts.sourceCategories} != ${sourceLibraryCategories.length}`,
  );
  expect(
    counts.sourceItems === expectedSourceItems,
    `source items: ${counts.sourceItems} != ${expectedSourceItems}`,
  );
  expect(
    counts.comparisons === comparisonArticles.length,
    `comparisons: ${counts.comparisons} != ${comparisonArticles.length}`,
  );

  console.log("counts:", JSON.stringify(counts));

  // Per-article field parity ----------------------------------------------
  for (const legacy of articles) {
    const result = await payload.find({
      collection: "articles",
      where: { slug: { equals: legacy.slug } },
      limit: 1,
      depth: 1,
    });
    const doc = result.docs[0] as
      | undefined
      | {
          title: string;
          subtitle: string;
          category: string;
          audienceLevel: string;
          summary: string;
          tags?: string[];
          status: string;
          sections?: {
            sectionId: string;
            title: string;
            kind: string;
            body: string;
            citations?: { citationKey: string }[];
          }[];
          citations?: { citationKey: string }[];
          relatedArticles?: { slug: string }[];
        };

    if (!doc) {
      problems.push(`article missing: ${legacy.slug}`);
      continue;
    }

    expect(doc.title === legacy.title, `${legacy.slug}: title mismatch`);
    expect(doc.subtitle === legacy.subtitle, `${legacy.slug}: subtitle mismatch`);
    expect(doc.category === legacy.category, `${legacy.slug}: category mismatch`);
    expect(doc.summary === legacy.summary, `${legacy.slug}: summary mismatch`);
    expect(doc.status === legacy.status, `${legacy.slug}: status mismatch`);
    expect(
      JSON.stringify(doc.tags ?? []) === JSON.stringify(legacy.tags),
      `${legacy.slug}: tags mismatch`,
    );
    expect(
      (doc.sections ?? []).length === legacy.sections.length,
      `${legacy.slug}: section count ${(doc.sections ?? []).length} != ${legacy.sections.length}`,
    );

    for (const [index, legacySection] of legacy.sections.entries()) {
      const section = doc.sections?.[index];
      if (!section) continue;
      expect(
        section.sectionId === legacySection.id &&
          section.title === legacySection.title &&
          section.kind === legacySection.kind &&
          section.body === legacySection.body,
        `${legacy.slug}: section ${legacySection.id} field mismatch`,
      );
      expect(
        JSON.stringify((section.citations ?? []).map((c) => c.citationKey)) ===
          JSON.stringify(legacySection.citationIds ?? []),
        `${legacy.slug}: section ${legacySection.id} citations mismatch`,
      );
    }

    expect(
      JSON.stringify((doc.citations ?? []).map((c) => c.citationKey)) ===
        JSON.stringify(legacy.citations),
      `${legacy.slug}: citations mismatch`,
    );
    expect(
      JSON.stringify((doc.relatedArticles ?? []).map((a) => a.slug)) ===
        JSON.stringify(legacy.relatedArticles),
      `${legacy.slug}: relatedArticles mismatch`,
    );
  }

  // Glossary parity ---------------------------------------------------------
  for (const legacy of glossaryTerms) {
    const result = await payload.find({
      collection: "glossary-terms",
      where: { term: { equals: legacy.term } },
      limit: 1,
      depth: 1,
    });
    const doc = result.docs[0] as
      | undefined
      | {
          definition: string;
          category: string;
          relatedTerms?: { term: string }[];
        };
    if (!doc) {
      problems.push(`glossary term missing: ${legacy.term}`);
      continue;
    }
    expect(
      doc.definition === legacy.definition && doc.category === legacy.category,
      `glossary ${legacy.term}: field mismatch`,
    );
    expect(
      JSON.stringify((doc.relatedTerms ?? []).map((t) => t.term).sort()) ===
        JSON.stringify([...legacy.relatedTerms].sort()),
      `glossary ${legacy.term}: relatedTerms mismatch`,
    );
  }

  // Comparison article parity -------------------------------------------------
  for (const legacy of comparisonArticles) {
    const result = await payload.find({
      collection: "comparison-articles",
      where: { slug: { equals: legacy.slug } },
      limit: 1,
      depth: 1,
    });
    const doc = result.docs[0] as
      | undefined
      | {
          mainQuestion: string;
          keyDifferences?: { difference: string }[];
          commonObjections?: { objection: string; response: string }[];
          quranVerses?: unknown[];
          bibleVerses?: unknown[];
          sources?: { citationKey: string }[];
          relatedTopics?: { topic: string }[];
        };
    if (!doc) {
      problems.push(`comparison missing: ${legacy.slug}`);
      continue;
    }
    expect(
      doc.mainQuestion === legacy.mainQuestion,
      `comparison ${legacy.slug}: mainQuestion mismatch`,
    );
    expect(
      JSON.stringify((doc.keyDifferences ?? []).map((d) => d.difference)) ===
        JSON.stringify(legacy.keyDifferences),
      `comparison ${legacy.slug}: keyDifferences mismatch`,
    );
    expect(
      (doc.quranVerses ?? []).length === legacy.quranVerses.length &&
        (doc.bibleVerses ?? []).length === legacy.bibleVerses.length,
      `comparison ${legacy.slug}: verse counts mismatch`,
    );
    expect(
      JSON.stringify((doc.sources ?? []).map((s) => s.citationKey)) ===
        JSON.stringify(legacy.sources),
      `comparison ${legacy.slug}: sources mismatch`,
    );
    expect(
      JSON.stringify((doc.relatedTopics ?? []).map((t) => t.topic)) ===
        JSON.stringify(legacy.relatedTopics),
      `comparison ${legacy.slug}: relatedTopics mismatch`,
    );
  }

  if (problems.length > 0) {
    console.error(`PARITY FAILURES (${problems.length}):`);
    for (const problem of problems) {
      console.error("  -", problem);
    }
    process.exit(1);
  }

  console.log("PARITY OK: Payload content matches the legacy data files.");
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
