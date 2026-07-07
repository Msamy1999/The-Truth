/**
 * The content seam. Every page and server component reads content through
 * these helpers — never from data files or the database directly.
 *
 * Backend today: Payload CMS via its Local API (in-process, no HTTP), with
 * documents mapped back to the React-free domain types in types/domain.ts.
 * Site structure (categories, navigation, home content, research trees)
 * deliberately stays code-defined in data/ — see CONTENT-EDITING.md.
 */
import { getPayload, type Payload } from "payload";
import config from "@payload-config";
import { atheismAgnosticismTree } from "@/data/atheism-agnosticism-tree";
import {
  christianLearningPath,
  comparisonMethods,
  featuredResearchCards,
  mainPaths,
} from "@/data/home";
import { islamChristianityBranches } from "@/data/islam-christianity-tree";
import { islamOverviewTree } from "@/data/islam-overview-tree";
import { peopleOfPalestineTree } from "@/data/people-of-palestine-tree";
import {
  islamChristianityCategorySlugs,
  learnIslamCategorySlugs,
  siteCategories,
} from "@/data/site";
import type {
  Article,
  ArticleSection,
  BibleDisplayVerse,
  CategorySlug,
  Citation,
  ComparisonArticle,
  GlossaryTerm,
  QuranDisplayVerse,
  ResearchTreeNode,
  SiteCategory,
  SourceLibraryCategory,
  TopicTag,
} from "@/types/domain";

// ---------------------------------------------------------------------------
// Payload client (module-level singleton; Payload caches instances globally)
// ---------------------------------------------------------------------------

let payloadPromise: Promise<Payload> | null = null;

function getClient(): Promise<Payload> {
  payloadPromise ??= getPayload({ config });
  return payloadPromise;
}

// ---------------------------------------------------------------------------
// Document → domain mappers (Payload returns null for empty optional fields;
// domain types use undefined)
// ---------------------------------------------------------------------------

function opt<T>(value: T | null | undefined): T | undefined {
  return value ?? undefined;
}

function citationKeys(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) =>
      typeof item === "object" && item !== null && "citationKey" in item
        ? String((item as { citationKey: unknown }).citationKey)
        : undefined,
    )
    .filter((key): key is string => Boolean(key));
}

type ArticleDoc = {
  slug: string;
  title: string;
  subtitle: string;
  category: CategorySlug;
  audienceLevel: Article["audienceLevel"];
  summary: string;
  tags?: TopicTag[] | null;
  status: Article["status"];
  lastUpdated: string;
  sections?:
    | {
        sectionId: string;
        title: string;
        kind: ArticleSection["kind"];
        body: string;
        citations?: unknown;
      }[]
    | null;
  citations?: unknown;
  relatedArticles?: unknown;
};

function mapArticle(doc: ArticleDoc): Article {
  return {
    slug: doc.slug,
    title: doc.title,
    subtitle: doc.subtitle,
    category: doc.category,
    audienceLevel: doc.audienceLevel,
    summary: doc.summary,
    tags: doc.tags ?? [],
    status: doc.status,
    lastUpdated: doc.lastUpdated.slice(0, 10),
    sections: (doc.sections ?? []).map((section) => ({
      id: section.sectionId,
      title: section.title,
      kind: section.kind,
      body: section.body,
      citationIds: citationKeys(section.citations),
    })),
    citations: citationKeys(doc.citations),
    relatedArticles: Array.isArray(doc.relatedArticles)
      ? doc.relatedArticles
          .map((related) =>
            typeof related === "object" && related !== null && "slug" in related
              ? String((related as { slug: unknown }).slug)
              : undefined,
          )
          .filter((slug): slug is string => Boolean(slug))
      : [],
  };
}

type CitationDoc = {
  citationKey: string;
  type: Citation["type"];
  title: string;
  author?: string | null;
  publisher?: string | null;
  year?: number | null;
  url?: string | null;
  note?: string | null;
};

