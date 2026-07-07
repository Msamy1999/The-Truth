import { CategoryPage } from "@/components/content/CategoryPage";
import { getCategoryBySlug } from "@/lib/content";
import { getCategoryMetadata } from "@/lib/seo";

export function generateMetadata() {
  return getCategoryMetadata("difficult-questions");
}

export default async function DifficultQuestionsPage() {
  return (
    <CategoryPage category={await getCategoryBySlug("difficult-questions")} />
  );
}
