/**
 * Auto-repair tool: re-fetches the canonical text for every verse the
 * verifier flagged as mismatched, and does a raw string replace of the
 * OLD (corrupted) text with the NEW (canonical) text across the whole
 * draft file — fixing both the verse-array entry AND any prose quotation
 * of the same broken text in the section bodies in one pass.
 *
 *   node payload/fix-verse-corruptions.mjs
 */
import { readFileSync, writeFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const DRAFTS_DIR = path.resolve(dirname, "../content-drafts");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchJson(url, attempt = 1) {
  const response = await fetch(url);
  if (response.status === 429 && attempt <= 3) {
    await sleep(attempt * 8000);
    return fetchJson(url, attempt + 1);
  }
  if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
  return response.json();
}

// slug -> list of { surahNumber, ayahNumber } or { book, chapter, verse }
const TARGETS = {
  "the-final-message": {
    quran: [
      { surahNumber: 33, ayahNumber: 40 },
      { surahNumber: 5, ayahNumber: 3 },
      { surahNumber: 61, ayahNumber: 6 },
      { surahNumber: 7, ayahNumber: 158 },
    ],
  },
  "what-is-revelation": {
    quran: [{ surahNumber: 42, ayahNumber: 51 }],
  },
  "what-is-sin": {
    quran: [
      { surahNumber: 4, ayahNumber: 31 },
      { surahNumber: 53, ayahNumber: 32 },
      { surahNumber: 66, ayahNumber: 8 },
    ],
  },
  "what-is-worship": {
    bible: [
      { book: "john", chapter: 4, verse: "24" },
      { book: "john", chapter: 20, verse: "28" },
      { book: "matthew", chapter: 4, verse: "10" },
    ],
  },
};

let totalFixed = 0;

for (const [slug, targets] of Object.entries(TARGETS)) {
  const filePath = path.join(DRAFTS_DIR, `${slug}.json`);
  let raw = readFileSync(filePath, "utf8");
  const draft = JSON.parse(raw);

  for (const { surahNumber, ayahNumber } of targets.quran ?? []) {
    const stored = (draft.quranVerses ?? []).find(
      (v) => v.surahNumber === surahNumber && v.ayahNumber === ayahNumber,
    );
    if (!stored) {
      console.log(`  ! ${slug}: no stored entry for ${surahNumber}:${ayahNumber}`);
      continue;
    }
    const data = await fetchJson(
      `https://api.alquran.cloud/v1/ayah/${surahNumber}:${ayahNumber}/editions/quran-uthmani,en.sahih`,
    );
    const [arabicEdition, englishEdition] = data.data;
    const canonicalArabic = arabicEdition.text;
    const canonicalTranslation = englishEdition.text;

    if (stored.arabic !== canonicalArabic && raw.includes(stored.arabic)) {
      raw = raw.split(stored.arabic).join(canonicalArabic);
      console.log(`  fixed Arabic ${slug} ${surahNumber}:${ayahNumber}`);
      totalFixed += 1;
    }
    if (stored.translation !== canonicalTranslation && raw.includes(stored.translation)) {
      raw = raw.split(stored.translation).join(canonicalTranslation);
      console.log(`  fixed translation ${slug} ${surahNumber}:${ayahNumber}`);
      totalFixed += 1;
    }
    await sleep(350);
  }

  for (const { book, chapter, verse } of targets.bible ?? []) {
    const stored = (draft.bibleVerses ?? []).find(
      (v) =>
        String(v.book).toLowerCase() === book &&
        v.chapter === chapter &&
        String(v.verse) === String(verse),
    );
    if (!stored) {
      console.log(`  ! ${slug}: no stored entry for ${book} ${chapter}:${verse}`);
      continue;
    }
    const data = await fetchJson(
      `https://bible-api.com/${book}+${chapter}:${verse}?translation=web`,
    );
    const canonicalText = data.text.replace(/\s+/g, " ").trim();
    const normalizedStored = stored.text.replace(/\s+/g, " ").trim();

    if (normalizedStored !== canonicalText) {
      if (raw.includes(stored.text)) {
        raw = raw.split(stored.text).join(canonicalText);
        console.log(`  fixed Bible text ${slug} ${book} ${chapter}:${verse}`);
        totalFixed += 1;
      } else {
        console.log(
          `  ! ${slug}: stored text for ${book} ${chapter}:${verse} not found verbatim in file (may already differ in prose) — patching verse array only`,
        );
        raw = raw.replace(
          JSON.stringify(stored.text),
          JSON.stringify(canonicalText),
        );
        totalFixed += 1;
      }
    }
    await sleep(1500);
  }

  writeFileSync(filePath, raw);
}

console.log(`\nTotal fixes applied: ${totalFixed}`);
