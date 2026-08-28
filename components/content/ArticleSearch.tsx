"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Tag } from "@/components/ui/Tag";
import type {
  ArticleSearchFacets,
  ArticleSearchResponse,
  ArticleSearchResult,
} from "@/lib/article-search";
import type { AudienceLevel, SiteCategory, TopicTag } from "@/types/content";

type ArticleSearchProps = {
  categories: SiteCategory[];
  initialQuery?: string;
  initialCategory?: string;
  initialAudienceLevel?: typeof allValue | AudienceLevel;
  initialTag?: typeof allValue | TopicTag;
  initialResults: ArticleSearchResponse;
  facets: ArticleSearchFacets;
  articleCount: number;
};

const allValue = "all";

export function ArticleSearch({
  categories,
  initialQuery = "",
  initialCategory = allValue,
  initialAudienceLevel = allValue,
  initialTag = allValue,
  initialResults,
  facets,
  articleCount,
}: ArticleSearchProps) {
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState(initialCategory);
  const [audienceLevel, setAudienceLevel] = useState<
    typeof allValue | AudienceLevel
  >(initialAudienceLevel);
  const [tag, setTag] = useState<typeof allValue | TopicTag>(initialTag);
  const [results, setResults] = useState(initialResults);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const didMount = useRef(false);

  useEffect(() => {
    setQuery(initialQuery);
    setCategory(initialCategory);
    setAudienceLevel(initialAudienceLevel);
    setTag(initialTag);
    setResults(initialResults);
  }, [
    initialAudienceLevel,
    initialCategory,
    initialQuery,
    initialResults,
    initialTag,
  ]);

  const categoryTitles = useMemo(
    () => new Map(categories.map((item) => [item.slug, item.title])),
    [categories],
  );

  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true;
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setIsLoading(true);
      setError(null);
      const parameters = new URLSearchParams();
      if (query.trim()) parameters.set("q", query.trim());
      if (category !== allValue) parameters.set("category", category);
      if (audienceLevel !== allValue) parameters.set("audience", audienceLevel);
      if (tag !== allValue) parameters.set("tag", tag);

      try {
        const response = await fetch(`/api/search?${parameters}`, {
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error(`Search failed with HTTP ${response.status}`);
        }
        const body = (await response.json()) as {
          results: ArticleSearchResponse;
        };
        setResults(body.results);
        window.history.replaceState(
          window.history.state,
          "",
          parameters.size > 0 ? `/search?${parameters.toString()}` : "/search",
        );
      } catch (searchError) {
        if ((searchError as Error).name !== "AbortError") {
          setError("Search is temporarily unavailable. Please try again.");
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }, 200);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [audienceLevel, category, query, tag]);

  const totalResults = results.titleMatches.length + results.contentMatches.length;
  const isSearching = query.trim().length > 0;
  const hasActiveFilters =
    category !== allValue || audienceLevel !== allValue || tag !== allValue;

  return (
    <div className="space-y-6">
      <Card className="p-4">
        <div className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-accent">
          <Search aria-hidden="true" className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            type="search"
            aria-label="Search articles"
            maxLength={120}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search article titles and text"
            className="min-h-10 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Article titles appear first. Results below them show where the search words occur in an article.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <FilterSelect label="Category" value={category} onChange={setCategory}>
            <option value={allValue}>All categories</option>
            {categories.map((item) => (
              <option key={item.slug} value={item.slug}>
                {item.title}
              </option>
            ))}
          </FilterSelect>
          <FilterSelect
            label="Audience"
            value={audienceLevel}
            onChange={(value) =>
              setAudienceLevel(value as typeof allValue | AudienceLevel)
            }
          >
            <option value={allValue}>All levels</option>
            {facets.audienceLevels.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </FilterSelect>
          <FilterSelect
            label="Tag"
            value={tag}
            onChange={(value) => setTag(value as typeof allValue | TopicTag)}
          >
            <option value={allValue}>All tags</option>
            {facets.tags.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </FilterSelect>
        </div>
      </Card>

      <p className="text-sm text-muted-foreground" aria-live="polite">
        {isLoading
          ? "Searching…"
          : isSearching
            ? `Found ${totalResults} matching articles.`
            : hasActiveFilters
              ? `Showing ${totalResults} articles matching the selected filters.`
            : `Showing all ${articleCount} articles.`}
      </p>

      {error ? (
        <p role="alert" className="text-sm font-medium text-gold">
          {error}
        </p>
      ) : null}

      {results.titleMatches.length > 0 ? (
        <SearchResultGroup
          title={
            isSearching
              ? "Title matches"
              : hasActiveFilters
                ? "Filtered articles"
                : "All articles"
          }
          results={results.titleMatches}
          categoryTitles={categoryTitles}
        />
      ) : null}

      {results.contentMatches.length > 0 ? (
        <SearchResultGroup
          title="Mentioned in article text"
          results={results.contentMatches}
          categoryTitles={categoryTitles}
        />
      ) : null}

      {totalResults === 0 && !isLoading ? (
        <Card className="p-5 text-center sm:p-6">
          <h2 className="text-lg leading-snug sm:text-xl">No articles found</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground sm:leading-7">
            Try fewer words or choose a broader category.
          </p>
        </Card>
      ) : null}
    </div>
  );
}

function SearchResultGroup({
  title,
  results,
  categoryTitles,
}: {
  title: string;
  results: ArticleSearchResult[];
  categoryTitles: Map<string, string>;
}) {
  return (
    <section aria-label={title}>
      <h2 className="text-lg leading-snug sm:text-xl">{title}</h2>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {results.map((result) => (
          <SearchResultCard
            key={result.article.slug}
            result={result}
            categoryTitle={
              categoryTitles.get(result.article.category) ?? result.article.category
            }
          />
        ))}
      </div>
    </section>
  );
}

function SearchResultCard({
  result,
  categoryTitle,
}: {
  result: ArticleSearchResult;
  categoryTitle: string;
}) {
  const { article, matchedSection, snippet } = result;

  return (
    <Card className="p-4 sm:p-5">
      <p className="text-xs font-semibold uppercase text-accent">{categoryTitle}</p>
      <h3 className="mt-2 text-lg leading-snug sm:mt-3 sm:text-xl">
        <Link
          href={`/articles/${article.slug}${matchedSection ? `#${matchedSection}` : ""}`}
          className="no-underline hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          {article.title}
        </Link>
      </h3>
      {matchedSection && snippet ? (
        <p className="mt-2 text-sm leading-6 text-muted-foreground sm:mt-3 sm:leading-7">
          <span className="font-semibold text-foreground">
            Found in {matchedSection}:{" "}
          </span>
          {snippet}
        </p>
      ) : (
        <p className="mt-2 text-sm leading-6 text-muted-foreground sm:mt-3 sm:leading-7">
          {article.summary}
        </p>
      )}
      <div className="mt-4 flex flex-wrap gap-2">
        {article.tags.map((item) => (
          <Tag key={item}>{item}</Tag>
        ))}
        <Tag>{article.audienceLevel}</Tag>
      </div>
    </Card>
  );
}

type FilterSelectProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
};

function FilterSelect({ label, value, onChange, children }: FilterSelectProps) {
  return (
    <label className="grid gap-1 text-sm font-medium text-foreground">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-11 rounded-md border border-border bg-background px-3 text-sm font-normal text-foreground outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        {children}
      </select>
    </label>
  );
}
