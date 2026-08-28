import type { Metadata } from "next";
import { ArticleSearch } from "@/components/content/ArticleSearch";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { Section } from "@/components/layout/Section";
import { articleSearchFacets, searchArticles } from "@/lib/article-search";
import { getArticles, getSiteCategories } from "@/lib/content";

export const metadata: Metadata = {
  title: "Search",
  description: "Search articles by title and by words found in their text.",
  robots: {
    index: false,
    follow: true,
  },
  alternates: {
    canonical: "/search",
  },
  openGraph: {
    title: "Search the Library",
    description: "Search articles by title and by words found in their text.",
  },
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string | string[];
    category?: string | string[];
    audience?: string | string[];
    tag?: string | string[];
  }>;
}) {
  const articles = await getArticles();
  const categories = await getSiteCategories();
  const facets = articleSearchFacets(articles);
  const parameters = await searchParams;
  const first = (value?: string | string[]) =>
    (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
  const initialQuery = first(parameters.q).slice(0, 120);
  const requestedCategory = first(parameters.category);
  const requestedAudience = first(parameters.audience);
  const requestedTag = first(parameters.tag);
  const initialCategory = categories.some(
    (category) => category.slug === requestedCategory,
  )
    ? requestedCategory
    : "all";
  const initialAudienceLevel = facets.audienceLevels.includes(
    requestedAudience as (typeof facets.audienceLevels)[number],
  )
    ? (requestedAudience as (typeof facets.audienceLevels)[number])
    : "all";
  const initialTag = facets.tags.includes(
    requestedTag as (typeof facets.tags)[number],
  )
    ? (requestedTag as (typeof facets.tags)[number])
    : "all";
  const initialResults = searchArticles(articles, categories, {
    query: initialQuery,
    category: initialCategory,
    audienceLevel: initialAudienceLevel,
    tag: initialTag,
  });

  return (
    <>
      <Section className="border-b border-border" spacing="lg">
        <Container>
          <PageHeader
            eyebrow="Library search"
            title="Search the library"
            subtitle="Find articles by title first, then by words found in the article text."
          />
        </Container>
      </Section>
      <Section tone="muted">
        <Container>
          <ArticleSearch
            categories={categories}
            initialQuery={initialQuery}
            initialCategory={initialCategory}
            initialAudienceLevel={initialAudienceLevel}
            initialTag={initialTag}
            initialResults={initialResults}
            facets={facets}
            articleCount={articles.length}
          />
        </Container>
      </Section>
    </>
  );
}
