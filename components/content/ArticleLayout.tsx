import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";
import {
  ArticleStatusBadge,
  getArticleStatusDescription,
  getArticleStatusLabel,
} from "@/components/content/ArticleStatusBadge";
import { ArticleTools } from "@/components/content/ArticleTools";
import { Callout } from "@/components/content/Callout";
import { CitationList } from "@/components/content/CitationList";
import { TopicCard } from "@/components/content/TopicCard";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { Section } from "@/components/layout/Section";
import { Card } from "@/components/ui/Card";
import { Tag } from "@/components/ui/Tag";
import { buildArticlePlainText } from "@/lib/article-text";
import { categoryIconMap, fallbackCategoryIcon } from "@/lib/category-icons";
import {
  formatArabicQuranReference,
  quranQuoteSegmentsInLine,
  quranReferenceForQuoteSegment,
} from "@/lib/quran";
import type { Article, Citation, SiteCategory } from "@/types/content";

type ArticleLayoutProps = {
  article: Article;
  category: SiteCategory;
  citations: Citation[];
  relatedArticles: Article[];
  tocItems?: Array<{
    id: string;
    title: string;
  }>;
  /**
   * Plain-text override for the read-aloud/copy tools. Layouts that render
   * custom children (e.g. comparison articles) pass their own text here;
   * otherwise it is built from the article sections.
   */
  plainText?: string;
  children?: ReactNode;
};

export function ArticleLayout({
  article,
  category,
  citations,
  relatedArticles,
  tocItems,
  plainText,
  children,
}: ArticleLayoutProps) {
  const CategoryIcon = categoryIconMap[category.icon] ?? fallbackCategoryIcon;
  const tableOfContents =
    tocItems ?? article.sections.map((section) => ({ id: section.id, title: section.title }));
  const articleText = plainText ?? buildArticlePlainText(article);

  return (
    <>
      <Section className="border-b border-border" spacing="sm">
        <Container>
          <Breadcrumbs
            items={[
              { label: "Library", href: "/" },
              { label: category.title, href: category.href },
              { label: article.title },
            ]}
          />
          <div className="mt-4 max-w-4xl">
            <PageHeader
              eyebrow="Research article"
              title={article.title}
              subtitle={article.subtitle}
              titleClassName="text-2xl sm:text-3xl lg:text-3xl"
            />
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <ArticleStatusBadge status={article.status} />
              {article.tags.map((tag) => (
                <Tag key={tag}>{tag}</Tag>
              ))}
              <Tag>{article.audienceLevel}</Tag>
            </div>
            <p className="mt-3 text-xs text-muted-foreground sm:text-sm">
              Last updated:{" "}
              <time dateTime={article.lastUpdated}>{article.lastUpdated}</time>
            </p>
            <p
              className="mt-3 max-w-3xl rounded-md border border-border bg-muted/40 px-3 py-2 text-xs leading-5 text-muted-foreground sm:text-sm"
              role="status"
            >
              <span className="font-semibold text-foreground">
                {getArticleStatusLabel(article.status)}:{" "}
              </span>
              {getArticleStatusDescription(article.status)}
            </p>
            <div className="mt-3">
              <ArticleTools articleText={articleText} articleTitle={article.title} />
            </div>
          </div>
        </Container>
      </Section>

      <Section spacing="sm">
        <Container>
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
            <article className="min-w-0">
              <Callout type="respectful-reminder" title="Beginner summary">
                {article.summary}
              </Callout>

              <div className="mt-8 space-y-10">
                {children ??
                  article.sections.map((section) => (
                    <ArticleSectionBlock key={section.id} article={article} sectionId={section.id} />
                  ))}
              </div>

              <section id="sources" className="mt-12 scroll-mt-20">
                <PageHeader
                  titleAs="h2"
                  eyebrow="Sources"
                  title="Citations and source status"
                  subtitle="Placeholder or source-pending citations must be replaced before review or publication."
                />
                <div className="mt-6">
                  <CitationList citations={citations} />
                </div>
              </section>

              {relatedArticles.length > 0 ? (
                <section id="related-articles" className="mt-12 scroll-mt-20">
                  <PageHeader
                    titleAs="h2"
                    eyebrow="Related"
                    title="Related articles"
                    subtitle="Draft links show how future research paths can connect across categories."
                  />
                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    {relatedArticles.map((relatedArticle) => (
                      <TopicCard
                        key={relatedArticle.slug}
                        title={relatedArticle.title}
                        description={relatedArticle.summary}
                        href={`/articles/${relatedArticle.slug}`}
                        icon={CategoryIcon}
                        label={getArticleStatusLabel(relatedArticle.status)}
                        meta="Article"
                      />
                    ))}
                  </div>
                </section>
              ) : null}
            </article>

            <aside className="order-first lg:order-none lg:sticky lg:top-20">
              <Card className="p-4">
                <p className="text-sm font-semibold text-foreground">
                  On this page
                </p>
                <nav aria-label="Article table of contents" className="mt-3">
                  <ol className="space-y-2 text-sm text-muted-foreground">
                    {tableOfContents.map((item) => (
                      <li key={item.id}>
                        <a
                          href={`#${item.id}`}
                          className="inline-flex items-center gap-2 rounded-sm no-underline hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                        >
                          <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
                          {item.title}
                        </a>
                      </li>
                    ))}
                    {tableOfContents.some((item) => item.id === "sources") ? null : (
                      <li>
                        <a
                          href="#sources"
                          className="inline-flex items-center gap-2 rounded-sm no-underline hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                        >
                          <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
                          Sources
                        </a>
                      </li>
                    )}
                  </ol>
                </nav>
              </Card>
            </aside>
          </div>
        </Container>
      </Section>
    </>
  );
}

