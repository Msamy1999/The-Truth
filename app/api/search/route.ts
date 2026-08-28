import { NextResponse } from "next/server";
import { articleSearchFacets, searchArticles } from "@/lib/article-search";
import { getArticles, getSiteCategories } from "@/lib/content";
import { requestClientKey } from "@/lib/request-client";

export const runtime = "nodejs";

const MAX_QUERY_LENGTH = 120;
const MAX_FILTER_LENGTH = 80;
const RATE_WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_CLIENT = 120;
const MAX_REQUESTS_PER_WINDOW = 5_000;
const MAX_TRACKED_CLIENTS = 5_000;
const SEARCH_INDEX_TTL_MS = 5 * 60_000;

type RateLimitEntry = { count: number; resetAt: number };
const requestsByClient = new Map<string, RateLimitEntry>();
let globalRateLimit: RateLimitEntry = {
  count: 0,
  resetAt: Date.now() + RATE_WINDOW_MS,
};
let searchIndex:
  | {
      expiresAt: number;
      value: Promise<{
        articles: Awaited<ReturnType<typeof getArticles>>;
        categories: Awaited<ReturnType<typeof getSiteCategories>>;
        facets: ReturnType<typeof articleSearchFacets>;
      }>;
    }
  | undefined;

function getSearchIndex() {
  const now = Date.now();
  if (searchIndex && searchIndex.expiresAt > now) return searchIndex.value;

  const value = Promise.all([getArticles(), getSiteCategories()])
    .then(([articles, categories]) => ({
      articles,
      categories,
      facets: articleSearchFacets(articles),
    }))
    .catch((error) => {
      // A transient database failure must not poison searches until the TTL.
      if (searchIndex?.value === value) searchIndex = undefined;
      throw error;
    });
  searchIndex = { expiresAt: now + SEARCH_INDEX_TTL_MS, value };
  return value;
}

function parameter(url: URL, name: string, maxLength: number): string | null {
  const value = (url.searchParams.get(name) ?? "").trim();
  return value.length <= maxLength ? value : null;
}

function consumeRequest(client: string): number | null {
  const now = Date.now();
  if (globalRateLimit.resetAt <= now) {
    globalRateLimit = { count: 0, resetAt: now + RATE_WINDOW_MS };
  }
  if (globalRateLimit.count >= MAX_REQUESTS_PER_WINDOW) {
    return Math.max(1, Math.ceil((globalRateLimit.resetAt - now) / 1_000));
  }

  if (requestsByClient.size >= MAX_TRACKED_CLIENTS) {
    for (const [key, entry] of requestsByClient) {
      if (entry.resetAt <= now) requestsByClient.delete(key);
    }
    if (requestsByClient.size >= MAX_TRACKED_CLIENTS) {
      requestsByClient.delete(requestsByClient.keys().next().value!);
    }
  }

  const existing = requestsByClient.get(client);
  const entry =
    existing && existing.resetAt > now
      ? existing
      : { count: 0, resetAt: now + RATE_WINDOW_MS };
  requestsByClient.set(client, entry);

  if (entry.count >= MAX_REQUESTS_PER_CLIENT) {
    return Math.max(1, Math.ceil((entry.resetAt - now) / 1_000));
  }
  entry.count += 1;
  globalRateLimit.count += 1;
  return null;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = parameter(url, "q", MAX_QUERY_LENGTH);
  const category = parameter(url, "category", MAX_FILTER_LENGTH);
  const audienceLevel = parameter(url, "audience", MAX_FILTER_LENGTH);
  const tag = parameter(url, "tag", MAX_FILTER_LENGTH);
  if ([query, category, audienceLevel, tag].some((value) => value === null)) {
    return NextResponse.json(
      { error: "A search parameter is too long" },
      { status: 400, headers: { "Cache-Control": "private, no-store" } },
    );
  }

  const retryAfter = consumeRequest(requestClientKey(request));
  if (retryAfter !== null) {
    return NextResponse.json(
      { error: "Too many search requests. Please try again shortly." },
      {
        status: 429,
        headers: {
          "Cache-Control": "private, no-store",
          "Retry-After": String(retryAfter),
        },
      },
    );
  }

  let index: Awaited<ReturnType<typeof getSearchIndex>>;
  try {
    index = await getSearchIndex();
  } catch (error) {
    console.error("Search index could not be loaded", error);
    return NextResponse.json(
      { error: "Search is temporarily unavailable" },
      {
        status: 503,
        headers: {
          "Cache-Control": "private, no-store",
          "Retry-After": "10",
        },
      },
    );
  }
  const { articles, categories, facets } = index;

  return NextResponse.json(
    {
      results: searchArticles(articles, categories, {
        query: query!,
        category: category!,
        audienceLevel: audienceLevel!,
        tag: tag!,
      }),
      facets,
      articleCount: articles.length,
    },
    {
      headers: {
        // Search terms can be sensitive and create an unbounded cache key
        // space, so neither the browser nor a shared proxy should retain them.
        "Cache-Control": "private, no-store",
      },
    },
  );
}
