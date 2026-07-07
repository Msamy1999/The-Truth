import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticleLayout } from "@/components/content/ArticleLayout";
import { ComparisonArticleLayout } from "@/components/content/ComparisonArticleLayout";
import {
  getArticleBySlug,
  getArticles,
  getCategoryBySlug,
  getCitationsByIds,
  getComparisonArticleBySlug,
  getRelatedArticles,
} from "@/lib/content";

type ArticlePageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateStaticParams() {
  const articles = await getArticles();
  return articles.map((article) => ({
    slug: article.slug,
  }));
}

export async function generateMetadata({
  params,
}: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  if (!article) {
    return {
      title: "Article not found",
    };
  }

  return {
    title: article.title,
    description: article.summary,
    alternates: {
      canonical: `/articles/${article.slug}`,
    },
    openGraph: {
      title: article.title,
      description: article.summary,
      type: "article",
      modifiedTime: article.lastUpdated,
    },
  };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  const comparison = await getComparisonArticleBySlug(article.slug);
  const citationIds = Array.from(
    new Set([...article.citations, ...(comparison?.sources ?? [])]),
  );
  const citations = await getCitationsByIds(citationIds);
  const relatedArticles = await getRelatedArticles(article);
  const category = await getCategoryBySlug(article.category);

  if (comparison) {
    return (
      <ComparisonArticleLayout
        article={article}
        category={category}
        comparison={comparison}
        citations={citations}
        relatedArticles={relatedArticles}
      />
    );
  }

  return (
    <ArticleLayout
      article={article}
      category={category}
      citations={citations}
      relatedArticles={relatedArticles}
    />
  );
}
