import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const articlePath = path.resolve(dirname, "../assets/content/articles.json");

function relationshipKeys(value, key) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (typeof item === "string" || typeof item === "number") return String(item);
      if (item && typeof item === "object" && key in item) return String(item[key]);
      return undefined;
    })
    .filter(Boolean);
}

function compactArticle(article) {
  return {
    slug: article.slug,
    title: article.title,
    subtitle: article.subtitle,
    category: article.category,
    audienceLevel: article.audienceLevel,
    summary: article.summary,
    tags: article.tags ?? [],
    status: article.status,
    lastUpdated: article.lastUpdated,
    sections: (article.sections ?? []).map((section) => ({
      sectionId: section.sectionId,
      title: section.title,
      kind: section.kind,
      body: section.body,
      citations: relationshipKeys(section.citations, "citationKey"),
    })),
    citations: relationshipKeys(article.citations, "citationKey"),
    relatedArticles: relationshipKeys(article.relatedArticles, "slug"),
  };
}

const articles = JSON.parse(readFileSync(articlePath, "utf8"));
if (!Array.isArray(articles)) throw new Error("articles.json must contain an array");

const compacted = articles.map(compactArticle);
writeFileSync(articlePath, JSON.stringify(compacted));
console.log(`Compacted ${compacted.length} mobile articles.`);
