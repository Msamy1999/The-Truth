import type { CollectionConfig } from "payload";

const citationTypeOptions = [
  "quran",
  "bible",
  "hadith",
  "tafsir",
  "christian-commentary",
  "academic",
  "book",
  "article",
  "manuscript",
  "other",
].map((value) => ({ label: value, value }));

/**
 * Citation records referenced by articles and scripture. The
 * pending/verified status is the heart of the no-fabrication constitution:
 * publishing hooks (Phase 2) will refuse to publish content whose linked
 * citations are not verified.
 */
export const Citations: CollectionConfig = {
  slug: "citations",
  admin: {
    useAsTitle: "title",
    defaultColumns: ["citationKey", "title", "type", "status"],
  },
  fields: [
    {
      name: "citationKey",
      type: "text",
      required: true,
      unique: true,
      index: true,
      admin: {
        description:
          "Stable key used by seed data and cross-references, e.g. source-pending-quran-translation.",
      },
    },
    {
      name: "type",
      type: "select",
      required: true,
      options: citationTypeOptions,
    },
    {
      name: "title",
      type: "text",
      required: true,
    },
    { name: "author", type: "text" },
    { name: "publisher", type: "text" },
    { name: "year", type: "number" },
    { name: "url", type: "text" },
    { name: "note", type: "textarea" },
    {
      name: "status",
      type: "select",
      required: true,
      defaultValue: "pending",
      options: [
        { label: "Source pending", value: "pending" },
        { label: "Verified", value: "verified" },
      ],
      admin: {
        position: "sidebar",
        description:
          "Do not mark verified until the exact source has been checked.",
      },
    },
    {
      name: "verifiedBy",
      type: "text",
      admin: {
        position: "sidebar",
        condition: (data) => data?.status === "verified",
      },
    },
    {
      name: "verifiedDate",
      type: "date",
      admin: {
        position: "sidebar",
        condition: (data) => data?.status === "verified",
      },
    },
  ],
};
