import type { Metadata } from "next";
import { getCategoryBySlug } from "@/lib/content";
import type { CategorySlug } from "@/types/domain";

export const siteName = "The Straight Path";

export const siteNameArabic = "الصراط المستقيم";

export const siteDescription =
  "A respectful Islamic research library for sincere seekers, source-aware study, and careful comparison where needed.";

export function getSiteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

export function absoluteUrl(path = "/") {
  return new URL(path, getSiteUrl()).toString();
}

/**
 * Builds the Metadata object for a category page. Category pages export
 * `generateMetadata` calling this, so metadata stays async-compatible with
 * the future CMS-backed category lookup.
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
