import type { BibleVerse, QuranVerse } from "@/types/domain";

// Developer warning:
// Do not publish scripture content from this file until the original text,
// translation, reference, and source attribution have been manually verified.
// The placeholder strings below are intentionally not scripture.
export const quranVerses: QuranVerse[] = [
  {
    surahName: "Source pending",
    surahNumber: 0,
    ayahNumber: 0,
    arabic: "[VERIFIED ARABIC QURAN TEXT PENDING]",
    translation: "[Verified English Quran translation pending.]",
    translator: "Source pending",
    reference: "Quran reference pending",
    notes:
      "Draft placeholder. Replace with exact Arabic, translation, surah, ayah, and translator attribution before use.",
  },
];

export const bibleVerses: BibleVerse[] = [
  {
    book: "Source pending",
    chapter: 0,
    verse: 0,
    text: "[Verified Bible verse text pending.]",
    version: "Source pending",
    reference: "Bible reference pending",
    notes:
      "Draft placeholder. Replace with exact book, chapter, verse, version, and source attribution before use.",
  },
];
