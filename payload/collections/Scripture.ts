import type { CollectionConfig } from "payload";
import {
  revalidateAfterChange,
  revalidateAfterDelete,
} from "../hooks/revalidate";

const contentHooks = {
  afterChange: [revalidateAfterChange],
  afterDelete: [revalidateAfterDelete],
};

const verificationFields: CollectionConfig["fields"] = [
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
        "Scripture text must come from a verified source (e.g. the Tanzil / King Fahd Complex Quran text, a licensed Bible translation) before it can be marked verified.",
    },
  },
  {
    name: "sourceAttribution",
    type: "text",
    admin: {
      position: "sidebar",
      description: "Where the exact text was taken from, once verified.",
    },
  },
];

/**
 * Quran verses. Arabic text is inherently Arabic (not a localized field);
 * the translation field holds the English rendering and can gain an Arabic
 * tafsir note separately.
 */
export const QuranVerses: CollectionConfig = {
  slug: "quran-verses",
  access: {
    // Public read for the website and future mobile app; writes stay authenticated.
    read: () => true,
  },
  hooks: contentHooks,
  admin: {
    useAsTitle: "reference",
    defaultColumns: ["reference", "surahName", "status"],
  },
  fields: [
    { name: "surahName", type: "text", required: true },
    { name: "surahNumber", type: "number", required: true },
    { name: "ayahNumber", type: "number", required: true },
    {
      name: "arabic",
      type: "textarea",
      required: true,
      admin: {
        description:
          "Verified Arabic text only. Placeholders must clearly say [VERIFIED ARABIC QURAN TEXT PENDING].",
      },
    },
    { name: "translation", type: "textarea", required: true, localized: true },
    { name: "translator", type: "text", required: true },
    { name: "reference", type: "text", required: true },
    { name: "arabicTafsirNote", type: "textarea" },
    { name: "notes", type: "textarea" },
    ...verificationFields,
  ],
};

export const BibleVerses: CollectionConfig = {
  slug: "bible-verses",
  access: {
    // Public read for the website and future mobile app; writes stay authenticated.
    read: () => true,
  },
  hooks: contentHooks,
  admin: {
    useAsTitle: "reference",
    defaultColumns: ["reference", "book", "version", "status"],
  },
  fields: [
    { name: "book", type: "text", required: true },
    { name: "chapter", type: "number", required: true },
    {
      name: "verse",
      type: "text",
      required: true,
      admin: { description: "Single verse or range, e.g. 3 or 3-5." },
    },
    { name: "text", type: "textarea", required: true, localized: true },
    { name: "arabicText", type: "textarea" },
    { name: "arabicSource", type: "text" },
    { name: "version", type: "text", required: true },
    { name: "reference", type: "text", required: true },
    { name: "notes", type: "textarea" },
    ...verificationFields,
  ],
};
