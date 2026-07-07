import Link from "next/link";
import { SourceLibraryBrowser } from "@/components/content/SourceLibraryBrowser";
import { Callout } from "@/components/content/Callout";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { Section } from "@/components/layout/Section";
import { getSourceLibraryCategories } from "@/lib/content";

export const metadata = {
  title: "Source Library",
  description:
    "Source-library placeholders for Quran, Bible, hadith, tafsir, academic, manuscript, and historical resources.",
  alternates: {
    canonical: "/sources",
  },
  openGraph: {
    title: "Source Library",
    description:
      "Source-library placeholders for Quran, Bible, hadith, tafsir, academic, manuscript, and historical resources.",
  },
};

export default async function SourcesPage() {
  const categories = await getSourceLibraryCategories();

  return (
    <>
      <Section className="border-b border-border" spacing="lg">
        <Container>
          <PageHeader
            eyebrow="Source Library"
            title="Sources to verify before publication"
            subtitle="Organize source candidates by type and status. No bibliographic details should be added until checked."
          />
          <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-start">
            <Callout type="warning" title="Verification rule">
              Source cards are placeholders unless marked verified. Add authors,
              publishers, years, links, and manuscript data only after checking
              the exact source.
            </Callout>
            <Link
              href="/language-demo"
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-border bg-card px-4 py-3 text-sm font-semibold text-foreground no-underline hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              View verse layout demo
            </Link>
          </div>
        </Container>
      </Section>
      <Section tone="muted">
        <Container>
          <SourceLibraryBrowser categories={categories} />
        </Container>
      </Section>
    </>
  );
}
