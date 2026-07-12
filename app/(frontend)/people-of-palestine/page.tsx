import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, HandHeart } from "lucide-react";
import { Callout } from "@/components/content/Callout";
import { ResearchTree } from "@/components/content/ResearchTree";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { Section } from "@/components/layout/Section";
import { Tag } from "@/components/ui/Tag";
import { getResearchTree } from "@/lib/content";

export const metadata: Metadata = {
  title: "People of Palestine",
  description:
    "A respectful source-aware draft section for future study paths related to the people of Palestine.",
  alternates: {
    canonical: "/people-of-palestine",
  },
  openGraph: {
    title: "People of Palestine",
    description:
      "A careful draft area for future source-backed study, human dignity, history, and practical reading paths.",
  },
};

export default async function PeopleOfPalestinePage() {
  const peopleOfPalestineTree = await getResearchTree("people-of-palestine");

  return (
    <>
      <Section className="border-b border-border" spacing="sm">
        <Container>
          <Breadcrumbs
            items={[
              { label: "Library", href: "/" },
              { label: "People of Palestine" },
            ]}
          />
          <div className="mt-5 grid gap-5 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div>
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-md bg-muted text-accent sm:mb-4 sm:h-11 sm:w-11">
                <HandHeart aria-hidden="true" className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <PageHeader
                eyebrow="Human section"
                title="People of Palestine"
                subtitle="A respectful section for future source-backed study paths related to the people of Palestine, with careful attention to dignity, context, and verified references."
              />
              <div className="mt-4 flex flex-wrap gap-2">
                <Tag>Human dignity</Tag>
                <Tag>History</Tag>
                <Tag>Sources</Tag>
                <Tag>Draft-aware</Tag>
              </div>
            </div>
            <Callout type="respectful-reminder" title="Careful source posture">
              This section should avoid slogans, unsupported claims, and loose
              summaries. Future content needs exact sources, dates, context,
              and clear status labels.
            </Callout>
          </div>
        </Container>
      </Section>

      <Section tone="muted">
        <Container>
          <PageHeader
            titleAs="h2"
            eyebrow="Study map"
            title="Planned topics for careful study"
            subtitle="These topics are placeholders until source-backed material is written and reviewed. No historical or current claims are made here."
          />
          <div className="mt-6">
            <ResearchTree
              title="People of Palestine"
              description="A careful, human-centered outline. Historical and current claims will only be added once sources are verified."
              nodes={peopleOfPalestineTree}
            />
          </div>
          <Link
            href="/sources"
            className="mt-6 inline-flex items-center gap-2 rounded-sm text-sm font-semibold text-accent no-underline hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            Review source standards
            <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </Link>
        </Container>
      </Section>
    </>
  );
}
