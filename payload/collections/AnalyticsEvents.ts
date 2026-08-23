import type { CollectionConfig } from "payload";

const deviceOptions = [
  "desktop",
  "mobile",
  "tablet",
  "unknown",
].map((value) => ({ label: value, value }));

const browserOptions = [
  "chrome",
  "edge",
  "firefox",
  "safari",
  "ios",
  "android",
  "other",
  "unknown",
].map((value) => ({ label: value, value }));

/**
 * Anonymous, consent-gated first-party usage records.
 *
 * This collection deliberately has no IP address, raw user-agent, account
 * identity, or free-form personal data. It is an admin-only collection; the
 * public website writes through its validated server route with overrideAccess.
 */
export const AnalyticsEvents: CollectionConfig = {
  slug: "analytics-events",
  access: {
    read: ({ req }) => Boolean(req.user),
    create: () => false,
    update: () => false,
    delete: () => false,
  },
  admin: {
    useAsTitle: "path",
    defaultColumns: [
      "visitorId",
      "recordedAt",
      "path",
      "entryReferrer",
      "durationLabel",
      "deviceCategory",
      "country",
      "browserCategory",
    ],
    description:
      "Anonymous, consented page activity. No IP addresses, raw user-agents, names, or emails are stored.",
  },
  fields: [
    { name: "visitorId", type: "text", required: true, index: true },
    { name: "sessionId", type: "text", required: true, index: true },
    {
      name: "recordedAt",
      type: "date",
      required: true,
      index: true,
      admin: { position: "sidebar" },
    },
    { name: "enteredAt", type: "date", required: true },
    { name: "path", type: "text", required: true, index: true },
    { name: "title", type: "text", required: true },
    {
      name: "entryReferrer",
      type: "text",
      admin: { description: "Origin and path only; query strings are removed." },
    },
    {
      name: "durationMs",
      type: "number",
      required: true,
      min: 0,
      max: 86_400_000,
      admin: {
        description: "Precise active time in milliseconds; the table shows a readable duration label.",
      },
    },
    {
      name: "durationLabel",
      type: "text",
      required: true,
      admin: {
        description: "Human-readable active time, for example 42s or 3m 12s.",
      },
    },
    {
      name: "deviceCategory",
      type: "select",
      required: true,
      options: deviceOptions,
    },
    {
      name: "browserCategory",
      type: "select",
      required: true,
      options: browserOptions,
    },
    { name: "language", type: "text" },
    { name: "country", type: "text", index: true },
    { name: "region", type: "text" },
    { name: "city", type: "text" },
    {
      name: "exitReason",
      type: "select",
      required: true,
      options: [
        { label: "Navigation", value: "navigation" },
        { label: "Page hidden", value: "page-hidden" },
        { label: "Page closed", value: "page-closed" },
      ],
    },
  ],
};
