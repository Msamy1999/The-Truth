/* global console */

import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";

const draftsDir = path.join(process.cwd(), "content-drafts");
const selectionPath = path.join(process.cwd(), "data", "article-key-scripture.json");
const selections = JSON.parse(readFileSync(selectionPath, "utf8"));
const failures = [];
let referencesChecked = 0;
let selectedReferencesChecked = 0;

const referencePattern = /\bQur(?:an|['’]an)\s+(\d{1,3}):(\d{1,3})(?:\s*[-–]\s*(\d{1,3}))?/gi;
const quranContextPattern = /\b(?:Qur(?:an|['’]an)|Surah)\b/i;
const verseNumberPattern = /\b(\d{1,3}):(\d{1,3})\b/g;
const bibleBookBeforeReference = /(?:Genesis|Exodus|Leviticus|Numbers|Deuteronomy|Joshua|Judges|Ruth|Samuel|Kings|Chronicles|Ezra|Nehemiah|Esther|Job|Psalms?|Proverbs|Ecclesiastes|Isaiah|Jeremiah|Lamentations|Ezekiel|Daniel|Hosea|Joel|Amos|Obadiah|Jonah|Micah|Nahum|Habakkuk|Zephaniah|Haggai|Zechariah|Malachi|Matthew|Mark|Luke|John|Acts|Romans|Corinthians|Galatians|Ephesians|Philippians|Colossians|Thessalonians|Timothy|Titus|Philemon|Hebrews|James|Peter|Jude|Revelation)\s*$/i;

function quranReferencesInProse(text) {
  const references = new Set();
  const segments = text.split(/(?<=[.!?])\s+|\n+/);

  for (const segment of segments) {
    if (!quranContextPattern.test(segment)) continue;
    for (const match of segment.matchAll(verseNumberPattern)) {
      const prefix = segment.slice(Math.max(0, match.index - 28), match.index);
      if (bibleBookBeforeReference.test(prefix)) continue;
      references.add(`Quran ${Number(match[1])}:${Number(match[2])}`);
    }
  }

  return references;
}

for (const filename of readdirSync(draftsDir).filter((name) => name.endsWith(".json"))) {
  const draft = JSON.parse(readFileSync(path.join(draftsDir, filename), "utf8"));
  const available = new Set(
    (draft.quranVerses ?? []).map(
      (verse) => `Quran ${verse.surahNumber}:${verse.ayahNumber}`,
    ),
  );
  const publicText = [
    draft.title,
    draft.subtitle,
    draft.summary,
    ...(draft.sections ?? []).flatMap((section) => [section.title, section.body]),
    ...(draft.faq ?? []).flatMap((item) => [item.question, item.answer]),
  ]
    .filter(Boolean)
    .join("\n");

  for (const match of publicText.matchAll(referencePattern)) {
    referencesChecked += 1;
    const openingReference = `Quran ${Number(match[1])}:${Number(match[2])}`;
    if (!available.has(openingReference)) {
      failures.push(
        `${draft.slug}: ${match[0]} is cited without stored Arabic and English text for ${openingReference}`,
      );
    }
    if (
      Object.hasOwn(selections, draft.slug) &&
      !(selections[draft.slug]?.quran ?? []).includes(openingReference)
    ) {
      failures.push(`${draft.slug}: ${openingReference} is cited but is not selected for display`);
    } else if (Object.hasOwn(selections, draft.slug)) {
      selectedReferencesChecked += 1;
    }
  }

  for (const reference of quranReferencesInProse(publicText)) {
    referencesChecked += 1;
    if (!available.has(reference)) {
      failures.push(
        `${draft.slug}: Quran-context citation is missing stored Arabic and English text for ${reference}`,
      );
    }
    if (
      Object.hasOwn(selections, draft.slug) &&
      !(selections[draft.slug]?.quran ?? []).includes(reference)
    ) {
      failures.push(`${draft.slug}: ${reference} is cited in Quran context but is not selected for display`);
    } else if (Object.hasOwn(selections, draft.slug)) {
      selectedReferencesChecked += 1;
    }
  }

  for (const reference of selections[draft.slug]?.quran ?? []) {
    if (!available.has(reference)) {
      failures.push(`${draft.slug}: selected key passage is missing: ${reference}`);
    }
  }
}

if (failures.length > 0) {
  console.error("Quran passage coverage failed:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(
  `Quran passage coverage verified for ${referencesChecked} citations; ${selectedReferencesChecked} display selections checked.`,
);
