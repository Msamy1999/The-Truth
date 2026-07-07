/**
 * The content seam. Every page and server component reads content through
 * these helpers — never from the data files directly. All read helpers are
 * async so the storage backend (today: local TypeScript data files; next:
 * Payload CMS via its Local API) can be swapped without touching callers.
 *
 * `isIslamChristianityCategorySlug` is a pure predicate on a code-level
 * constant, so it stays synchronous.
 */
import { atheismAgnosticismTree } from "@/data/atheism-agnosticism-tree";
import { articles } from "@/data/content/articles";
import { citations } from "@/data/content/citations";
import { comparisonArticles } from "@/data/content/comparison-articles";
import { glossaryTerms } from "@/data/content/glossary";
import { sourceLibraryCategories } from "@/data/content/source-library";
import {
  christianLearningPath,
  comparisonMethods,
  featuredResearchCards,
  mainPaths,
} from "@/data/home";
import { islamChristianityBranches } from "@/data/islam-christianity-tree";
import { islamOverviewTree } from "@/data/islam-overview-tree";
import { peopleOfPalestineTree } from "@/data/people-of-palestine-tree";
import {
  islamChristianityCategorySlugs,
  learnIslamCategorySlugs,
  siteCategories,
} from "@/data/site";
import type {
  Article,
  CategorySlug,
  Citation,
  GlossaryTerm,
  ResearchTreeNode,
  SiteCategory,
  TopicTag,
} from "@/types/domain";

// ---------------------------------------------------------------------------
// Internal synchronous finders (implementation detail — do not export)
// ---------------------------------------------------------------------------

function findCategory(slug: CategorySlug): SiteCategory {
  return (
    siteCategories.find((category) => category.slug === slug) ??
    siteCategories[0]
  );
}

function findArticle(slug: string): Article | undefined {
  return articles.find((article) => article.slug === slug);
}

function findCitation(id: string): Citation | undefined {
  return citations.find((citation) => citation.id === id);
}

// ---------------------------------------------------------------------------
// Categories and site structure
// ---------------------------------------------------------------------------

export async function getSiteCategories(): Promise<SiteCategory[]> {
  return siteCategories;
}

export async function getCategoryBySlug(
  slug: CategorySlug,
): Promise<SiteCategory> {
  return findCategory(slug);
}

export async function getRelatedCategories(
  category: SiteCategory,
): Promise<SiteCategory[]> {
  return category.relatedSlugs.map(findCategory);
}

export async function getLearnIslamCategories(): Promise<SiteCategory[]> {
  return learnIslamCategorySlugs.map(findCategory);
}

export function isIslamChristianityCategorySlug(slug: CategorySlug): boolean {
  return (islamChristianityCategorySlugs as readonly CategorySlug[]).includes(
    slug,
  );
}

// ---------------------------------------------------------------------------
// Homepage data
// ---------------------------------------------------------------------------

export async function getHomeData() {
  return {
    mainPaths,
    christianLearningPath,
    comparisonMethods,
    featuredResearchCards,
  };
}

// ---------------------------------------------------------------------------
// Research trees
// ---------------------------------------------------------------------------

export type ResearchTreeSection =
  | "islam-overview"
  | "islam-christianity"
  | "atheism-agnosticism"
  | "people-of-palestine";

function composeIslamChristianityTree(): ResearchTreeNode[] {
  return islamChristianityBranches.map(({ slug, children, defaultOpen }) => {
    const category = findCategory(slug);

    return {
      id: slug,
      title: category.title,
      description: category.description,
      href: category.href,
      defaultOpen,
      children,
    };
  });
}

export async function getResearchTree(
  section: ResearchTreeSection,
): Promise<ResearchTreeNode[]> {
  switch (section) {
    case "islam-overview":
      return islamOverviewTree;
    case "islam-christianity":
      return composeIslamChristianityTree();
    case "atheism-agnosticism":
      return atheismAgnosticismTree;
    case "people-of-palestine":
      return peopleOfPalestineTree;
  }
}

// ---------------------------------------------------------------------------
// Articles
// ---------------------------------------------------------------------------

export type GetArticlesOptions = {
  /**
   * Include non-published articles. Defaults to true while the entire
   * library is placeholder drafts; flip the default (or pass false at call
   * sites) once real verified content starts publishing.
   */
  includeDrafts?: boolean;
};

export async function getArticles(
  options: GetArticlesOptions = {},
): Promise<Article[]> {
  const { includeDrafts = true } = options;

  if (includeDrafts) {
    return articles;
  }

  return articles.filter((article) => article.status === "published");
}

export async function getArticlesByCategory(
  category: CategorySlug,
  options: GetArticlesOptions = {},
): Promise<Article[]> {
  const all = await getArticles(options);

  return all.filter((article) => article.category === category);
}

export async function getArticleBySlug(
  slug: string,
): Promise<Article | undefined> {
  return findArticle(slug);
}

export async function getRelatedArticles(
  articleOrSlug: Article | string,
): Promise<Article[]> {
  const article =
    typeof articleOrSlug === "string"
      ? findArticle(articleOrSlug)
      : articleOrSlug;

  if (!article) {
    return [];
  }

  return article.relatedArticles
    .map(findArticle)
    .filter((relatedArticle): relatedArticle is Article =>
      Boolean(relatedArticle),
    );
}

// ---------------------------------------------------------------------------
// Citations, comparisons, glossary, source library
// ---------------------------------------------------------------------------

export async function getCitationsByIds(ids: string[]): Promise<Citation[]> {
  return ids
    .map(findCitation)
    .filter((citation): citation is Citation => Boolean(citation));
}

export async function getComparisonArticleBySlug(slug: string) {
  return comparisonArticles.find((article) => article.slug === slug);
}

export async function getGlossaryTerms(
  category?: TopicTag,
): Promise<GlossaryTerm[]> {
  if (!category) {
    return glossaryTerms;
  }

  return glossaryTerms.filter((term) => term.category === category);
}

export async function getSourceLibraryCategories() {
  return sourceLibraryCategories;
}
