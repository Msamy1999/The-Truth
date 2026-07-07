/**
 * Mechanical draft verifier: re-fetches every Quran verse (api.alquran.cloud)
 * and Bible verse (bible-api.com) referenced by content-drafts/*.json and
 * diffs the stored text against the canonical source. Paced + retrying to
 * respect rate limits; Unicode-normalized comparison for Arabic.
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
    .replace(/[​-‏‪-‮﻿⁠]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const problems = [];
let quranChecked = 0;
let bibleChecked = 0;

async function fetchJson(url, attempt = 1) {
  const response = await fetch(url);
  if (response.status === 429 && attempt <= 3) {
    const wait = attempt * 8000;
    console.log(`  429 — backing off ${wait / 1000}s: ${url}`);
    await sleep(wait);
    return fetchJson(url, attempt + 1);
  }
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
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

const MARKERS =
  /(TODO|PLACEHOLDER|\[Add |lorem ipsum|\bp\.\s*\d+|source pending|citation needed)/i;

for (const file of readdirSync(DRAFTS_DIR).filter((f) => f.endsWith(".json"))) {
  const draft = JSON.parse(readFileSync(path.join(DRAFTS_DIR, file), "utf8"));
  console.log(`\n=== ${draft.slug} ===`);

  for (const verse of draft.quranVerses ?? []) {
    try {
      const data = await fetchJson(
        `https://api.alquran.cloud/v1/ayah/${verse.surahNumber}:${verse.ayahNumber}/editions/quran-uthmani,en.sahih`,
      );
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
      await sleep(350);
    } catch (error) {
      problems.push(
        `${draft.slug}: QURAN FETCH FAILED ${verse.reference}: ${error.message}`,
      );
    }
  }

  for (const verse of draft.bibleVerses ?? []) {
    try {
      const bookForUrl = String(verse.book).toLowerCase().replace(/\s+/g, "+");
      const data = await fetchJson(
        `https://bible-api.com/${bookForUrl}+${verse.chapter}:${verse.verse}?translation=web`,
      );
      bibleChecked += 1;

      if (normalize(data.text) !== normalize(verse.text)) {
        problems.push(`${draft.slug}: BIBLE MISMATCH ${verse.reference}`);
      }
      await sleep(1500);
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

console.log(`\n===== RESULT =====`);
console.log(`quran verses checked: ${quranChecked}`);
console.log(`bible verses checked: ${bibleChecked}`);
if (problems.length > 0) {
  console.log(`PROBLEMS (${problems.length}):`);
  for (const problem of problems) console.log(" -", problem);
  process.exit(1);
}
console.log("ALL CLEAN — scripture matches canonical sources, no markers.");
