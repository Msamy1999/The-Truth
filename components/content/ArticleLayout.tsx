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
      <Section className="border-b border-border" spacing="lg">
        <Container>
          <Breadcrumbs
            items={[
              { label: "Library", href: "/" },
              { label: category.title, href: category.href },
              { label: article.title },
            ]}
          />
          <div className="mt-8 max-w-4xl">
            <PageHeader
              eyebrow="Research article"
              title={article.title}
              subtitle={article.subtitle}
            />
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <ArticleStatusBadge status={article.status} />
              {article.tags.map((tag) => (
                <Tag key={tag}>{tag}</Tag>
              ))}
              <Tag>{article.audienceLevel}</Tag>
            </div>
            <p className="mt-5 text-sm text-muted-foreground">
              Last updated:{" "}
              <time dateTime={article.lastUpdated}>{article.lastUpdated}</time>
            </p>
            <div className="mt-5">
              <Callout
                type={article.status === "published" ? "note" : "warning"}
                title={`${getArticleStatusLabel(article.status)} status`}
              >
                {getArticleStatusDescription(article.status)}
              </Callout>
            </div>
            <div className="mt-5">
              <ArticleTools articleText={articleText} articleTitle={article.title} />
            </div>
          </div>
        </Container>
      </Section>

      <Section>
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

              <section id="sources" className="mt-12 scroll-mt-28">
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
                <section id="related-articles" className="mt-12 scroll-mt-28">
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

            <aside className="order-first lg:order-none lg:sticky lg:top-32">
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
    <section id={section.id} className="scroll-mt-28">
      <p className="text-xs font-semibold uppercase text-accent sm:text-sm">
        {section.kind}
      </p>
      <h2 className="mt-2 select-text text-lg leading-snug sm:mt-3 sm:text-xl">{section.title}</h2>
      <p className="mt-3 select-text whitespace-pre-line text-sm leading-6 text-muted-foreground sm:mt-4 sm:text-base sm:leading-7">{section.body}</p>
      {section.citationIds && section.citationIds.length > 0 ? (
        <p className="mt-4 text-xs font-medium uppercase text-muted-foreground">
          Source markers to verify: {section.citationIds.join(", ")}
        </p>
      ) : null}
    </section>
  );
}
