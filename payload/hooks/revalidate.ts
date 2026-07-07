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
  try {
    const { revalidatePath } = await import("next/cache");
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
