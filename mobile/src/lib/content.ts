/**
 * Content layer for the mobile library. All content is bundled with the app:
 * the reader works fully offline and never writes a duplicate content cache.
 * New material is delivered through an app update.
 */
import type {
  AppContent,
  Article,
  ArticleKeyScripture,
  BibleVerse,
  Citation,
  ClaimAgainstIslam,
  GlossaryTerm,
  QuranVerse,
  SourceLibraryCategory,
} from "./types";

const bundledStructure = require("../../assets/content/structure.json");
const bundledArticles = require("../../assets/content/articles.json");
const bundledCitations = require("../../assets/content/citations.json");
const bundledGlossary = require("../../assets/content/glossary-terms.json");
const bundledSourceCategories = require("../../assets/content/source-library-categories.json");
const bundledSourceItems = require("../../assets/content/source-library-items.json");
const bundledClaims = require("../../assets/content/claims-against-islam.json");
const bundledQuranVerses = require("../../assets/content/quran-verses.json");
const bundledBibleVerses = require("../../assets/content/bible-verses.json");
const bundledArticleKeyScripture = require("../../assets/content/article-key-scripture.json");

function readerDescription(value: string): string {
  return value
    .replace(/^(?:A\s+)?(?:draft|planned|future)\s+/i, "")
    .replace(
      /\b(?:draft|planned|future)\s+(?=(?:study|article|topic|framework|comparison|beginner|careful|Christian-facing|historical|Islamic|bridge|collection|guide|reflection|outline|path|section))/gi,
      "",
    )
    .replace(/\bsource[- ]status\b/gi, "sources")
    .replace(/\bsource[- ](?:conscious|aware)\b/gi, "evidence-based")
    .replace(/\bsource[- ]pending\b/gi, "")
    .replace(/\b(?:source|scripture) placeholders?\b/gi, "sources")
    .replace(/\bplaceholders?\b/gi, "details")
    .replace(/\s+kept visible\b/gi, "")
    .replace(/\bwill live here\b/gi, "are gathered here")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^([a-z])/, (_, first: string) => first.toUpperCase());
}

function cleanTreeNode(node: any): any {
  return {
    ...node,
    description:
      typeof node.description === "string"
        ? readerDescription(node.description)
        : node.description,
    tag: node.tag === "Drafts" ? "History" : node.tag,
    status: undefined,
    children: Array.isArray(node.children)
      ? node.children.map(cleanTreeNode)
      : node.children,
  };
}

function citationKeys(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (typeof item === "string" || typeof item === "number") {
        return String(item);
      }
      return typeof item === "object" && item !== null && "citationKey" in item
        ? String((item as { citationKey: unknown }).citationKey)
        : undefined;
    })
    .filter((key): key is string => Boolean(key));
}

function mapArticle(doc: any): Article {
  return {
    slug: doc.slug,
    title: doc.title,
    subtitle: doc.subtitle,
    category: doc.category,
    audienceLevel: doc.audienceLevel,
    summary: doc.summary,
    tags: doc.tags ?? [],
    status: doc.status,
    lastUpdated: String(doc.lastUpdated ?? "").slice(0, 10),
    sections: (doc.sections ?? []).map((section: any) => ({
      id: section.sectionId,
      title: section.title,
      kind: section.kind,
      body: section.body,
      citationIds: citationKeys(section.citations),
    })),
    citations: citationKeys(doc.citations),
    relatedArticles: Array.isArray(doc.relatedArticles)
      ? doc.relatedArticles
          .map((related: any) =>
            typeof related === "object" && related !== null
              ? String(related.slug)
              : typeof related === "string" || typeof related === "number"
                ? String(related)
                : undefined,
          )
          .filter(Boolean)
      : [],
  };
}

function mapCitation(doc: any): Citation {
  return {
    id: doc.citationKey,
    type: doc.type,
    title: doc.title,
    author: doc.author ?? undefined,
    publisher: doc.publisher ?? undefined,
    year: doc.year ?? undefined,
    url: doc.url ?? undefined,
    note: doc.note ?? undefined,
    status: doc.status ?? "pending",
  };
}

function mapQuranVerse(doc: any): QuranVerse | null {
  if (
    !Number.isInteger(doc.surahNumber) ||
    doc.surahNumber < 1 ||
    doc.surahNumber > 114 ||
    !Number.isInteger(doc.ayahNumber) ||
    doc.ayahNumber < 1 ||
    typeof doc.arabic !== "string" ||
    doc.arabic.trim().length === 0 ||
    typeof doc.translation !== "string" ||
    doc.translation.trim().length === 0 ||
    typeof doc.reference !== "string" ||
    /pending|placeholder/i.test(`${doc.arabic} ${doc.translation} ${doc.reference}`)
  ) {
    return null;
  }
  return {
    scripture: "quran",
    surahName: String(doc.surahName ?? ""),
    surahNumber: doc.surahNumber,
    ayahNumber: doc.ayahNumber,
    arabic: doc.arabic,
    translation: doc.translation,
    translator: String(doc.translator ?? ""),
    reference: doc.reference,
    notes: doc.notes ?? undefined,
    status: doc.status === "verified" ? "verified" : "pending",
  };
}

