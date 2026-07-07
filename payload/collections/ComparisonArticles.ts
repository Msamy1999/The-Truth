import type { CollectionConfig } from "payload";
import { blockUnverifiedPublish } from "../hooks/blockUnverifiedPublish";
import {
  revalidateAfterChange,
  revalidateAfterDelete,
} from "../hooks/revalidate";

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
  hooks: {
    beforeChange: [blockUnverifiedPublish],
    afterChange: [revalidateAfterChange],
    afterDelete: [revalidateAfterDelete],
  },
  admin: {
    useAsTitle: "mainQuestion",
    defaultColumns: ["slug", "mainQuestion", "status"],
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
    {
      name: "status",
      type: "select",
      required: true,
      defaultValue: "draft",
      options: [
        { label: "Draft", value: "draft" },
        { label: "Under review", value: "reviewed" },
        { label: "Published", value: "published" },
      ],
      admin: {
        position: "sidebar",
        description:
          "Published requires every linked citation and scripture record to be verified (enforced by the publish gate).",
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
