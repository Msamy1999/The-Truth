/**
 * Canonical destinations for article slugs consolidated into broader studies.
 *
 * This module intentionally has no Payload or React dependencies so the same
 * mapping can be used by Next.js before rendering and by content navigation.
 */
export const articleRedirects: Readonly<Record<string, string>> = {
  "can-god-become-man": "incarnation-explained",
  "chronological-alignment-quranic-biblical-timelines":
    "historical-support-for-biblical-narratives",
  "did-anyone-see-god": "who-is-god-quran-and-bible-comparison",
  "female-scholars-and-leaders": "women-in-the-quran-and-bible",
  "judgment-day": "the-day-of-judgment",
  "source-status-labels": "how-to-read-comparisons",
  "strong-vs-debated-scientific-claims":
    "how-to-approach-scientific-claims-carefully",
  "the-death-of-judas": "contradictions-in-the-bible",
  "the-timing-of-the-crucifixion": "contradictions-in-the-bible",
  "genealogies-of-jesus": "contradictions-in-the-bible",
  "why-preservation-matters": "how-was-the-quran-preserved",
  "worshiping-god-alone": "what-is-worship",
};
