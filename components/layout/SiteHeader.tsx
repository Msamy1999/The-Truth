import { SiteNavigation } from "@/components/layout/SiteNavigation";

export function SiteHeader() {
  return (
    <header
      data-print-hidden
      className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur print:hidden"
    >
      <SiteNavigation />
    </header>
  );
}