function mapCitation(doc: CitationDoc): Citation {
  return {
    id: doc.citationKey,
    type: doc.type,
    title: doc.title,
    author: opt(doc.author),
    publisher: opt(doc.publisher),
    year: opt(doc.year),
    url: opt(doc.url),
    note: opt(doc.note),
  };
}

// ---------------------------------------------------------------------------
// Categories and site structure (code-defined)
// ---------------------------------------------------------------------------

function findCategory(slug: CategorySlug): SiteCategory {
  return (
    siteCategories.find((category) => category.slug === slug) ??
    siteCategories[0]
  );
}

export async function getSiteCategories(): Promise<SiteCategory[]> {
  return siteCategories;
}

export async function getCategoryBySlug(
  slug: CategorySlug,
): Promise<SiteCategory> {
  return findCategory(slug);
}

export async function getRelatedCategories(
  category: SiteCategory,
): Promise<SiteCategory[]> {
  return category.relatedSlugs.map(findCategory);
}

export async function getLearnIslamCategories(): Promise<SiteCategory[]> {
  return learnIslamCategorySlugs.map(findCategory);
}

export function isIslamChristianityCategorySlug(slug: CategorySlug): boolean {
  return (islamChristianityCategorySlugs as readonly CategorySlug[]).includes(
    slug,
  );
}

// ---------------------------------------------------------------------------
// Homepage data (code-defined)
// ---------------------------------------------------------------------------

export async function getHomeData() {
  return {
    mainPaths,
    christianLearningPath,
    comparisonMethods,
    featuredResearchCards,
  };
}

// ---------------------------------------------------------------------------
// Research trees (code-defined, composed with categories)
// ---------------------------------------------------------------------------

export type ResearchTreeSection =
  | "islam-overview"
  | "islam-christianity"
  | "atheism-agnosticism"
  | "people-of-palestine";

function composeIslamChristianityTree(): ResearchTreeNode[] {
  return islamChristianityBranches.map(({ slug, children, defaultOpen }) => {
    const category = findCategory(slug);

    return {
      id: slug,
      title: category.title,
      description: category.description,
      href: category.href,
      defaultOpen,
      children,
    };
  });
}

export async function getResearchTree(
  section: ResearchTreeSection,
): Promise<ResearchTreeNode[]> {
  switch (section) {
    case "islam-overview":
      return islamOverviewTree;
    case "islam-christianity":
      return composeIslamChristianityTree();
    case "atheism-agnosticism":
      return atheismAgnosticismTree;
    case "people-of-palestine":
      return peopleOfPalestineTree;
  }
}

// ---------------------------------------------------------------------------
// Articles (Payload-backed)
// ---------------------------------------------------------------------------

export type GetArticlesOptions = {
  /**
   * Include non-published articles. Defaults to true while the entire
   * library is placeholder drafts; flip the default (or pass false at call
   * sites) once real verified content starts publishing.
   */
  includeDrafts?: boolean;
};

export async function getArticles(
  options: GetArticlesOptions = {},
): Promise<Article[]> {
  const { includeDrafts = true } = options;
  const payload = await getClient();

  const result = await payload.find({
    collection: "articles",
    where: includeDrafts ? {} : { status: { equals: "published" } },
    sort: "createdAt",
    pagination: false,
    depth: 1,
  });

  return result.docs.map((doc) => mapArticle(doc as unknown as ArticleDoc));
}

export async function getArticlesByCategory(
  category: CategorySlug,
  options: GetArticlesOptions = {},
): Promise<Article[]> {
  const { includeDrafts = true } = options;
  const payload = await getClient();

  const result = await payload.find({
    collection: "articles",
    where: {
      and: [
        { category: { equals: category } },
        ...(includeDrafts ? [] : [{ status: { equals: "published" } }]),
      ],
    },
    sort: "createdAt",
    pagination: false,
    depth: 1,
  });

  return result.docs.map((doc) => mapArticle(doc as unknown as ArticleDoc));
}

export async function getArticleBySlug(
  slug: string,
): Promise<Article | undefined> {
  const payload = await getClient();

  const result = await payload.find({
    collection: "articles",
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 1,
  });

  const doc = result.docs[0];
  return doc ? mapArticle(doc as unknown as ArticleDoc) : undefined;
}

