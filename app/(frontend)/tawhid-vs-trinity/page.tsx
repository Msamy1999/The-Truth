import { CategoryPage } from "@/components/content/CategoryPage";
import { getCategoryBySlug } from "@/lib/content";
import { getCategoryMetadata } from "@/lib/seo";

export function generateMetadata() {
  return getCategoryMetadata("tawhid-vs-trinity");
}

export default async function TawhidVsTrinityPage() {
  return <CategoryPage category={await getCategoryBySlug("tawhid-vs-trinity")} />;
}
