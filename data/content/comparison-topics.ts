import type { ComparisonTopic } from "@/types/domain";

// Developer warning:
// Comparison topics are structural placeholders only. Replace every field with
// sourced, reviewed content before using these objects in public article pages.
export const comparisonTopics: ComparisonTopic[] = [
  {
    title: "Comparison Topic Template",
    question:
      "What precise question is being compared, and which sources will be used?",
    quranicPerspective:
      "Placeholder. Add verified Quran references, Arabic text, translation, and translator attribution before publication.",
    biblicalPerspective:
      "Placeholder. Add verified Bible references, passage text, and version/source attribution before publication.",
    islamicResponse:
      "Placeholder. Add sourced Islamic interpretation or argument only after review.",
    christianInterpretation:
      "Placeholder. Add sourced Christian interpretation respectfully and accurately after review.",
    historicalContext:
      "Placeholder. Add historical context only from specific cited sources.",
    keyTakeaway:
      "Placeholder. Summaries must be evidence-based and must not outrun the cited material.",
    citations: [
      "source-pending-quran-translation",
      "source-pending-bible-version",
      "source-pending-academic-context",
    ],
  },
];
