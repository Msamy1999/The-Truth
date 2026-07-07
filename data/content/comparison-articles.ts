import type { ComparisonArticle } from "@/types/domain";

// Developer warning:
// These are draft comparison templates only. The verse text and source fields
// intentionally use placeholders so no scripture, citation, or scholarly claim
// is accidentally presented as verified content.
export const comparisonArticles: ComparisonArticle[] = [
  {
    slug: "was-the-quran-preserved",
    mainQuestion:
      "What sources and definitions are needed before studying Quran preservation?",
    beginnerSummary:
      "Draft placeholder. A finished article should define preservation, identify the evidence being discussed, separate manuscript context from argument, and cite every source.",
    quranicPerspective:
      "Placeholder for verified Quranic material relevant to preservation. Add exact Arabic, translation, reference, and translator attribution before publication.",
    biblicalPerspective:
      "Placeholder for comparison material from Bible studies only if directly relevant and verified with exact version/source data.",
    historicalContext:
      "Placeholder for manuscript and transmission context. Add specific historical sources before making any claims.",
    christianInterpretation:
      "Placeholder for cited Christian or biblical-studies perspectives where relevant. Represent sources accurately and respectfully.",
    islamicResponse:
      "Placeholder for sourced Islamic response. Add claims only after source review.",
    keyDifferences: [
      "Placeholder: define preservation before comparing traditions or evidence.",
      "Placeholder: identify whether a point is textual, historical, theological, or interpretive.",
      "Placeholder: keep source status visible until all references are verified.",
    ],
    commonObjections: [
      {
        objection: "Placeholder question about manuscript evidence.",
        response:
          "Placeholder response. Future content must identify exact manuscripts, dates, and sources before drawing conclusions.",
      },
      {
        objection: "Placeholder question about translation and original language.",
        response:
          "Placeholder response. Future content should separate original-language evidence from translation notes.",
      },
    ],
    respectfulConclusion:
      "Draft placeholder. A finished conclusion should summarize the verified evidence without overstating what the sources prove.",
    quranVerses: [
      {
        scripture: "quran",
        surahName: "Source pending",
        surahNumber: 0,
        ayahNumber: 0,
        arabic: "[VERIFIED ARABIC QURAN TEXT PENDING]",
        translation: "[Verified English Quran translation pending.]",
        translator: "Source pending",
        reference: "Quran reference pending",
        notes:
          "This placeholder demonstrates layout only. Replace before publication.",
      },
    ],
    bibleVerses: [
      {
        scripture: "bible",
        book: "Source pending",
        chapter: 0,
        verse: 0,
        text: "[Verified Bible verse text pending.]",
        version: "Source pending",
        reference: "Bible reference pending",
        notes:
          "This placeholder demonstrates layout only. Replace before publication.",
      },
    ],
    sources: [
      "source-pending-quran-translation",
      "source-pending-bible-version",
      "source-pending-academic-context",
      "citation-needed-general",
    ],
    relatedTopics: [
      "Preservation of Scripture",
      "Source Library",
      "Historical Evidence",
    ],
  },
];
