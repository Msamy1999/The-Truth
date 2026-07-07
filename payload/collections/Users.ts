import type { CollectionConfig } from "payload";

/**
 * Admin users for the editorial workflow. Auth-enabled; the first user is
 * created at /admin on first run.
 */
export const Users: CollectionConfig = {
  slug: "users",
  auth: true,
  admin: {
    useAsTitle: "email",
  },
  fields: [
    {
      name: "name",
      type: "text",
    },
    {
      name: "role",
      type: "select",
      defaultValue: "owner",
      required: true,
      options: [
        // Owner can publish; reviewer can move content to under-review but
        // not publish. Even solo, this encodes the two-step verification
        // workflow for future collaborators.
        { label: "Owner", value: "owner" },
        { label: "Reviewer", value: "reviewer" },
      ],
    },
  ],
};