export async function getRelatedArticles(
  articleOrSlug: Article | string,
): Promise<Article[]> {
  const article =
    typeof articleOrSlug === "string"
      ? await getArticleBySlug(articleOrSlug)
      : articleOrSlug;

  if (!article || article.relatedArticles.length === 0) {
    return [];
  }

  const payload = await getClient();
  const result = await payload.find({
    collection: "articles",
    where: { slug: { in: article.relatedArticles } },
    pagination: false,
    depth: 1,
  });

  const bySlug = new Map(
    result.docs.map((doc) => {
      const mapped = mapArticle(doc as unknown as ArticleDoc);
      return [mapped.slug, mapped] as const;
    }),
  );

  // Preserve the order defined on the article record.
  return article.relatedArticles
    .map((slug) => bySlug.get(slug))
    .filter((related): related is Article => Boolean(related));
}

// ---------------------------------------------------------------------------
// Citations (Payload-backed)
// ---------------------------------------------------------------------------

export async function getCitationsByIds(ids: string[]): Promise<Citation[]> {
  if (ids.length === 0) {
    return [];
  }

  const payload = await getClient();
  const result = await payload.find({
    collection: "citations",
    where: { citationKey: { in: ids } },
    pagination: false,
    depth: 0,
  });

  const byKey = new Map(
    result.docs.map((doc) => {
      const mapped = mapCitation(doc as unknown as CitationDoc);
      return [mapped.id, mapped] as const;
    }),
  );

  return ids
    .map((id) => byKey.get(id))
    .filter((citation): citation is Citation => Boolean(citation));
}

// ---------------------------------------------------------------------------
// Comparison articles (Payload-backed)
// ---------------------------------------------------------------------------

type VerseDocBase = {
  reference: string;
  notes?: string | null;
};

type QuranVerseDoc = VerseDocBase & {
  surahName: string;
  surahNumber: number;
  ayahNumber: number;
  arabic: string;
  translation: string;
  translator: string;
  arabicTafsirNote?: string | null;
};

type BibleVerseDoc = VerseDocBase & {
  book: string;
  chapter: number;
  verse: string;
  text: string;
  arabicText?: string | null;
  arabicSource?: string | null;
  version: string;
};

function mapQuranVerse(doc: QuranVerseDoc): QuranDisplayVerse {
  return {
    scripture: "quran",
    surahName: doc.surahName,
    surahNumber: doc.surahNumber,
    ayahNumber: doc.ayahNumber,
    arabic: doc.arabic,
    translation: doc.translation,
    translator: doc.translator,
    reference: doc.reference,
    arabicTafsirNote: opt(doc.arabicTafsirNote),
    notes: opt(doc.notes),
  };
}

function mapBibleVerse(doc: BibleVerseDoc): BibleDisplayVerse {
  return {
    scripture: "bible",
    book: doc.book,
    chapter: doc.chapter,
    verse: doc.verse,
    text: doc.text,
    arabicText: opt(doc.arabicText),
    arabicSource: opt(doc.arabicSource),
    version: doc.version,
    reference: doc.reference,
    notes: opt(doc.notes),
  };
}

