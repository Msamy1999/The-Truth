/**
 * Server-only SEO helpers. Do NOT import this from client components — it
 * reaches into lib/content (Payload). Pure constants live in
 * lib/site-config.ts, re-exported here for existing server-side imports.
 */
import type { Metadata } from "next";
import { getCategoryBySlug } from "@/lib/content";
import type { CategorySlug } from "@/types/domain";

export {
  absoluteUrl,
  getSiteUrl,
  siteDescription,
  siteName,
  siteNameArabic,
} from "@/lib/site-config";

/**
 * Builds the Metadata object for a category page. Category pages export
 * `generateMetadata` calling this, so metadata stays async-compatible with
 * the CMS-backed category lookup.
 */
export async function getCategoryMetadata(
  slug: CategorySlug,
): Promise<Metadata> {
  const category = await getCategoryBySlug(slug);

  return {
    title: category.title,
    description: category.description,
    alternates: {
      canonical: category.href,
    },
    openGraph: {
      title: category.title,
      description: category.description,
    },
  };
}
