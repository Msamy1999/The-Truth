/**
 * Content layer: bundled snapshot (works fully offline on first launch) +
 * live refresh from the CMS API with an AsyncStorage cache. The API base is
 * configured via EXPO_PUBLIC_API_URL; with none set the app stays on the
 * bundled/cached content.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import type {
  AppContent,
  Article,
  Citation,
  GlossaryTerm,
  SourceLibraryCategory,
} from "./types";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "";
const CACHE_KEY = "content-cache-v1";
const MANIFEST_KEY = "content-manifest-v1";

/* eslint-disable @typescript-eslint/no-require-imports */
const bundledStructure = require("../../assets/content/structure.json");
const bundledArticles = require("../../assets/content/articles.json");
const bundledCitations = require("../../assets/content/citations.json");
const bundledGlossary = require("../../assets/content/glossary-terms.json");
const bundledSourceCategories = require("../../assets/content/source-library-categories.json");
const bundledSourceItems = require("../../assets/content/source-library-items.json");
/* eslint-enable @typescript-eslint/no-require-imports */

// ---------------------------------------------------------------------------
// CMS document → app type mappers (same logic as the website's lib/content)
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Refresh: manifest-based change detection, full refetch, AsyncStorage cache
// ---------------------------------------------------------------------------

async function fetchCollection(collection: string): Promise<any[]> {
  const response = await fetch(
    `${API_URL}/api/${collection}?limit=200&depth=1&sort=createdAt`,
  );
  if (!response.ok) throw new Error(`${collection}: HTTP ${response.status}`);
  const data = (await response.json()) as { docs: any[] };
  return data.docs;
}

async function refreshFromApi(): Promise<AppContent | null> {
  if (!API_URL) return null;

  try {
    const manifestResponse = await fetch(`${API_URL}/api/content-manifest`);
    if (!manifestResponse.ok) return null;
    const manifest = await manifestResponse.text();

    const cachedManifest = await AsyncStorage.getItem(MANIFEST_KEY);
    if (cachedManifest === manifest) {
      return null; // Nothing changed.
    }

    const [articles, citations, glossary, sourceCategories, sourceItems] =
      await Promise.all([
        fetchCollection("articles"),
        fetchCollection("citations"),
        fetchCollection("glossary-terms"),
        fetchCollection("source-library-categories"),
        fetchCollection("source-library-items"),
      ]);

    const raw = { articles, citations, glossary, sourceCategories, sourceItems };
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(raw));
    await AsyncStorage.setItem(MANIFEST_KEY, manifest);
    return buildContent(raw);
  } catch {
    return null; // Offline or API unreachable — bundled/cached content stands.
  }
}

async function loadCached(): Promise<AppContent | null> {
  try {
    const cached = await AsyncStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    return buildContent(JSON.parse(cached));
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useContent(): AppContent {
  const [content, setContent] = useState<AppContent>(bundledContent);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const cached = await loadCached();
      if (cached && !cancelled) setContent(cached);

      const fresh = await refreshFromApi();
      if (fresh && !cancelled) setContent(fresh);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return content;
}
