import type { Citation } from "@/types/domain";

// Developer warning:
// These are placeholder citation records only. Do not treat them as real sources,
// and do not publish articles that depend on them until exact references are
// verified and replaced with real bibliographic data.
export const citations: Citation[] = [
  {
    id: "source-pending-quran-translation",
    type: "quran",
    title: "Source pending: verified Quran Arabic text and English translation",
    note:
      "Placeholder only. Replace with a verified Quran text source and named translator before publication.",
  },
  {
    id: "source-pending-bible-version",
    type: "bible",
    title: "Source pending: verified Bible passage and version",
    note:
      "Placeholder only. Replace with the exact Bible version, publisher/source, and passage reference before publication.",
  },
  {
    id: "source-pending-academic-context",
    type: "academic",
    title: "Source pending: historical or academic context",
    note:
      "Placeholder only. Replace with a specific academic source before making historical claims.",
  },
  {
    id: "citation-needed-general",
    type: "other",
    title: "Citation needed",
    note:
      "Use this marker only for draft material that must not be published until a real source is attached.",
  },
];
