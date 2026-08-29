import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { SiteBrand } from "@/components/layout/SiteBrand";
import { primaryNavItems } from "@/lib/navigation";
import { AnalyticsPreferences } from "@/components/analytics/AnalyticsConsent";

export function SiteFooter() {
  return (
    <footer data-print-hidden className="border-t border-border bg-background print:hidden">
      <Container className="grid gap-8 py-10 text-sm text-muted-foreground md:grid-cols-[1.1fr_1.5fr_0.8fr]">
        <div>
          <SiteBrand as="text" />
        </div>
        <nav aria-label="Footer main sections">
          <p className="font-medium text-foreground">Main sections</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {primaryNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-sm no-underline hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
        <div>
          <p className="font-medium text-foreground">Trust</p>
          <div className="mt-3 grid gap-2">
            <Link
              href="/method"
              className="inline-flex rounded-sm no-underline hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              Research Method
            </Link>
            <Link
              href="/sources"
              className="inline-flex rounded-sm no-underline hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              Source Library
            </Link>
            <Link
              href="/search"
              className="inline-flex rounded-sm no-underline hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              Search
            </Link>
            <Link
              href="/privacy"
              className="inline-flex rounded-sm no-underline hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              Privacy
            </Link>
            <AnalyticsPreferences />
          </div>
        </div>
      </Container>
    </footer>
  );
}
