import type {
  Article,
  AudienceLevel,
  SiteCategory,
  TopicTag,
} from "@/types/domain";

export type ArticleSearchSummary = Pick<
  Article,
  "slug" | "title" | "summary" | "category" | "audienceLevel" | "tags"
>;

export type ArticleSearchResult = {
  article: ArticleSearchSummary;
  matchedSection?: string;
  snippet?: string;
};

export type ArticleSearchResponse = {
  titleMatches: ArticleSearchResult[];
  contentMatches: ArticleSearchResult[];
};

export type ArticleSearchFilters = {
  query?: string;
  category?: string;
  audienceLevel?: string;
  tag?: string;
};

export type ArticleSearchFacets = {
  audienceLevels: AudienceLevel[];
  tags: TopicTag[];
};

const allValue = "all";

function summary(article: Article): ArticleSearchSummary {
  return {
    slug: article.slug,
    title: article.title,
    summary: article.summary,
    category: article.category,
    audienceLevel: article.audienceLevel,
    tags: article.tags,
  };
}

export function articleSearchFacets(articles: Article[]): ArticleSearchFacets {
  return {
    audienceLevels: Array.from(
      new Set(articles.map((article) => article.audienceLevel)),
    ).sort(),
    tags: Array.from(new Set(articles.flatMap((article) => article.tags))).sort(),
  };
}

export function searchArticles(
  articles: Article[],
  categories: SiteCategory[],
  filters: ArticleSearchFilters = {},
): ArticleSearchResponse {
  const words = (filters.query ?? "")
    .toLocaleLowerCase()
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const categoryTitles = new Map(
    categories.map((category) => [category.slug, category.title]),
  );
  const eligible = articles.filter(
    (article) =>
      (!filters.category ||
        filters.category === allValue ||
        article.category === filters.category) &&
      (!filters.audienceLevel ||
        filters.audienceLevel === allValue ||
        article.audienceLevel === filters.audienceLevel) &&
      (!filters.tag ||
        filters.tag === allValue ||
        article.tags.includes(filters.tag as TopicTag)),
  );

  if (words.length === 0) {
    return {
      titleMatches: eligible.map((article) => ({ article: summary(article) })),
      contentMatches: [],
    };
  }

  const titleMatches = eligible
    .filter((article) => includesAllWords(article.title, words))
    .map((article) => ({ article: summary(article) }));
  const titleSlugs = new Set(titleMatches.map(({ article }) => article.slug));
  const contentMatches = eligible
    .filter((article) => !titleSlugs.has(article.slug))
    .map((article) => findContentMatch(article, words, categoryTitles))
    .filter((result): result is ArticleSearchResult => result !== null);

  return { titleMatches, contentMatches };
}

function findContentMatch(
  article: Article,
  words: string[],
  categoryTitles: Map<string, string>,
): ArticleSearchResult | null {
  const articleText = [
    article.subtitle,
    article.summary,
    categoryTitles.get(article.category) ?? article.category,
    article.category,
    ...article.tags,
    ...article.sections.flatMap((section) => [section.title, section.body]),
  ].join(" ");

  if (!includesAllWords(articleText, words)) return null;

  const section = article.sections.find((item) =>
    words.some((word) =>
      `${item.title} ${item.body}`.toLocaleLowerCase().includes(word),
    ),
  );
  const text = section
    ? `${section.title}. ${section.body}`
    : `${article.subtitle}. ${article.summary}`;

  return {
    article: summary(article),
    matchedSection: section?.id,
    snippet: excerptAroundMatch(text, words),
  };
}

function includesAllWords(value: string, words: string[]) {
  const normalized = value.toLocaleLowerCase();
  return words.every((word) => normalized.includes(word));
}

function excerptAroundMatch(value: string, words: string[]) {
  const normalized = value.toLocaleLowerCase();
  const index =
    words
      .map((word) => normalized.indexOf(word))
      .filter((position) => position >= 0)
      .sort((first, second) => first - second)[0] ?? 0;
  const start = Math.max(0, index - 72);
  const end = Math.min(value.length, index + 210);
  return `${start > 0 ? "…" : ""}${value
    .slice(start, end)
    .replace(/\s+/g, " ")
    .trim()}${end < value.length ? "…" : ""}`;
}