function mapBibleVerse(doc: any): BibleVerse | null {
  if (
    typeof doc.book !== "string" ||
    doc.book.trim().length === 0 ||
    !Number.isInteger(doc.chapter) ||
    doc.chapter < 1 ||
    typeof doc.text !== "string" ||
    doc.text.trim().length === 0 ||
    typeof doc.reference !== "string" ||
    /pending|placeholder/i.test(`${doc.book} ${doc.text} ${doc.reference}`)
  ) {
    return null;
  }
  return {
    scripture: "bible",
    book: doc.book,
    chapter: doc.chapter,
    verse: doc.verse,
    text: doc.text,
    version: String(doc.version ?? ""),
    reference: doc.reference,
    notes: doc.notes ?? undefined,
    status: doc.status === "verified" ? "verified" : "pending",
  };
}

function mapKeyScripture(
  selections: Record<string, { quran?: string[]; bible?: string[] }>,
  quranDocs: any[],
  bibleDocs: any[],
): Record<string, ArticleKeyScripture> {
  const quran = new Map(
    quranDocs
      .map(mapQuranVerse)
      .filter((verse): verse is QuranVerse => verse !== null)
      .map((verse) => [verse.reference, verse]),
  );
  const bible = new Map(
    bibleDocs
      .map(mapBibleVerse)
      .filter((verse): verse is BibleVerse => verse !== null)
      .map((verse) => [verse.reference, verse]),
  );

  return Object.fromEntries(
    Object.entries(selections).map(([slug, selection]) => [
      slug,
      {
        quranVerses: (selection.quran ?? [])
          .map((reference) => quran.get(reference))
          .filter((verse): verse is QuranVerse => Boolean(verse)),
        bibleVerses: (selection.bible ?? [])
          .map((reference) => bible.get(reference))
          .filter((verse): verse is BibleVerse => Boolean(verse)),
      },
    ]),
  );
}

function mapGlossary(doc: any): GlossaryTerm {
  return {
    term: doc.term,
    pronunciation: doc.pronunciation ?? undefined,
    definition: doc.definition,
    category: doc.category,
    relatedTerms: Array.isArray(doc.relatedTerms)
      ? doc.relatedTerms
          .map((related: any) =>
            typeof related === "object" && related !== null
              ? String(related.term)
              : undefined,
          )
          .filter(Boolean)
      : [],
  };
}

function mapSources(
  categoryDocs: any[],
  itemDocs: any[],
): SourceLibraryCategory[] {
  return [...categoryDocs]
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((category) => {
      const items = itemDocs
        .filter((item) => {
          const categoryId =
            typeof item.category === "object" && item.category !== null
              ? item.category.id
              : item.category;
          return String(categoryId) === String(category.id);
        })
        .filter(
          (item) =>
            !/^source pending:/i.test(String(item.title ?? "")) &&
            !/\bplaceholder\b/i.test(String(item.notes ?? "")),
        )
        .map((item) => ({
          id: String(item.id),
          title: item.title,
          type: item.type,
          category: category.title,
          authorOrPublisher: item.authorOrPublisher ?? undefined,
          year: item.year ?? undefined,
          url: item.url ?? undefined,
          notes: item.notes,
          status: item.status ?? "pending",
        }));
      return {
        title: category.title,
        description: readerDescription(category.description),
        items,
      };
    })
    .filter((category) => category.items.length > 0);
}

function buildContent(raw: {
  articles: any[];
  citations: any[];
  glossary: any[];
  sourceCategories: any[];
  sourceItems: any[];
  claims: ClaimAgainstIslam[];
  quranVerses: any[];
  bibleVerses: any[];
  keyScripture: Record<string, { quran?: string[]; bible?: string[] }>;
}): AppContent {
  return {
    categories: bundledStructure.categories.map((category: any) => ({
      ...category,
      description: readerDescription(category.description),
      futureTopics: (category.futureTopics ?? []).map((topic: any) => ({
        ...topic,
        description: readerDescription(topic.description),
      })),
    })),
    home: {
      ...bundledStructure.home,
      mainPaths: bundledStructure.home.mainPaths.map(cleanTreeNode),
      christianLearningPath: bundledStructure.home.christianLearningPath.map(
        (step: any) => ({
          ...step,
          description: readerDescription(step.description),
        }),
      ),
      comparisonMethods: bundledStructure.home.comparisonMethods.map(
        (method: any) => ({
          ...method,
          description: readerDescription(method.description),
        }),
      ),
      featuredResearchCards: bundledStructure.home.featuredResearchCards.map(
        (card: any) => ({
          ...card,
          description: readerDescription(card.description),
          label: "Article",
        }),
      ),
    },
    articles: raw.articles.map(mapArticle),
    citations: raw.citations.map(mapCitation),
    glossary: raw.glossary.map(mapGlossary),
    sources: mapSources(raw.sourceCategories, raw.sourceItems),
    claimsAgainstIslam: raw.claims,
    keyScriptureByArticle: mapKeyScripture(
      raw.keyScripture,
      raw.quranVerses,
      raw.bibleVerses,
    ),
  };
}

const bundledContent: AppContent = buildContent({
  articles: bundledArticles,
  citations: bundledCitations,
  glossary: bundledGlossary,
  sourceCategories: bundledSourceCategories,
  sourceItems: bundledSourceItems,
  claims: bundledClaims,
  quranVerses: bundledQuranVerses,
  bibleVerses: bundledBibleVerses,
  keyScripture: bundledArticleKeyScripture,
});

export function getTrees(): Record<string, any> {
  return Object.fromEntries(
    Object.entries(bundledStructure.trees).map(([key, nodes]) => [
      key,
      Array.isArray(nodes) ? nodes.map(cleanTreeNode) : nodes,
    ]),
  );
}

export function useContent(): AppContent {
  return bundledContent;
}
