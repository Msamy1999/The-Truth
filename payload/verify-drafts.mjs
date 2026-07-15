/**
 * Mechanical draft verifier: re-fetches every Quran verse (api.alquran.cloud)
 * and Bible verse (bible-api.com) referenced by content-drafts/*.json and
 * diffs the stored text against the canonical source. Requests are cached,
 * paced, and retried to respect rate limits. Arabic comparison is
 * Unicode-normalized.
 *
 *   node payload/verify-drafts.mjs
 */
import { readdirSync, readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const DRAFTS_DIR = path.resolve(dirname, "../content-drafts");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** NFC-normalize, strip zero-width/directional marks, collapse whitespace. */
const normalize = (text) =>
  String(text ?? "")
    .normalize("NFC")
    .replace(/[\u200B-\u200F\u202A-\u202E\uFEFF\u00A0]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const problems = [];
let quranChecked = 0;
let bibleChecked = 0;
const quranCache = new Map();
const bibleCache = new Map();

async function fetchJson(url) {
  for (let attempt = 1; attempt <= 5; attempt += 1) {
    let response;
    try {
      response = await fetch(url);
    } catch (error) {
      if (attempt === 5) throw error;
      const wait = attempt * 4000;
      console.log(`  network error — retrying in ${wait / 1000}s: ${url}`);
      await sleep(wait);
      continue;
    }

    if (response.ok) return response.json();
    if (response.status !== 429 && response.status < 500) {
      throw new Error(`HTTP ${response.status}`);
    }
    if (attempt === 5) throw new Error(`HTTP ${response.status}`);

    const wait = attempt * 8000;
    console.log(`  HTTP ${response.status} — backing off ${wait / 1000}s: ${url}`);
    await sleep(wait);
  }

  throw new Error("unreachable retry state");
}

function diffPoint(a, b) {
  const max = Math.min(a.length, b.length);
  for (let i = 0; i < max; i++) {
    if (a[i] !== b[i]) {
      return `at ${i}: stored U+${a.codePointAt(i).toString(16)} vs canonical U+${b.codePointAt(i).toString(16)} | stored "…${a.slice(Math.max(0, i - 12), i + 12)}…" vs "…${b.slice(Math.max(0, i - 12), i + 12)}…"`;
    }
  }
  return `length differs: stored ${a.length} vs canonical ${b.length}`;
}

// "Source Pending" is also a legitimate editorial status discussed by one
// article, so only explicit bracketed placeholder markers are rejected.
const MARKERS =
  /(TODO|PLACEHOLDER|\[Add |lorem ipsum|\[\s*p\.\s*\d+\s*\]|\[(?:source[ -]?pending|citation pending|verified[^\]]*pending)\]|citation needed)/i;

for (const file of readdirSync(DRAFTS_DIR).filter((name) => name.endsWith(".json"))) {
  const draft = JSON.parse(readFileSync(path.join(DRAFTS_DIR, file), "utf8"));
  console.log(`\n=== ${draft.slug} ===`);

  for (const verse of draft.quranVerses ?? []) {
    try {
      const cacheKey = `${verse.surahNumber}:${verse.ayahNumber}`;
      let data = quranCache.get(cacheKey);
      if (!data) {
        data = await fetchJson(
          `https://api.alquran.cloud/v1/ayah/${cacheKey}/editions/quran-uthmani,en.sahih`,
        );
        quranCache.set(cacheKey, data);
        await sleep(350);
      }

      const [arabicEdition, englishEdition] = data.data;
      quranChecked += 1;
      const storedArabic = normalize(verse.arabic);
      const canonicalArabic = normalize(arabicEdition.text);
      if (storedArabic !== canonicalArabic) {
        problems.push(
          `${draft.slug}: ARABIC MISMATCH ${verse.reference} — ${diffPoint(storedArabic, canonicalArabic)}`,
        );
      }
      if (normalize(englishEdition.text) !== normalize(verse.translation)) {
        problems.push(`${draft.slug}: TRANSLATION MISMATCH ${verse.reference}`);
      }
    } catch (error) {
      problems.push(
        `${draft.slug}: QURAN FETCH FAILED ${verse.reference}: ${error.message}`,
      );
    }
  }

  for (const verse of draft.bibleVerses ?? []) {
    try {
      const bookForUrl = String(verse.book).toLowerCase().replace(/\s+/g, "+");
      const cacheKey = `${bookForUrl}+${verse.chapter}:${verse.verse}`;
      let data = bibleCache.get(cacheKey);
      if (!data) {
        data = await fetchJson(
          `https://bible-api.com/${cacheKey}?translation=web`,
        );
        bibleCache.set(cacheKey, data);
        await sleep(1500);
      }

      bibleChecked += 1;
      if (normalize(data.text) !== normalize(verse.text)) {
        problems.push(`${draft.slug}: BIBLE MISMATCH ${verse.reference}`);
      }
    } catch (error) {
      problems.push(
        `${draft.slug}: BIBLE FETCH FAILED ${verse.reference}: ${error.message}`,
      );
    }
  }

  const marker = JSON.stringify(draft).match(MARKERS);
  if (marker) {
    problems.push(`${draft.slug}: MARKER FOUND: "${marker[0]}"`);
  }
}

console.log("\n===== RESULT =====");
console.log(`quran verses checked: ${quranChecked}`);
console.log(`bible verses checked: ${bibleChecked}`);
if (problems.length > 0) {
  console.log(`PROBLEMS (${problems.length}):`);
  for (const problem of problems) console.log(" -", problem);
  process.exit(1);
}
console.log("ALL CLEAN — scripture matches canonical sources, no markers.");