export async function getComparisonArticleBySlug(
  slug: string,
): Promise<ComparisonArticle | undefined> {
  const payload = await getClient();

  const result = await payload.find({
    collection: "comparison-articles",
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 1,
  });

  const doc = result.docs[0] as
    | undefined
    | {
        slug: string;
        mainQuestion: string;
        beginnerSummary: string;
        quranicPerspective: string;
        biblicalPerspective: string;
        historicalContext: string;
        christianInterpretation: string;
        islamicResponse: string;
        keyDifferences?: { difference: string }[] | null;
        commonObjections?: { objection: string; response: string }[] | null;
        respectfulConclusion: string;
        quranVerses?: unknown;
        bibleVerses?: unknown;
        sources?: unknown;
        relatedTopics?: { topic: string }[] | null;
      };

  if (!doc) {
    return undefined;
  }

  return {
    slug: doc.slug,
    mainQuestion: doc.mainQuestion,
    beginnerSummary: doc.beginnerSummary,
    quranicPerspective: doc.quranicPerspective,
    biblicalPerspective: doc.biblicalPerspective,
    historicalContext: doc.historicalContext,
    christianInterpretation: doc.christianInterpretation,
    islamicResponse: doc.islamicResponse,
    keyDifferences: (doc.keyDifferences ?? []).map((item) => item.difference),
    commonObjections: (doc.commonObjections ?? []).map((item) => ({
      objection: item.objection,
      response: item.response,
    })),
    respectfulConclusion: doc.respectfulConclusion,
    quranVerses: Array.isArray(doc.quranVerses)
      ? (doc.quranVerses as QuranVerseDoc[])
          .filter((verse) => typeof verse === "object" && verse !== null)
          .map(mapQuranVerse)
      : [],
    bibleVerses: Array.isArray(doc.bibleVerses)
      ? (doc.bibleVerses as BibleVerseDoc[])
          .filter((verse) => typeof verse === "object" && verse !== null)
          .map(mapBibleVerse)
      : [],
    sources: citationKeys(doc.sources),
    relatedTopics: (doc.relatedTopics ?? []).map((item) => item.topic),
  };
}

// ---------------------------------------------------------------------------
// Glossary (Payload-backed)
// ---------------------------------------------------------------------------

export async function getGlossaryTerms(
  category?: TopicTag,
): Promise<GlossaryTerm[]> {
  const payload = await getClient();

  const result = await payload.find({
    collection: "glossary-terms",
    where: category ? { category: { equals: category } } : {},
    sort: "createdAt",
    pagination: false,
    depth: 1,
  });

  return result.docs.map((doc) => {
    const record = doc as unknown as {
      term: string;
      pronunciation?: string | null;
      definition: string;
      category: TopicTag;
      relatedTerms?: unknown;
      citations?: unknown;
    };

    return {
      term: record.term,
      pronunciation: opt(record.pronunciation),
      definition: record.definition,
      category: record.category,
      relatedTerms: Array.isArray(record.relatedTerms)
        ? record.relatedTerms
            .map((related) =>
              typeof related === "object" && related !== null && "term" in related
                ? String((related as { term: unknown }).term)
                : undefined,
            )
            .filter((term): term is string => Boolean(term))
        : [],
      citations: citationKeys(record.citations),
    };
  });
}

// ---------------------------------------------------------------------------
// Source library (Payload-backed)
// ---------------------------------------------------------------------------

export async function getSourceLibraryCategories(): Promise<
  SourceLibraryCategory[]
> {
  const payload = await getClient();

  const [categoriesResult, itemsResult] = await Promise.all([
    payload.find({
      collection: "source-library-categories",
      sort: "order",
      pagination: false,
      depth: 0,
    }),
    payload.find({
      collection: "source-library-items",
      sort: "createdAt",
      pagination: false,
      depth: 0,
    }),
  ]);

  const categories = categoriesResult.docs as unknown as {
    id: string | number;
    title: string;
    description: string;
  }[];

  const items = itemsResult.docs as unknown as {
    id: string | number;
    title: string;
    type: Citation["type"];
    category: string | number | { id: string | number };
    authorOrPublisher?: string | null;
    year?: number | null;
    url?: string | null;
    notes: string;
    status: "pending" | "verified";
  }[];

  return categories.map((category) => ({
    title: category.title,
    description: category.description,
    items: items
      .filter((item) => {
        const categoryId =
          typeof item.category === "object" && item.category !== null
            ? item.category.id
            : item.category;
        return String(categoryId) === String(category.id);
      })
      .map((item) => ({
        id: String(item.id),
        title: item.title,
        type: item.type,
        category: category.title,
        authorOrPublisher: opt(item.authorOrPublisher),
        year: opt(item.year),
        url: opt(item.url),
        notes: item.notes,
        status: item.status,
      })),
  }));
}
