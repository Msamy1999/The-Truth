import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const contentDir = path.resolve(dirname, "../assets/content");
const strict = process.argv.includes("--strict");
const easMode = process.argv.includes("--eas");
const productionBuild = process.env.EAS_BUILD_PROFILE === "production";

function readCollection(name) {
  const value = JSON.parse(
    readFileSync(path.join(contentDir, `${name}.json`), "utf8"),
  );
  if (!Array.isArray(value)) {
    throw new Error(`${name}.json must contain an array`);
  }
  return value;
}

function readObject(name) {
  const value = JSON.parse(
    readFileSync(path.join(contentDir, `${name}.json`), "utf8"),
  );
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${name}.json must contain an object`);
  }
  return value;
}

const articles = readCollection("articles");
const comparisons = readCollection("comparison-articles");
const citations = readCollection("citations");
const quran = readCollection("quran-verses");
const bible = readCollection("bible-verses");
const sourceItems = readCollection("source-library-items");
const claims = readCollection("claims-against-islam");
const keyScripture = readObject("article-key-scripture");
const failures = [];

function requireStatus(records, collection, expected) {
  const invalid = records.filter((record) => record?.status !== expected);
  if (invalid.length > 0) {
    failures.push(`${collection}: ${invalid.length} record(s) are not ${expected}`);
  }
}

if (articles.length === 0) failures.push("articles: snapshot is empty");
if (claims.length === 0) failures.push("claims-against-islam: snapshot is empty");
requireStatus(articles, "articles", "published");
requireStatus(comparisons, "comparison-articles", "published");
requireStatus(citations, "citations", "verified");
requireStatus(quran, "quran-verses", "verified");
requireStatus(bible, "bible-verses", "verified");
requireStatus(sourceItems, "source-library-items", "verified");

const placeholderPattern =
  /\b(?:source pending|placeholder|replace with (?:a verified|exact))\b|\[[^\]]*pending[^\]]*\]/i;
for (const [collection, records] of [
  ["citations", citations],
  ["quran-verses", quran],
  ["bible-verses", bible],
  ["source-library-items", sourceItems],
]) {
  const placeholders = records.filter((record) =>
    placeholderPattern.test(
      `${record?.title ?? ""} ${record?.book ?? ""} ${record?.arabic ?? ""} ${record?.translation ?? ""} ${record?.text ?? ""} ${record?.note ?? ""} ${record?.notes ?? ""}`,
    ),
  );
  if (placeholders.length > 0) {
    failures.push(`${collection}: ${placeholders.length} placeholder record(s) remain`);
  }
}

const articleSlugs = articles.map((article) => article?.slug).filter(Boolean);
if (new Set(articleSlugs).size !== articleSlugs.length) {
  failures.push("articles: duplicate slugs found");
}
const citationKeys = citations
  .map((citation) => citation?.citationKey)
  .filter(Boolean);
if (new Set(citationKeys).size !== citationKeys.length) {
  failures.push("citations: duplicate citation keys found");
}

const quranReferences = quran.map((verse) => verse?.reference).filter(Boolean);
const bibleReferences = bible.map((verse) => verse?.reference).filter(Boolean);
if (new Set(quranReferences).size !== quranReferences.length) {
  failures.push("quran-verses: duplicate references found");
}
if (new Set(bibleReferences).size !== bibleReferences.length) {
  failures.push("bible-verses: duplicate references found");
}

const articleSlugSet = new Set(articleSlugs);
const quranReferenceSet = new Set(quranReferences);
const bibleReferenceSet = new Set(bibleReferences);
for (const [slug, selection] of Object.entries(keyScripture)) {
  if (!articleSlugSet.has(slug)) {
    failures.push(`article-key-scripture: selection targets missing article ${slug}`);
  }
  for (const reference of selection?.quran ?? []) {
    if (!quranReferenceSet.has(reference)) {
      failures.push(`article-key-scripture: ${slug} is missing ${reference}`);
    }
  }
  for (const reference of selection?.bible ?? []) {
    if (!bibleReferenceSet.has(reference)) {
      failures.push(`article-key-scripture: ${slug} is missing ${reference}`);
    }
  }
}

const claimIds = claims.map((claim) => claim?.id).filter(Boolean);
if (new Set(claimIds).size !== claimIds.length) {
  failures.push("claims-against-islam: duplicate ids found");
}
for (const claim of claims) {
  if (
    typeof claim?.title !== "string" ||
    typeof claim?.claim !== "string" ||
    !Array.isArray(claim?.response) ||
    claim.response.length === 0 ||
    !Array.isArray(claim?.evidence) ||
    claim.evidence.length === 0
  ) {
    failures.push(`claims-against-islam: ${claim?.id ?? "unknown"} is incomplete`);
    continue;
  }
  for (const evidence of claim.evidence) {
    try {
      const url = new URL(evidence?.href);
      if (url.protocol !== "https:" || url.username || url.password) {
        throw new Error("unsafe URL");
      }
    } catch {
      failures.push(
        `claims-against-islam: ${claim.id} has an invalid evidence URL`,
      );
    }
  }
  for (const link of claim.links ?? []) {
    const articleSlug = link?.href?.match(/^\/articles\/([^/?#]+)$/)?.[1];
    if (articleSlug && !articleSlugs.includes(articleSlug)) {
      failures.push(
        `claims-against-islam: ${claim.id} links to missing article ${articleSlug}`,
      );
    }
  }
}

if (failures.length === 0) {
  console.log(
    `Mobile content snapshot verified (${articles.length} published articles).`,
  );
  process.exit(0);
}

console.error("Mobile content snapshot is not release-ready:");
for (const failure of failures) console.error(`- ${failure}`);

if (strict || (easMode && productionBuild)) {
  console.error(
    "Production build stopped. Export a fully published and verified snapshot first.",
  );
  process.exit(1);
}

console.warn(
  "Development may continue, but this snapshot must not be submitted to an app store.",
);
