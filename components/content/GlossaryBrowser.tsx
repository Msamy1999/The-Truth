"use client";

import { Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Tag } from "@/components/ui/Tag";
import type { GlossaryTerm, TopicTag } from "@/types/content";

type GlossaryBrowserProps = {
  terms: GlossaryTerm[];
};

const allValue = "all";

export function GlossaryBrowser({ terms }: GlossaryBrowserProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<typeof allValue | TopicTag>(allValue);

  const categories = useMemo(
    () => Array.from(new Set(terms.map((term) => term.category))).sort(),
    [terms],
  );

  const filteredTerms = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return terms.filter((term) => {
      const searchable = [
        term.term,
        term.pronunciation,
        term.definition,
        term.category,
        ...term.relatedTerms,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return (
        (!normalizedQuery || searchable.includes(normalizedQuery)) &&
        (category === allValue || term.category === category)
      );
    }).sort((left, right) => left.term.localeCompare(right.term));
  }, [category, query, terms]);

  const hasFilters = query.trim().length > 0 || category !== allValue;

  function showRelatedTerm(relatedTerm: string) {
    setQuery(relatedTerm);
    setCategory(allValue);
    window.requestAnimationFrame(() => {
      document.getElementById("glossary-results")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }

  return (
    <div className="space-y-6">
      <Card className="p-4">
        <div className="grid gap-3 md:grid-cols-[1fr_16rem]">
          <div className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2">
            <Search aria-hidden="true" className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              type="search"
              aria-label="Search glossary terms"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search glossary terms"
              className="min-h-10 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <label className="grid gap-1 text-sm font-medium text-foreground">
            Category
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value as typeof allValue | TopicTag)}
              className="min-h-11 rounded-md border border-border bg-background px-3 text-sm font-normal text-foreground outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              <option value={allValue}>All categories</option>
              {categories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
        </div>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        <p className="text-sm text-muted-foreground" aria-live="polite">
          Showing {filteredTerms.length} of {terms.length} terms
        </p>
        {hasFilters ? (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setCategory(allValue);
            }}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-md border border-border bg-background px-3 text-sm font-medium text-foreground transition-colors hover:border-accent hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <X aria-hidden="true" className="h-4 w-4" />
            Clear filters
          </button>
        ) : null}
      </div>

      {filteredTerms.length > 0 ? (
        <div id="glossary-results" className="grid scroll-mt-24 gap-4 md:grid-cols-2">
          {filteredTerms.map((term) => (
            <Card key={term.term} className="p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg leading-snug sm:text-xl">{term.term}</h2>
                  {term.pronunciation ? (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {term.pronunciation}
                    </p>
                  ) : null}
                </div>
                <Tag>{term.category}</Tag>
              </div>
              <p className="mt-3 text-sm leading-6 text-muted-foreground sm:mt-4 sm:leading-7">
                {term.definition}
              </p>
              {term.relatedTerms.length > 0 ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {term.relatedTerms.map((relatedTerm) => (
                    <button
                      type="button"
                      key={relatedTerm}
                      onClick={() => showRelatedTerm(relatedTerm)}
                      aria-label={`Show glossary definition for ${relatedTerm}`}
                      className="rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                    >
                      <Tag>{relatedTerm}</Tag>
                    </button>
                  ))}
                </div>
              ) : null}
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-5 text-center sm:p-6">
          <h2 className="text-lg leading-snug sm:text-xl">No glossary terms found</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground sm:leading-7">
            Try a broader search or remove the category filter.
          </p>
        </Card>
      )}
    </div>
  );
}
