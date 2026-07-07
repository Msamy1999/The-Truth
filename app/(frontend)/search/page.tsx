import type { Metadata } from "next";
import { ArticleSearch } from "@/components/content/ArticleSearch";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { Section } from "@/components/layout/Section";
import { getArticles, getSiteCategories } from "@/lib/content";

export const metadata: Metadata = {
  title: "Search",
  description:
    "Search draft research articles by title, summary, category, tag, audience level, and status.",
  alternates: {
    canonical: "/search",
  },
  openGraph: {
    title: "Search the Library",
    description:
      "Search draft research articles by title, summary, category, tag, audience level, and status.",
  },
};

export default async function SearchPage() {
  const articles = await getArticles();
  const categories = await getSiteCategories();

  return (
    <>
      <Section className="border-b border-border" spacing="lg">
        <Container>
          <PageHeader
            eyebrow="Research search"
            title="Search the library"
            subtitle="Find draft articles by title, summary, category, tag, audience level, or status. Search is client-side for now."
          />
        </Container>
      </Section>
      <Section tone="muted">
        <Container>
          <ArticleSearch articles={articles} categories={categories} />
        </Container>
      </Section>
    </>
  );
}
