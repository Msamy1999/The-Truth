/**
 * Verifies every Qur'an quotation in content-drafts against a complete
 * Uthmani text export. It covers both structured quranVerses records and
 * Arabic ayat embedded directly in article bodies.
 *
 * Usage:
 *   node payload/verify-quran-uthmani.mjs <path-to-quran-uthmani.json>
 *
 * The input is the `quran-uthmani` edition JSON from api.alquran.cloud.
 * Keeping the reference text outside the repository avoids committing a
 * second, unauthoritative copy of the Qur'an while making the check fully
 * repeatable from a verified download.
 */
import { readdirSync, readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const draftsDir = path.resolve(dirname, "../content-drafts");
const sourcePath = process.argv[2];

if (!sourcePath) {
  throw new Error(
    "Usage: node payload/verify-quran-uthmani.mjs <path-to-quran-uthmani.json>",
  );
}

const source = JSON.parse(readFileSync(sourcePath, "utf8"));
const surahs = source?.data?.surahs;
if (!Array.isArray(surahs) || surahs.length !== 114) {
  throw new Error("The source file does not contain the expected 114 surahs.");
}

/** NFC makes equivalent Arabic combining-mark orders compare identically. */
function normalize(text) {
  return String(text ?? "")
    .normalize("NFC")
    .replace(/[\u200B-\u200F\u202A-\u202E\uFEFF\u00A0]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Removes layout and ornamental characters for safe partial-ayah matching. */
function compactArabic(text) {
  return normalize(text)
    .replace(/[۞۩۝]/g, "")
    .replace(/[\s\u060C\u061B\u061F\u06D4\u06DD]/g, "");
}

function isArabicOnly(text) {
  return /^[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\u200C\u200D\s]+$/u.test(
    text,
  );
}

function arabicLetterCount(text) {
  return (text.match(/[\u0621-\u064A\u066E-\u06D3\u06FA-\u06FC]/gu) ?? [])
    .length;
}

function quranReferences(text) {
  return [...text.matchAll(/\bQur(?:an|['’]an)\s+(\d{1,3}):(\d{1,3})(?:\s*[-–]\s*(\d{1,3}))?/gi)].map(
    (match) => ({
      surah: Number(match[1]),
      firstAyah: Number(match[2]),
      lastAyah: match[3] ? Number(match[3]) : Number(match[2]),
    }),
  );
}

// This mirrors quranReferenceNearLine() in lib/quran.ts. Keep the audit tied
// to the reader's lookup order so a source-verified quote cannot render with
// the wrong label.
function quranReferenceForLabel(lines, lineIndex) {
  for (const index of [lineIndex + 1, lineIndex + 2, lineIndex, lineIndex - 1, lineIndex - 2]) {
    if (index < 0 || index >= lines.length) continue;
    const reference = quranReferences(lines[index])[0];
    if (reference) return reference;
  }
  return undefined;
}

function arabicQuoteSegments(text) {
  return [...text.matchAll(/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\u200C\u200D\s]+/gu)]
    .map((match) => ({
      text: match[0],
      start: match.index ?? 0,
      end: (match.index ?? 0) + match[0].length,
    }))
    .filter((segment) => arabicLetterCount(segment.text) >= 8);
}

function quranReferenceForInlineQuote(lines, lineIndex, segment) {
  const references = [...lines[lineIndex].matchAll(/\bQur(?:an|['’]an)\s+(\d{1,3}):(\d{1,3})(?:\s*[-–]\s*(\d{1,3}))?/gi)].map(
    (match) => ({
      reference: {
        surah: Number(match[1]),
        firstAyah: Number(match[2]),
        lastAyah: match[3] ? Number(match[3]) : Number(match[2]),
      },
      start: match.index ?? 0,
      end: (match.index ?? 0) + match[0].length,
    }),
  );

  if (references.length > 0) {
    const beforeQuote = lines[lineIndex].slice(0, segment.start);
    const followingReference = references.find(
      (reference) => reference.start >= segment.end,
    );
    if (
      followingReference &&
      /(?:(?:the next verse|next verse)[^.\n]{0,100}|followed by[^.\n]{0,50}|then continues[^.\n]{0,50}|first (?:two )?occurrences? read[^.\n]{0,50})$/i.test(
        beforeQuote,
      )
    ) {
      return followingReference.reference;
    }

    return [...references].sort(
      (left, right) =>
        Math.min(Math.abs(left.start - segment.end), Math.abs(left.end - segment.start)) -
        Math.min(Math.abs(right.start - segment.end), Math.abs(right.end - segment.start)),
    )[0].reference;
  }

  return quranReferenceForLabel(lines, lineIndex);
}

function referenceContains(reference, ayahReference) {
  const [surah, ayah] = ayahReference.split(":").map(Number);
  return (
    reference.surah === surah &&
    ayah >= reference.firstAyah &&
    ayah <= reference.lastAyah
  );
}

const canonicalByReference = new Map();
const exactReferenceByText = new Map();
const compactCanonical = [];

for (const surah of surahs) {
  for (const ayah of surah.ayahs ?? []) {
    const reference = `${surah.number}:${ayah.numberInSurah}`;
    const text = normalize(ayah.text);
    canonicalByReference.set(reference, text);
    exactReferenceByText.set(text, [
      ...(exactReferenceByText.get(text) ?? []),
      reference,
    ]);
    compactCanonical.push({ reference, text: compactArabic(text) });
  }
}

const problems = [];
let structuredCount = 0;
let bodyQuoteCount = 0;
const files = readdirSync(draftsDir).filter((file) => file.endsWith(".json"));

for (const file of files) {
  const draft = JSON.parse(readFileSync(path.join(draftsDir, file), "utf8"));
  const label = draft.slug || file;

  for (const verse of draft.quranVerses ?? []) {
    structuredCount += 1;
    const reference = `${verse.surahNumber}:${verse.ayahNumber}`;
    const expected = canonicalByReference.get(reference);
    const displayedReference = `Quran ${reference}`;

    if (!expected) {
      problems.push(`${label}: invalid Qur'an reference ${displayedReference}`);
      continue;
    }
    if (verse.reference !== displayedReference) {
      problems.push(
        `${label}: reference field ${JSON.stringify(verse.reference)} does not match ${displayedReference}`,
      );
    }
    if (normalize(verse.arabic) !== expected) {
      problems.push(`${label}: Arabic text differs from Uthmani source at ${displayedReference}`);
    }
  }

  for (const section of draft.sections ?? []) {
    const lines = String(section.body ?? "").split(/\r?\n/);

    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index].trim();
      if (!line || !isArabicOnly(line) || arabicLetterCount(line) < 8) continue;

      const normalizedLine = normalize(line);
      const exactReferences = exactReferenceByText.get(normalizedLine) ?? [];
      const nearbyReferences = quranReferences(
        lines.slice(Math.max(0, index - 2), Math.min(lines.length, index + 3)).join(" "),
      );
      const compactLine = compactArabic(line);
      const partialMatches = compactCanonical.filter(
        (candidate) =>
          compactLine.length >= 12 &&
          (candidate.text.includes(compactLine) || compactLine.includes(candidate.text)),
      );
      const related =
        exactReferences.find((candidate) =>
          nearbyReferences.some((reference) => referenceContains(reference, candidate)),
        ) ??
        exactReferences[0] ??
        partialMatches.find((candidate) =>
          nearbyReferences.some(
            (reference) =>
              candidate.reference === `${reference.surah}:${reference.firstAyah}` ||
              (candidate.reference.startsWith(`${reference.surah}:`) &&
                Number(candidate.reference.split(":")[1]) >= reference.firstAyah &&
                Number(candidate.reference.split(":")[1]) <= reference.lastAyah),
          ),
        )?.reference;

      // Arabic theological terms in prose are not quotations. A likely quote
      // either exactly/partially matches an ayah or sits next to a Qur'an ref.
      if (!related && nearbyReferences.length === 0) continue;

      bodyQuoteCount += 1;
      if (!related) {
        problems.push(
          `${label}: unverified Arabic quotation in ${section.sectionId || "section"}, line ${index + 1}`,
        );
        continue;
      }

      const readerReference = quranReferenceForLabel(lines, index);
      if (!readerReference) {
        problems.push(
          `${label}: reader cannot derive a Qur'an label in ${section.sectionId || "section"}, line ${index + 1}`,
        );
      } else if (!referenceContains(readerReference, related)) {
        problems.push(
          `${label}: reader would label Quran ${related} with the wrong nearby reference`,
        );
      }

      const expected = canonicalByReference.get(related);
      if (exactReferences.length > 0 && normalizedLine !== expected) {
        problems.push(
          `${label}: body quotation differs from Uthmani source at Quran ${related}`,
        );
      }
      if (
        nearbyReferences.length > 0 &&
        !nearbyReferences.some(
          (reference) =>
            related === `${reference.surah}:${reference.firstAyah}` ||
            (related.startsWith(`${reference.surah}:`) &&
              Number(related.split(":")[1]) >= reference.firstAyah &&
              Number(related.split(":")[1]) <= reference.lastAyah),
        )
      ) {
        problems.push(
          `${label}: body quotation maps to Quran ${related}, not its nearby reference`,
        );
      }
    }

    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index].trim();
      if (!line || isArabicOnly(line)) continue;

      for (const segment of arabicQuoteSegments(line)) {
        const normalizedSegment = normalize(segment.text);
        const exactReferences = exactReferenceByText.get(normalizedSegment) ?? [];
        const compactSegment = compactArabic(segment.text);
        const readerReference = quranReferenceForInlineQuote(lines, index, segment);
        const related =
          exactReferences.find((candidate) =>
            readerReference ? referenceContains(readerReference, candidate) : false,
          ) ??
          exactReferences[0] ??
          compactCanonical.find(
            (candidate) =>
              compactSegment.length >= 12 &&
              (candidate.text.includes(compactSegment) || compactSegment.includes(candidate.text)),
          )?.reference;

        // Arabic terms and names embedded in prose are not ayat.
        if (!related) continue;

        bodyQuoteCount += 1;
        if (!readerReference) {
          problems.push(
            `${label}: reader cannot derive an inline Qur'an label in ${section.sectionId || "section"}, line ${index + 1}`,
          );
        } else if (!referenceContains(readerReference, related)) {
          problems.push(
            `${label}: reader would label inline Quran ${related} with the wrong reference`,
          );
        }
      }
    }
  }
}

console.log(`drafts checked: ${files.length}`);
console.log(`structured Qur'an verses checked: ${structuredCount}`);
console.log(`Arabic body quotations checked: ${bodyQuoteCount}`);

if (problems.length > 0) {
  console.error(`PROBLEMS (${problems.length}):`);
  for (const problem of problems) console.error(` - ${problem}`);
  process.exit(1);
}

console.log("ALL QUR'AN TEXT MATCHES THE UTHMANI SOURCE");
