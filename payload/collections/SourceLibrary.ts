import type { CollectionConfig } from "payload";
import {
  revalidateAfterChange,
  revalidateAfterDelete,
} from "../hooks/revalidate";

const contentHooks = {
  afterChange: [revalidateAfterChange],
  afterDelete: [revalidateAfterDelete],
};

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

export const SourceLibraryCategories: CollectionConfig = {
  slug: "source-library-categories",
  hooks: contentHooks,
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "order"],
  },
  fields: [
    { name: "title", type: "text", required: true, unique: true },
    { name: "description", type: "textarea", required: true, localized: true },
    {
      name: "order",
      type: "number",
      required: true,
      defaultValue: 0,
      admin: { description: "Display order on the /sources page." },
    },
  ],
};

export const SourceLibraryItems: CollectionConfig = {
  slug: "source-library-items",
  hooks: contentHooks,
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "type", "category", "status"],
  },
  fields: [
    { name: "title", type: "text", required: true },
    {
      name: "type",
      type: "select",
      required: true,
      options: citationTypeOptions,
    },
    {
      name: "category",
      type: "relationship",
      relationTo: "source-library-categories",
      required: true,
    },
    { name: "authorOrPublisher", type: "text" },
    { name: "year", type: "number" },
    { name: "url", type: "text" },
    { name: "notes", type: "textarea", required: true, localized: true },
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
          "Do not add authors, publishers, years, URLs, or manuscript details unless they have been checked.",
      },
    },
  ],
};
