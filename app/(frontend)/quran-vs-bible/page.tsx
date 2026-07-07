import { CategoryPage } from "@/components/content/CategoryPage";
import { getCategoryBySlug } from "@/lib/content";
import { getCategoryMetadata } from "@/lib/seo";

export function generateMetadata() {
  return getCategoryMetadata("quran-vs-bible");
}

export default async function QuranVsBiblePage() {
  return <CategoryPage category={await getCategoryBySlug("quran-vs-bible")} />;
}
