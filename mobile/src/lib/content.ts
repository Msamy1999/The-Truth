/**
 * Content layer for the mobile library. All content is bundled with the app:
 * the reader works fully offline and never writes a duplicate content cache.
 * New material is delivered through an app update.
 */
import type {
  AppContent,
  Article,
  Citation,
  GlossaryTerm,
  SourceLibraryCategory,
} from "./types";

const bundledStructure = require("../../assets/content/structure.json");
const bundledArticles = require("../../assets/content/articles.json");
const bundledCitations = require("../../assets/content/citations.json");
const bundledGlossary = require("../../assets/content/glossary-terms.json");
const bundledSourceCategories = require("../../assets/content/source-library-categories.json");
const bundledSourceItems = require("../../assets/content/source-library-items.json");

function citationKeys(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) =>
      typeof item === "object" && item !== null && "citationKey" in item
        ? String((item as { citationKey: unknown }).citationKey)
        : undefined,
    )
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
    .map((category) => ({
      title: category.title,
      description: category.description,
      items: itemDocs
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
          authorOrPublisher: item.authorOrPublisher ?? undefined,
          year: item.year ?? undefined,
          url: item.url ?? undefined,
          notes: item.notes,
          status: item.status ?? "pending",
        })),
    }));
}

function buildContent(raw: {
  articles: any[];
  citations: any[];
  glossary: any[];
  sourceCategories: any[];
  sourceItems: any[];
}): AppContent {
  return {
    categories: bundledStructure.categories,
    home: bundledStructure.home,
    articles: raw.articles.map(mapArticle),
    citations: raw.citations.map(mapCitation),
    glossary: raw.glossary.map(mapGlossary),
    sources: mapSources(raw.sourceCategories, raw.sourceItems),
  };
}

const bundledContent: AppContent = buildContent({
  articles: bundledArticles,
  citations: bundledCitations,
  glossary: bundledGlossary,
  sourceCategories: bundledSourceCategories,
  sourceItems: bundledSourceItems,
});

export function getTrees(): Record<string, any> {
  return bundledStructure.trees;
}

export function useContent(): AppContent {
  return bundledContent;
}
