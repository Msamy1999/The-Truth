/** Removes internal workflow language from public-facing category descriptions. */
export function readerDescription(value: string) {
  const cleaned = value
    .replace(/^(?:A\s+)?(?:draft|planned|future)\s+/i, "")
    .replace(
      /\b(?:draft|planned|future)\s+(?=(?:study|article|topic|framework|comparison|beginner|careful|Christian-facing|historical|Islamic|bridge|collection|guide|reflection|outline|path|section))/gi,
      "",
    )
    .replace(/\bsource[- ]status\b/gi, "sources")
    .replace(/\bsource[- ]conscious\b/gi, "evidence-based")
    .replace(/\bsource[- ]aware\b/gi, "evidence-based")
    .replace(/\bsource[- ]pending\b/gi, "")
    .replace(/\bsource placeholders?\b/gi, "sources")
    .replace(/\bscripture placeholders?\b/gi, "scripture references")
    .replace(/\bplaceholders?\b/gi, "details")
    .replace(/\s+kept visible\b/gi, "")
    .replace(/\s+until sourced content is ready\b/gi, "")
    .replace(/\bwill live here\b/gi, "are gathered here")
    .replace(/\s+Add [^.]+ before publishing claims\.?$/i, "")
    .replace(/\s+/g, " ")
    .trim();

  return cleaned.replace(/^([a-z])/, (_, first) => first.toUpperCase());
}

/**
 * Removes legacy creator-facing prose from article fields without changing
 * scripture records. Keep this at the content boundary so reader surfaces use
 * consistent public wording.
 */
export function cleanEditorialText(value: string): string {
  const cleaned = value
    .replace(
      /\bWhat This Page Does(?:—|–|--|-)\s*and Does Not(?:—|–|--|-)?\s*Call a Contradiction\b/gi,
      "What Counts—and Does Not Count—as a Contradiction",
    )
    .replace(
      /\bThis page does not call manuscript additions or wording variants contradictions\.?/gi,
      "Manuscript additions and wording variants are not counted as contradictions.",
    )
    .replace(/\bThis library flags such matters honestly\b/gi, "Such matters are flagged honestly")
    .replace(/\bFollowing this library(?:'s|’s) method\b/gi, "Using these distinctions")
    .replace(/\bsource-aware\b/gi, "well-supported")
    .replace(/\bsource awareness\b/gi, "careful support")
    .replace(/\bHow This Library Labels Its Sources\b/gi, "How Sources Are Labeled")
    .replace(/\bHow to Use This Library\b/gi, "How to Use These Sources")
    .replace(/\bthis library(?:'s|’s)\s+preservation-branch articles\b/gi, "the preservation evidence")
    .replace(/\bthis library(?:'s|’s)\s+companion articles?\b/gi, "the related discussions")
    .replace(/\bthis article(?:'s|’s)\b/gi, "the discussion's")
    .replace(/\bthis library(?:'s|’s)\b/gi, "the discussion's")
    .replace(/\bthe library(?:'s|’s)\b/gi, "the discussion's")
    .replace(/\bthis site(?:'s|’s)\b/gi, "the discussion's")
    .replace(/\bthe site(?:'s|’s)\b/gi, "the discussion's")
    .replace(/\bin this article\b/gi, "here")
    .replace(/\bthis article\b/gi, "the discussion")
    .replace(/\bthis draft\b/gi, "the analysis")
    .replace(/\bthis page\b/gi, "the discussion")
    .replace(/\bthis library\b/gi, "the discussion")
    .replace(/\bthis site\b/gi, "the discussion")
    .replace(/\bthe website\b/gi, "the discussion")
    .replace(/\bcompanion articles?\b/gi, "related discussions")
    .replace(/\bthese articles\b/gi, "these discussions")
    .replace(/\bthe textual-variants article\b/gi, "the textual-variants study")
    .replace(
      /\bat bottom it is not a historical question\b/gi,
      "the bottom line is not a historical question",
    );

  return cleaned.replace(
    /(^|[.!?]\s+)(the discussion|the analysis|the preservation evidence|the bottom line|the textual-variants study|the related discussions|related discussions|these discussions|here)\b/g,
    (_match, sentenceStart: string, phrase: string) =>
      `${sentenceStart}${phrase.charAt(0).toUpperCase()}${phrase.slice(1)}`,
  );
}
