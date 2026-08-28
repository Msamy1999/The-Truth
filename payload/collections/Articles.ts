import type { CollectionConfig } from "payload";
import { authenticated, ownerOnly } from "../access/editorial";
import { enforceEditorialRole } from "../hooks/enforceEditorialRole";
import { blockUnverifiedPublish } from "../hooks/blockUnverifiedPublish";
import {
  revalidateAfterChange,
  revalidateAfterDelete,
} from "../hooks/revalidate";

const categorySlugOptions = [
  "the-quran-and-the-bible",
  "jesus-in-islam-and-christianity",
  "preservation",
  "difficult-questions",
  "scientific-signs",
  "religious-history",
  "historical-evidence",
  "tawhid-and-the-trinity",
  "salvation-and-purpose-of-life",
  "prophecies",
  "war-and-violence",
  "women",
  "questions",
  "glossary",
  "sources",
].map((value) => ({ label: value, value }));

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

const sectionKindOptions = [
  "summary",
  "scripture",
  "interpretation",
  "history",
  "argument",
  "sources",
  "notes",
].map((value) => ({ label: value, value }));

/**
 * Long-form research articles. Versions + drafts are enabled; the editorial
 * status field (draft / reviewed / published) drives what the site shows.
 * Phase 2 adds the publish gate: an article cannot reach "published" while
 * any linked citation is still source-pending.
 */
export const Articles: CollectionConfig = {
  slug: "articles",
  access: {
    // Editors can inspect every workflow state. Anonymous API clients must
    // never receive drafts or under-review records.
    read: ({ req }) =>
      req.user ? true : { status: { equals: "published" } },
    create: authenticated,
    update: authenticated,
    delete: ownerOnly,
  },
  versions: {
    drafts: true,
  },
  hooks: {
    beforeChange: [enforceEditorialRole, blockUnverifiedPublish],
    afterChange: [revalidateAfterChange],
    afterDelete: [revalidateAfterDelete],
  },
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "category", "status", "lastUpdated"],
  },
  fields: [
    { name: "title", type: "text", required: true, localized: true },
    { name: "subtitle", type: "text", required: true, localized: true },
    {
      name: "slug",
      type: "text",
      required: true,
      unique: true,
      index: true,
      admin: { position: "sidebar" },
    },
    {
      name: "category",
      type: "select",
      required: true,
      options: categorySlugOptions,
      admin: { position: "sidebar" },
    },
    {
      name: "audienceLevel",
      type: "select",
      required: true,
      defaultValue: "beginner",
      options: [
        { label: "Beginner", value: "beginner" },
        { label: "Intermediate", value: "intermediate" },
        { label: "Deep study", value: "deep-study" },
      ],
      admin: { position: "sidebar" },
    },
    { name: "summary", type: "textarea", required: true, localized: true },
    {
      name: "tags",
      type: "select",
      hasMany: true,
      options: topicTagOptions,
      admin: { position: "sidebar" },
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
          "Published requires every linked citation to be verified (enforced by the publish gate).",
      },
    },
    {
      name: "lastUpdated",
      type: "date",
      required: true,
      admin: { position: "sidebar" },
    },
    {
      name: "sections",
      type: "array",
      required: true,
      fields: [
        {
          name: "sectionId",
          type: "text",
          required: true,
          admin: { description: "Anchor id, e.g. beginner-summary." },
        },
        { name: "title", type: "text", required: true, localized: true },
        {
          name: "kind",
          type: "select",
          required: true,
          options: sectionKindOptions,
        },
        { name: "body", type: "textarea", required: true, localized: true },
        {
          name: "citations",
          type: "relationship",
          relationTo: "citations",
          hasMany: true,
        },
      ],
    },
    {
      name: "citations",
      type: "relationship",
      relationTo: "citations",
      hasMany: true,
      admin: {
        description: "Citations listed in the article's Sources section.",
      },
    },
    {
      name: "relatedArticles",
      type: "relationship",
      relationTo: "articles",
      hasMany: true,
    },
  ],
};