function ArticleSectionBlock({
  article,
  sectionId,
}: {
  article: Article;
  sectionId: string;
}) {
  const section = article.sections.find((item) => item.id === sectionId);

  if (!section) {
    return null;
  }

  return (
    <section id={section.id} className="scroll-mt-20">
      <p className="text-xs font-semibold uppercase text-accent sm:text-sm">
        {section.kind}
      </p>
      <h2 className="mt-2 select-text text-lg leading-snug sm:mt-3 sm:text-xl">{section.title}</h2>
      <ArticleSectionBody body={section.body} />
      {section.citationIds && section.citationIds.length > 0 ? (
        <p className="mt-4 text-xs font-medium uppercase text-muted-foreground">
          Source markers to verify: {section.citationIds.join(", ")}
        </p>
      ) : null}
    </section>
  );
}

function ArticleSectionBody({ body }: { body: string }) {
  const lines = body.split(/\r?\n/);

  return (
    <div className="mt-3 select-text whitespace-pre-wrap text-sm leading-6 text-muted-foreground sm:mt-4 sm:text-base sm:leading-7">
      {lines.map((line, index) => {
        const quotes = quranQuoteSegmentsInLine(line)
          .map((segment) => ({
            ...segment,
            label: formatArabicQuranReference(
              quranReferenceForQuoteSegment(lines, index, segment) ?? {
                surahNumber: 0,
                firstAyahNumber: 0,
              },
            ),
          }))
          .filter((segment): segment is typeof segment & { label: string } => Boolean(segment.label));

        if (quotes.length > 0) {
          let cursor = 0;
          return (
            <span key={`${index}-${line}`}>
              {quotes.map((quote) => {
                const before = line.slice(cursor, quote.start);
                cursor = quote.end;

                return (
                  <span key={`${quote.start}-${quote.end}`}>
                    {before}
                    <span className="block py-1.5">
                      <span
                        lang="ar"
                        dir="rtl"
                        className="block text-right text-xl leading-loose text-foreground sm:text-2xl"
                      >
                        {quote.text.normalize("NFC")}
                      </span>
                      <span
                        lang="ar"
                        dir="rtl"
                        className="mt-1 block text-right text-xs font-semibold text-accent sm:text-sm"
                      >
                        {quote.label}
                      </span>
                    </span>
                  </span>
                );
              })}
              {line.slice(cursor)}
              {index < lines.length - 1 ? <br /> : null}
            </span>
          );
        }

        return (
          <span key={`${index}-${line}`}>
            {line}
            {index < lines.length - 1 ? <br /> : null}
          </span>
        );
      })}
    </div>
  );
}
