import { CategoryPage } from "@/components/content/CategoryPage";
import { getCategoryBySlug } from "@/lib/content";
import { getCategoryMetadata } from "@/lib/seo";

export function generateMetadata() {
  return getCategoryMetadata("questions");
}

export default async function QuestionsPage() {
  return <CategoryPage category={await getCategoryBySlug("questions")} />;
}
