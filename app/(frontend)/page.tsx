import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, BookOpen, CheckCircle, Heart, Library, Search } from "lucide-react";
import { Callout } from "@/components/content/Callout";
import { ResearchTree } from "@/components/content/ResearchTree";
import { TopicCard } from "@/components/content/TopicCard";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { Section } from "@/components/layout/Section";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Tag } from "@/components/ui/Tag";
import { getHomeData } from "@/lib/content";
import { siteName, siteNameArabic } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Respectful Islamic Research Library",
  description:
    "A mobile-first Islamic research library for sincere seekers, source-aware study, and respectful comparison where needed.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: siteName,
    description:
      "Study Islam through clear definitions, careful sources, sincere questions, and respectful comparison where needed.",
  },
};

export default async function HomePage() {
  const { mainPaths, christianLearningPath, comparisonMethods, featuredResearchCards } = await getHomeData();

  return (
    <>
      <section className="border-b border-border">
        <Container>
          <div className="relative mx-auto aspect-[16/11] w-full overflow-hidden rounded-xl border border-border shadow-soft sm:aspect-[16/8] lg:aspect-[16/6]">
            <Image
              src="/hero-scriptures-2x.jpg"
              alt="The Quran, the Bible, and the Torah placed side by side on a wooden table"
              fill
              priority
              quality={90}
              sizes="(min-width: 1152px) 1088px, 100vw"
              className="object-cover"
            />
          </div>
          <div className="mx-auto max-w-3xl pt-5 sm:pt-8">
            <p className="mb-3 inline-flex rounded-md border border-border bg-card px-2.5 py-1 text-xs font-medium text-muted-foreground shadow-soft sm:text-sm">
              For sincere seekers
            </p>
            <h1 className="text-2xl font-semibold leading-tight text-foreground sm:text-4xl lg:text-5xl">
              Learn Islam with care, clarity, and sincere questions.
            </h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground sm:mt-5 sm:text-base sm:leading-7 lg:text-lg">
              {siteName}{" "}
              <span lang="ar" dir="rtl">
                ({siteNameArabic})
              </span>{" "}
              is an Islamic knowledge and research library. It introduces the
              foundations of Islam and, for readers who bring them, answers
              major questions about Christianity, atheism and agnosticism,
              scripture, history, and justice &mdash; all with source
              standards, gentle structure, and honest draft labels.
            </p>
            <div className="mt-5 flex flex-col gap-3 pb-6 sm:mt-7 sm:flex-row sm:pb-8">
              <ButtonLink href="/islam-overview">
                Start learning
                <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </ButtonLink>
              <ButtonLink href="/islam-christianity" variant="secondary">
                Islam & Christianity
                <Library aria-hidden="true" className="h-4 w-4" />
              </ButtonLink>
            </div>
          </div>
        </Container>
      </section>

      <Section id="seekers" className="border-b border-border">
        <Container>
          <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
            <PageHeader
              titleAs="h2"
              eyebrow="For sincere seekers"
              title="This is for people who want truth with patience."
              subtitle="Many visitors arrive with real questions, a love for God, and a desire to understand. This library is designed to slow the discussion down, define terms, and keep source status visible."
            />
            <Callout type="respectful-reminder" title="A welcoming standard">
              Muslims, Christians, and curious readers should feel safe to ask
              careful questions here. The goal is not to win a fight, but to
              study sincerely with honesty, respect, and clear sources.
            </Callout>
          </div>
        </Container>
      </Section>

      <Section id="study" tone="muted">
        <Container>
          <PageHeader
            titleAs="h2"
            eyebrow="Main paths"
            title="Five ways to begin"
            subtitle="This is a path/tree view rather than a card gallery: choose a branch below to move into that part of the library."
          />
          <div className="mt-6">
            <ResearchTree
              title={siteName}
              description="The five main entry points into the library. Glossary and the source library stay one tap away in the header and footer."
              nodes={mainPaths}
            />
          </div>
        </Container>
      </Section>

      <Section className="border-t border-border">
        <Container>
          <div className="grid gap-8 lg:grid-cols-[0.75fr_1.25fr] lg:items-start">
            <div className="space-y-5">
              <PageHeader
                titleAs="h2"
                eyebrow="Recommended path for Christians"
                title="A suggested order for Christian visitors."
                subtitle="Start with Jesus, then move through Tawhid, scripture, preservation, and salvation before reading common questions."
              />
              <div className="flex flex-wrap gap-2">
                <Tag>Christians</Tag>
                <Tag>Jesus</Tag>
                <Tag>Tawhid</Tag>
                <Tag>Scripture</Tag>
              </div>
            </div>
            <ol className="grid gap-4 sm:grid-cols-2">
              {christianLearningPath.map((step, index) => (
                <li key={step.title}>
                  <Card className="h-full p-5">
                    <div className="flex items-start gap-4">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted text-sm font-semibold text-accent">
                        {index + 1}
                      </span>
                      <div>
                        <h3 className="text-base leading-snug sm:text-lg">{step.title}</h3>
                        <p className="mt-1.5 text-sm leading-6 text-muted-foreground sm:mt-2 sm:leading-7">
                          {step.description}
                        </p>
                        <Link
                          href={step.href}
                          className="mt-3 inline-flex items-center gap-2 rounded-sm text-sm font-semibold text-accent no-underline hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:mt-4"
                        >
                          Open path
                          <ArrowRight aria-hidden="true" className="h-4 w-4" />
                        </Link>
                      </div>
                    </div>
                  </Card>
                </li>
              ))}
            </ol>
          </div>
        </Container>
      </Section>

      <Section tone="muted" className="border-t border-border">
        <Container>
          <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
            <PageHeader
              titleAs="h2"
              eyebrow="How we study"
              title="A calm method for difficult questions"
              subtitle="The library should make it easy to see what is scripture, what is interpretation, what is history, what is argument, and what still needs sources."
            />
            <div className="grid gap-3">
              {comparisonMethods.map((method) => (
                <Card key={method.title} className="p-4">
                  <div className="flex gap-3">
                    <CheckCircle
                      aria-hidden="true"
                      className="mt-1 h-5 w-5 shrink-0 text-accent"
                    />
                    <div>
                      <h3 className="text-base leading-snug">{method.title}</h3>
                      <p className="mt-1 text-sm leading-7 text-muted-foreground">
                        {method.description}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
              <Link
                href="/method"
                className="inline-flex min-h-11 items-center justify-center rounded-md border border-border bg-card px-4 py-3 text-sm font-semibold text-foreground no-underline hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                Read the full research method
              </Link>
            </div>
          </div>
        </Container>
      </Section>

      <Section className="border-t border-border">
        <Container>
          <PageHeader
            titleAs="h2"
            eyebrow="Featured research"
            title="Draft studies and planned questions"
            subtitle="These examples remain draft pages. They use placeholders until sources, verses, translations, and citations are verified."
          />
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featuredResearchCards.map((card) => (
              <TopicCard
                key={card.title}
                title={card.title}
                description={card.description}
                href={card.href}
                icon={selectResearchIcon(card.title)}
                label={card.label}
                meta="Source pending"
              />
            ))}
          </div>
        </Container>
      </Section>

      <Section tone="muted" className="border-t border-border">
        <Container>
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase text-accent sm:text-sm">
                Begin gently
              </p>
              <h2 className="mt-2 text-xl font-semibold leading-tight sm:mt-3 sm:text-2xl lg:text-3xl">
                Begin with the basics, then follow your questions.
              </h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground sm:mt-4 sm:text-base sm:leading-7">
                Start with Islam, follow the sources, and use the comparison
                branch when Christianity is the question you are bringing to
                the library.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <ButtonLink href="/islam-overview">
                Islam Overview
                <Heart aria-hidden="true" className="h-4 w-4" />
              </ButtonLink>
              <ButtonLink href="/sources" variant="secondary">
                View sources
                <Search aria-hidden="true" className="h-4 w-4" />
              </ButtonLink>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}

function selectResearchIcon(title: string) {
  if (title.toLowerCase().includes("jesus")) {
    return Heart;
  }

  if (title.toLowerCase().includes("quran")) {
    return BookOpen;
  }

  return Library;
}
