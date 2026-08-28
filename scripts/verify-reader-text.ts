import assert from "node:assert/strict";
import { cleanEditorialText } from "../lib/reader-text";

const cases = new Map([
  [
    "Readers can use this library's companion articles to continue.",
    "Readers can use the related discussions to continue.",
  ],
  [
    "This article's conclusion is concise.",
    "The discussion's conclusion is concise.",
  ],
  ["In this article, sources are compared.", "Here, sources are compared."],
  ["How This Library Labels Its Sources", "How Sources Are Labeled"],
  [
    "This page does not call manuscript additions or wording variants contradictions.",
    "Manuscript additions and wording variants are not counted as contradictions.",
  ],
]);

for (const [input, expected] of cases) {
  assert.equal(cleanEditorialText(input), expected);
}

console.log("Reader-facing editorial normalization verified.");
