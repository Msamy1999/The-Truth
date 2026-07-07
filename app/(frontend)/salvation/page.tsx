import { CategoryPage } from "@/components/content/CategoryPage";
import { getCategoryBySlug } from "@/lib/content";
import { getCategoryMetadata } from "@/lib/seo";

export function generateMetadata() {
  return getCategoryMetadata("salvation");
}

export default async function SalvationPage() {
  return <CategoryPage category={await getCategoryBySlug("salvation")} />;
}
