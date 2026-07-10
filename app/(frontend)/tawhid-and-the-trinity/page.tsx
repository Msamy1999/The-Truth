import { CategoryPage } from "@/components/content/CategoryPage";
import { getCategoryBySlug } from "@/lib/content";
import { getCategoryMetadata } from "@/lib/seo";

export function generateMetadata() {
  return getCategoryMetadata("tawhid-and-the-trinity");
}

export default async function TawhidAndTheTrinityPage() {
  return <CategoryPage category={await getCategoryBySlug("tawhid-and-the-trinity")} />;
}
