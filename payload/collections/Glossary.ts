import type { CollectionConfig } from "payload";
import {
  revalidateAfterChange,
  revalidateAfterDelete,
} from "../hooks/revalidate";

const topicTagOptions = [
  "Jesus",
  "Preservation",
  "Theology",
  "History",
  "Scripture",
  "Questions",
  "Science",
  "Sources",
  "Purpose",
  "Prophecy",
].map((value) => ({ label: value, value }));

export const GlossaryTerms: CollectionConfig = {
  slug: "glossary-terms",
  hooks: {
    afterChange: [revalidateAfterChange],
    afterDelete: [revalidateAfterDelete],
  },
  admin: {
    useAsTitle: "term",
    defaultColumns: ["term", "category"],
  },
  fields: [
    { name: "term", type: "text", required: true, unique: true, index: true },
    { name: "pronunciation", type: "text" },
    { name: "definition", type: "textarea", required: true, localized: true },
    {
      name: "category",
      type: "select",
      required: true,
      options: topicTagOptions,
      admin: { position: "sidebar" },
    },
    {
      name: "relatedTerms",
      type: "relationship",
      relationTo: "glossary-terms",
      hasMany: true,
    },
    {
      name: "citations",
      type: "relationship",
      relationTo: "citations",
      hasMany: true,
    },
  ],
};
