/**
 * Generic auto-repair: re-fetches canonical text for EVERY quranVerses/
 * bibleVerses entry in EVERY content-drafts/*.json file, and if the stored
 * text doesn't match, patches both the verse-array entry and any prose
 * quotation of the same text via raw string replace. Unlike
 * fix-verse-corruptions.mjs (which needs a manually curated TARGETS list),
 * this sweeps everything — meant for large batches where too many verses
 * are affected to hand-curate.
 *
 *   node payload/auto-fix-all-verses.mjs
 */
import { readdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const DRAFTS_DIR = path.resolve(dirname, "../content-drafts");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const normalize = (text) =>
  String(text ?? "")
    .normalize("NFC")
    .replace(/[​-‏‪-‮﻿⁠]/g, "")
    .replace(/\s+/g, " ")
    .trim();

async function fetchJson(url, attempt = 1) {
  const response = await fetch(url);
  if (response.status === 429 && attempt <= 3) {
    const wait = attempt * 8000;
    console.log(`  429 — backing off ${wait / 1000}s: ${url}`);
    await sleep(wait);
    return fetchJson(url, attempt + 1);
  }
  if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
  return response.json();
}

let totalFixed = 0;
let totalUnresolved = 0;

const files = readdirSync(DRAFTS_DIR).filter((f) => f.endsWith(".json"));

for (const file of files) {
  const filePath = path.join(DRAFTS_DIR, file);
  let raw = readFileSync(filePath, "utf8");
  const draft = JSON.parse(raw);
  let fileChanged = false;
  let fileFixCount = 0;

  // Substitute using JSON-escaped forms on BOTH sides so the result is
  // always valid JSON, even when the canonical replacement text itself
  // contains characters (quotes, backslashes) that need escaping.
  const jsonInner = (s) => JSON.stringify(s).slice(1, -1);
  function applyFix(oldValue, newValue, label) {
    const oldEscaped = jsonInner(oldValue);
    const newEscaped = jsonInner(newValue);
    if (oldEscaped === newEscaped) return false;
    if (raw.includes(oldEscaped)) {
      raw = raw.split(oldEscaped).join(newEscaped);
      return true;
    }
    console.log(`  ! ${draft.slug}: mismatch detected for ${label} but exact stored text not found in file (may be quoted differently in prose) — NOT fixed`);
    return false;
  }

  for (const verse of draft.quranVerses ?? []) {
    try {
      const data = await fetchJson(
        `https://api.alquran.cloud/v1/ayah/${verse.surahNumber}:${verse.ayahNumber}/editions/quran-uthmani,en.sahih`,
      );
      const [arabicEdition, englishEdition] = data.data;
      const canonicalArabic = arabicEdition.text;
      const canonicalTranslation = englishEdition.text;

      if (normalize(verse.arabic) !== normalize(canonicalArabic) && applyFix(verse.arabic, canonicalArabic, `${verse.reference} arabic`)) {
        fileChanged = true;
        fileFixCount += 1;
      }
      if (normalize(verse.translation) !== normalize(canonicalTranslation) && applyFix(verse.translation, canonicalTranslation, `${verse.reference} translation`)) {
        fileChanged = true;
        fileFixCount += 1;
      }
      await sleep(350);
    } catch (error) {
      console.log(`  ! ${draft.slug}: Quran fetch failed ${verse.reference}: ${error.message}`);
      totalUnresolved += 1;
    }
  }

  for (const verse of draft.bibleVerses ?? []) {
    try {
      const bookForUrl = String(verse.book).toLowerCase().replace(/\s+/g, "+");
      const data = await fetchJson(
        `https://bible-api.com/${bookForUrl}+${verse.chapter}:${verse.verse}?translation=web`,
      );
      const canonicalText = data.text.replace(/\s+/g, " ").trim();

      if (normalize(verse.text) !== normalize(canonicalText) && applyFix(verse.text, canonicalText, `${verse.reference} text`)) {
        fileChanged = true;
        fileFixCount += 1;
      }
      await sleep(1500);
    } catch (error) {
      console.log(`  ! ${draft.slug}: Bible fetch failed ${verse.reference}: ${error.message}`);
      totalUnresolved += 1;
    }
  }

  if (fileChanged) {
    // re-validate JSON before writing to avoid corrupting the file
    try {
      JSON.parse(raw);
      writeFileSync(filePath, raw);
      console.log(`fixed ${file}: ${fileFixCount} field(s)`);
      totalFixed += fileFixCount;
    } catch (error) {
      console.log(`  ! ${file}: raw patch produced INVALID JSON, skipped write (${error.message})`);
      totalUnresolved += fileFixCount;
    }
  }
}

console.log(`\nTotal fields fixed: ${totalFixed}`);
console.log(`Total unresolved (fetch failures / invalid-JSON skips): ${totalUnresolved}`);
