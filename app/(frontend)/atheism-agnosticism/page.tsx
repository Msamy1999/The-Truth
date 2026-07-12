import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, CircleHelp } from "lucide-react";
import { Callout } from "@/components/content/Callout";
import { ResearchTree } from "@/components/content/ResearchTree";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { Section } from "@/components/layout/Section";
import { Tag } from "@/components/ui/Tag";
import { getResearchTree } from "@/lib/content";

export const metadata: Metadata = {
  title: "Atheism & Agnosticism Answers in Islam",
  description:
    "A source-aware draft section for questions from atheists, agnostics, skeptics, and seekers studying Islam.",
  alternates: {
    canonical: "/atheism-agnosticism",
  },
  openGraph: {
    title: "Atheism & Agnosticism Answers in Islam",
    description:
      "Organized draft paths for questions about belief, doubt, meaning, evidence, and source standards in Islamic study.",
  },
};

export default async function AtheismAgnosticismPage() {
  const atheismAgnosticismTree = await getResearchTree("atheism-agnosticism");

  return (
    <>
      <Section className="border-b border-border" spacing="sm">
        <Container>
          <Breadcrumbs
            items={[
              { label: "Library", href: "/" },
              { label: "Atheism & Agnosticism Answers in Islam" },
            ]}
          />
          <div className="mt-5 grid gap-5 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div>
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-md bg-muted text-accent sm:mb-4 sm:h-11 sm:w-11">
                <CircleHelp aria-hidden="true" className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <PageHeader
                eyebrow="Audience path"
                title="Atheism & Agnosticism Answers in Islam"
                subtitle="A respectful section for skeptics, agnostics, atheists, and seekers. Future answers should be built from clear definitions, careful reasoning, and verified sources."
              />
              <div className="mt-4 flex flex-wrap gap-2">
                <Tag>Doubt</Tag>
                <Tag>Meaning</Tag>
                <Tag>Evidence</Tag>
                <Tag>Source pending</Tag>
              </div>
            </div>
            <Callout type="note" title="Draft standard">
              This page is an architecture for future answers. It should not
              make final claims until arguments, scripture references, and
              supporting sources are reviewed.
            </Callout>
          </div>
        </Container>
      </Section>

      <Section tone="muted">
        <Container>
          <PageHeader
            titleAs="h2"
            eyebrow="Question map"
            title="Planned topics for future answers"
            subtitle="Each topic is a placeholder for carefully sourced material and should remain source-pending until reviewed."
          />
          <div className="mt-6">
            <ResearchTree
              title="Atheism & Agnosticism"
              description="A source-aware outline for skeptical and honest questions, in the order a careful reader might ask them."
              nodes={atheismAgnosticismTree}
            />
          </div>
          <Link
            href="/questions"
            className="mt-6 inline-flex items-center gap-2 rounded-sm text-sm font-semibold text-accent no-underline hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            Continue to common questions
            <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </Link>
        </Container>
      </Section>
    </>
  );
}
