import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
} from "payload";

/**
 * After any content change, revalidate the whole site so edits publish in
 * seconds without a rebuild. At this content scale a full revalidation is
 * simpler and safer than tracking per-path dependencies (an article edit
 * affects its page, category page, search, sitemap, and related articles).
 *
 * Wrapped in try/catch because CLI scripts (seed, parity) run outside a
 * Next.js request context where revalidatePath is unavailable.
 */
async function revalidateSite() {
  // Bulk draft imports run outside a Next.js request and may touch hundreds
  // of records. They do not need per-record cache invalidation because the
  // site is restarted after the import; skipping it keeps the SQLite write
  // transaction short and avoids blocking the local app.
  if (process.argv.some((argument) => argument.endsWith("payload/import-drafts.ts"))) {
    return;
  }

  try {
    const { revalidatePath, revalidateTag } = await import("next/cache");
    // Content queries are cached across requests; mark them stale whenever an
    // editor saves so the next visitor gets a fast response while fresh data
    // is prepared in the background.
    revalidateTag("library-content", "max");
    revalidatePath("/", "layout");
  } catch {
    // Not running inside Next.js (e.g. seed script) — nothing to revalidate.
  }
}

export const revalidateAfterChange: CollectionAfterChangeHook = async ({
  doc,
}) => {
  await revalidateSite();
  return doc;
};

export const revalidateAfterDelete: CollectionAfterDeleteHook = async ({
  doc,
}) => {
  await revalidateSite();
  return doc;
};
