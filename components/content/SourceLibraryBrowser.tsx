"use client";

import { ExternalLink, Search } from "lucide-react";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Tag } from "@/components/ui/Tag";
import type {
  CitationType,
  SourceLibraryCategory,
} from "@/types/content";
import { safeExternalUrl } from "@/lib/external-url";

type SourceLibraryBrowserProps = {
  categories: SourceLibraryCategory[];
};

const allValue = "all";

export function SourceLibraryBrowser({ categories }: SourceLibraryBrowserProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(allValue);
  const [type, setType] = useState<typeof allValue | CitationType>(allValue);

  const items = useMemo(
    () => categories.flatMap((sourceCategory) => sourceCategory.items),
    [categories],
  );
  const categoryNames = useMemo(
    () => Array.from(new Set(items.map((item) => item.category))).sort(),
    [items],
  );
  const types = useMemo(
    () => Array.from(new Set(items.map((item) => item.type))).sort(),
    [items],
  );
  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return items.filter((item) => {
      const searchable = [
        item.title,
        item.type,
        item.category,
        item.authorOrPublisher,
        item.year?.toString(),
        item.notes,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return (
        (!normalizedQuery || searchable.includes(normalizedQuery)) &&
        (category === allValue || item.category === category) &&
        (type === allValue || item.type === type)
      );
    });
  }, [category, items, query, type]);

  return (
    <div className="space-y-8">
      <Card className="p-4">
        <div className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-accent">
          <Search aria-hidden="true" className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            type="search"
            aria-label="Search source library"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search source titles, types, or notes"
            className="min-h-10 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <FilterSelect label="Category" value={category} onChange={setCategory}>
            <option value={allValue}>All categories</option>
            {categoryNames.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </FilterSelect>
          <FilterSelect
            label="Type"
            value={type}
            onChange={(value) => setType(value as typeof allValue | CitationType)}
          >
            <option value={allValue}>All types</option>
            {types.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </FilterSelect>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {filteredItems.map((item) => {
          const sourceUrl = safeExternalUrl(item.url);
          return (
            <Card key={item.id} className="p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase text-accent">
                    {item.category}
                  </p>
                  <h2 className="mt-1.5 text-lg leading-snug sm:mt-2 sm:text-xl">
                    {item.title}
                  </h2>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 sm:mt-4">
                <Tag>{item.type}</Tag>
                {item.authorOrPublisher ? <Tag>{item.authorOrPublisher}</Tag> : null}
                {item.year ? <Tag>{item.year}</Tag> : null}
              </div>
              <p className="mt-3 text-sm leading-6 text-muted-foreground sm:mt-4 sm:leading-7">
                {item.notes}
              </p>
              {sourceUrl ? (
                <a
                  href={sourceUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="mt-4 inline-flex items-center gap-2 rounded-sm text-sm font-semibold text-accent no-underline hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  Open source
                  <ExternalLink aria-hidden="true" className="h-4 w-4" />
                </a>
              ) : null}
            </Card>
          );
        })}
      </div>

      {filteredItems.length === 0 ? (
        <Card className="p-5 text-center sm:p-6">
          <h2 className="text-lg leading-snug sm:text-xl">No source cards found</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground sm:leading-7">
            No verified source cards match these filters. Try a broader search,
            or open an article to see its references beside the relevant claims.
          </p>
        </Card>
      ) : null}
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
