import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { Card } from "@/components/ui/Card";

export default function NotFound() {
  return (
    <Section>
      <Container>
        <Card className="mx-auto max-w-xl p-6 text-center sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-wide text-accent">
            Page not found
          </p>
          <h1 className="mt-3 text-2xl leading-tight sm:text-3xl">
            This page is not available
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-sm leading-7 text-muted-foreground">
            The link may be outdated, or the article may have moved. Search the
            library to find the current page.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/search"
              className="inline-flex min-h-11 items-center rounded-md bg-accent px-5 text-sm font-semibold text-accent-foreground no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              Search the library
            </Link>
            <Link
              href="/"
              className="inline-flex min-h-11 items-center rounded-md border border-border bg-card px-5 text-sm font-semibold text-foreground no-underline hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              Return home
            </Link>
          </div>
        </Card>
      </Container>
    </Section>
  );
}
