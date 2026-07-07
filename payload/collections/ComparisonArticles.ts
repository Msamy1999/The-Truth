import type { CollectionConfig } from "payload";

const localizedTextarea = (name: string) =>
  ({
    name,
    type: "textarea",
    required: true,
    localized: true,
  }) as const;

/**
 * Structured comparison articles rendered by ComparisonArticleLayout. A
 * comparison record shares its slug with a base article record.
 */
export const ComparisonArticles: CollectionConfig = {
  slug: "comparison-articles",
  versions: {
    drafts: true,
  },
  admin: {
    useAsTitle: "mainQuestion",
    defaultColumns: ["slug", "mainQuestion"],
  },
  fields: [
    {
      name: "slug",
      type: "text",
      required: true,
      unique: true,
      index: true,
      admin: {
        position: "sidebar",
        description: "Must match the slug of the base article record.",
      },
    },
    { name: "mainQuestion", type: "text", required: true, localized: true },
    localizedTextarea("beginnerSummary"),
    localizedTextarea("quranicPerspective"),
    localizedTextarea("biblicalPerspective"),
    localizedTextarea("historicalContext"),
    localizedTextarea("christianInterpretation"),
    localizedTextarea("islamicResponse"),
    {
      name: "keyDifferences",
      type: "array",
      fields: [
        { name: "difference", type: "textarea", required: true, localized: true },
      ],
    },
    {
      name: "commonObjections",
      type: "array",
      fields: [
        { name: "objection", type: "textarea", required: true, localized: true },
        { name: "response", type: "textarea", required: true, localized: true },
      ],
    },
    localizedTextarea("respectfulConclusion"),
    {
      name: "quranVerses",
      type: "relationship",
      relationTo: "quran-verses",
      hasMany: true,
    },
    {
      name: "bibleVerses",
      type: "relationship",
      relationTo: "bible-verses",
      hasMany: true,
    },
    {
      name: "sources",
      type: "relationship",
      relationTo: "citations",
      hasMany: true,
    },
    {
      name: "relatedTopics",
      type: "array",
      fields: [{ name: "topic", type: "text", required: true, localized: true }],
    },
  ],
};
