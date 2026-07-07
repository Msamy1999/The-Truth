import { CategoryPage } from "@/components/content/CategoryPage";
import { getCategoryBySlug } from "@/lib/content";
import { getCategoryMetadata } from "@/lib/seo";

export function generateMetadata() {
  return getCategoryMetadata("history");
}

export default async function HistoryPage() {
  return <CategoryPage category={await getCategoryBySlug("history")} />;
}
