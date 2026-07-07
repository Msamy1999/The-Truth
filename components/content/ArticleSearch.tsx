"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import {
  ArticleStatusBadge,
  getArticleStatusLabel,
} from "@/components/content/ArticleStatusBadge";
import { Card } from "@/components/ui/Card";
import { Tag } from "@/components/ui/Tag";
import type {
  Article,
  ArticleStatus,
  AudienceLevel,
  SiteCategory,
  TopicTag,
} from "@/types/content";

type ArticleSearchProps = {
  articles: Article[];
  categories: SiteCategory[];
};

const allValue = "all";

export function ArticleSearch({ articles, categories }: ArticleSearchProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(allValue);
  const [audienceLevel, setAudienceLevel] = useState<typeof allValue | AudienceLevel>(
    allValue,
  );
  const [tag, setTag] = useState<typeof allValue | TopicTag>(allValue);
  const [status, setStatus] = useState<typeof allValue | ArticleStatus>(allValue);

  const categoryTitles = useMemo(
    () => new Map(categories.map((item) => [item.slug, item.title])),
    [categories],
  );
  const tags = useMemo(
    () => Array.from(new Set(articles.flatMap((article) => article.tags))).sort(),
    [articles],
  );
  const audienceLevels = useMemo(
    () => Array.from(new Set(articles.map((article) => article.audienceLevel))).sort(),
    [articles],
  );
  const statuses = useMemo(
    () => Array.from(new Set(articles.map((article) => article.status))).sort(),
    [articles],
  );

  const filteredArticles = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return articles.filter((article) => {
      const categoryTitle = categoryTitles.get(article.category) ?? article.category;
      const searchable = [
        article.title,
        article.subtitle,
        article.summary,
        categoryTitle,
        article.category,
        ...article.tags,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return (
        (!normalizedQuery || searchable.includes(normalizedQuery)) &&
        (category === allValue || article.category === category) &&
        (audienceLevel === allValue || article.audienceLevel === audienceLevel) &&
        (tag === allValue || article.tags.includes(tag)) &&
        (status === allValue || article.status === status)
      );
    });
  }, [articles, audienceLevel, category, categoryTitles, query, status, tag]);

  return (
    <div className="space-y-6">
      <Card className="p-4">
        <div className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2">
          <Search aria-hidden="true" className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            type="search"
            aria-label="Search articles"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by title, summary, tag, or category"
            className="min-h-10 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
            onChange={(value) => setAudienceLevel(value as typeof allValue | AudienceLevel)}
          >
            <option value={allValue}>All levels</option>
            {audienceLevels.map((level) => (
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
            {tags.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </FilterSelect>
          <FilterSelect
            label="Status"
            value={status}
            onChange={(value) => setStatus(value as typeof allValue | ArticleStatus)}
          >
            <option value={allValue}>All statuses</option>
            {statuses.map((item) => (
              <option key={item} value={item}>
                {getArticleStatusLabel(item)}
              </option>
            ))}
          </FilterSelect>
        </div>
      </Card>

      <p className="text-sm text-muted-foreground">
        Showing {filteredArticles.length} of {articles.length} articles.
      </p>

      {filteredArticles.length > 0 ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {filteredArticles.map((article) => (
            <Card key={article.slug} className="p-4 sm:p-5">
              <p className="text-xs font-semibold uppercase text-accent">
                {categoryTitles.get(article.category) ?? article.category}
              </p>
              <h2 className="mt-2 text-lg leading-snug sm:mt-3 sm:text-xl">
                <Link
                  href={`/articles/${article.slug}`}
                  className="no-underline hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  {article.title}
                </Link>
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground sm:mt-3 sm:leading-7">
                {article.summary}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {article.tags.map((item) => (
                  <Tag key={item}>{item}</Tag>
                ))}
                <Tag>{article.audienceLevel}</Tag>
                <ArticleStatusBadge status={article.status} />
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-5 text-center sm:p-6">
          <h2 className="text-lg leading-snug sm:text-xl">No articles found</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground sm:leading-7">
            Try a broader search, remove a filter, or check back after more draft
            research pages are added.
          </p>
        </Card>
      )}
    </div>
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
