import { CategoryPage } from "@/components/content/CategoryPage";
import { getCategoryBySlug } from "@/lib/content";
import { getCategoryMetadata } from "@/lib/seo";

export function generateMetadata() {
  return getCategoryMetadata("jesus");
}

export default async function JesusPage() {
  return <CategoryPage category={await getCategoryBySlug("jesus")} />;
}
