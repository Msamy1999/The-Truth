/**
 * Exports a content snapshot for the mobile app: code-defined site structure
 * (categories, trees, home data) plus the editorial content from the CMS API.
 * The app bundles these JSON files so the first launch works fully offline;
 * at runtime it refreshes from the live API when reachable.
 *
 * Run with the dev server up:  npx tsx scripts/export-mobile-content.ts
 */
import { mkdirSync, writeFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
import { atheismAgnosticismTree } from "../data/atheism-agnosticism-tree";
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

const API = process.env.API_URL ?? "http://127.0.0.1:3000";
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

async function main() {
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

  // Editorial content from the CMS API --------------------------------------
  for (const collection of [
    "articles",
    "citations",
    "glossary-terms",
    "source-library-categories",
    "source-library-items",
    "comparison-articles",
    "quran-verses",
    "bible-verses",
  ]) {
    const docs = await fetchAll(collection);
    writeFileSync(
      path.join(OUT, `${collection}.json`),
      JSON.stringify(docs, null, 2),
    );
    console.log(`${collection}.json written (${docs.length} docs)`);
  }

  console.log("Snapshot complete.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
