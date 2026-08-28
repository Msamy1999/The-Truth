/**
 * Exports a content snapshot for the mobile app: code-defined site structure
 * (categories, trees, home data) plus the editorial content from the CMS API.
 * The app bundles these JSON files so the first launch works fully offline;
 * a new published-and-verified snapshot is delivered through an app update.
 *
 * Run with the dev server up:  npx tsx scripts/export-mobile-content.ts
 */
import { mkdirSync, writeFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
import { atheismAgnosticismTree } from "../data/atheism-agnosticism-tree";
import articleKeyScripture from "../data/article-key-scripture.json";
import { claimsAgainstIslam } from "../data/claims-against-islam";
import {
  christianLearningPath,
  comparisonMethods,
  featuredResearchCards,
  mainPaths,
} from "../data/home";
import { islamChristianityBranches } from "../data/islam-christianity-tree";
import { islamOverviewTree } from "../data/islam-overview-tree";
import { peopleOfPalestineTree } from "../data/people-of-palestine-tree";
import { siteCategories } from "../data/site";
import { cleanEditorialText } from "../lib/reader-text";

// Keep this aligned with the root `npm run dev` script.
const API = process.env.API_URL ?? "http://127.0.0.1:4173";
const OUT = path.resolve(__dirname, "../mobile/assets/content");

async function fetchAll(collection: string) {
  const docs: unknown[] = [];
  let page = 1;
  while (true) {
    const response = await fetch(
      `${API}/api/${collection}?limit=200&depth=1&sort=createdAt&page=${page}`,
    );
    if (!response.ok) {
      throw new Error(`${collection}: HTTP ${response.status}`);
    }
    const data = (await response.json()) as {
      docs: unknown[];
      hasNextPage: boolean;
    };
    docs.push(...data.docs);
    if (!data.hasNextPage) break;
    page += 1;
  }
  return docs;
}

function relationshipKeys(value: unknown, key: string): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (typeof item === "string" || typeof item === "number") return String(item);
      if (typeof item === "object" && item !== null && key in item) {
        return String((item as Record<string, unknown>)[key]);
      }
      return undefined;
    })
    .filter((item): item is string => Boolean(item));
}

/** Keep only fields consumed by the offline app and collapse expanded relations. */
function compactArticle(doc: unknown) {
  const article = doc as Record<string, any>;
  return {
    slug: article.slug,
    title: cleanEditorialText(article.title),
    subtitle: cleanEditorialText(article.subtitle),
    category: article.category,
    audienceLevel: article.audienceLevel,
    summary: cleanEditorialText(article.summary),
    tags: article.tags ?? [],
    status: article.status,
    lastUpdated: article.lastUpdated,
    sections: (article.sections ?? []).map((section: Record<string, any>) => ({
      sectionId: section.sectionId,
      title: cleanEditorialText(section.title),
      kind: section.kind,
      body: cleanEditorialText(section.body),
      citations: relationshipKeys(section.citations, "citationKey"),
    })),
    citations: relationshipKeys(article.citations, "citationKey"),
    relatedArticles: relationshipKeys(article.relatedArticles, "slug"),
  };
}

async function main() {
  const collectionNames = [
    "articles",
    "citations",
    "glossary-terms",
    "source-library-categories",
    "source-library-items",
    "comparison-articles",
    "quran-verses",
    "bible-verses",
  ] as const;
  const fetched = new Map(
    await Promise.all(
      collectionNames.map(async (collection) => [
        collection,
        await fetchAll(collection),
      ] as const),
    ),
  );
  const articles = fetched.get("articles") ?? [];
  if (articles.length === 0) {
    throw new Error(
      "The public CMS API returned no published articles. Existing mobile snapshot files were preserved.",
    );
  }

  // Fetch and validate everything before touching the existing offline
  // snapshot. A partial API outage must never leave the app with a mixture of
  // old and newly truncated files.
  for (const collection of ["articles", "comparison-articles"] as const) {
    const invalid = (fetched.get(collection) ?? []).filter(
      (doc) => (doc as { status?: string }).status !== "published",
    );
    if (invalid.length > 0) {
      throw new Error(`${collection}: public snapshot contained non-published records`);
    }
  }
  for (const collection of [
    "citations",
    "source-library-items",
    "quran-verses",
    "bible-verses",
  ] as const) {
    const invalid = (fetched.get(collection) ?? []).filter(
      (doc) => (doc as { status?: string }).status !== "verified",
    );
    if (invalid.length > 0) {
      throw new Error(`${collection}: public snapshot contained unverified records`);
    }
  }

  mkdirSync(OUT, { recursive: true });

  // Code-defined structure -------------------------------------------------
  const islamChristianityTree = islamChristianityBranches.map(
    ({ slug, children, defaultOpen }) => {
      const category = siteCategories.find((c) => c.slug === slug)!;
      return {
        id: slug,
        title: category.title,
        description: category.description,
        href: category.href,
        defaultOpen,
        children,
      };
    },
  );

  writeFileSync(
    path.join(OUT, "structure.json"),
    JSON.stringify(
      {
        categories: siteCategories,
        home: {
          mainPaths,
          christianLearningPath,
          comparisonMethods,
          featuredResearchCards,
        },
        trees: {
          "islam-overview": islamOverviewTree,
          "islam-christianity": islamChristianityTree,
          "atheism-agnosticism": atheismAgnosticismTree,
          "people-of-palestine": peopleOfPalestineTree,
        },
      },
      null,
      2,
    ),
  );
  console.log("structure.json written");
  writeFileSync(
    path.join(OUT, "claims-against-islam.json"),
    JSON.stringify(claimsAgainstIslam, null, 2),
  );
  console.log(`claims-against-islam.json written (${claimsAgainstIslam.length} responses)`);
  writeFileSync(
    path.join(OUT, "article-key-scripture.json"),
    JSON.stringify(articleKeyScripture, null, 2),
  );
  console.log(
    `article-key-scripture.json written (${Object.keys(articleKeyScripture).length} article selections)`,
  );

  // Editorial content from the CMS API --------------------------------------
  for (const collection of collectionNames) {
    const docs = fetched.get(collection) ?? [];
    const outputDocs = collection === "articles" ? docs.map(compactArticle) : docs;
    writeFileSync(
      path.join(OUT, `${collection}.json`),
      JSON.stringify(outputDocs, null, 2),
    );
    console.log(`${collection}.json written (${outputDocs.length} docs)`);
  }

  console.log("Snapshot complete.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
