"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { Card } from "@/components/ui/Card";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("The page failed to render", error);
  }, [error]);

  return (
    <Section>
      <Container>
        <Card className="mx-auto max-w-xl p-6 text-center sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-wide text-accent">
            Page error
          </p>
          <h1 className="mt-3 text-2xl leading-tight sm:text-3xl">
            This page could not be opened
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-sm leading-7 text-muted-foreground">
            The problem may be temporary. Try loading the page again, or return
            to the library without losing saved reading preferences.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={reset}
              className="min-h-11 rounded-md bg-accent px-5 text-sm font-semibold text-accent-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              Try again
            </button>
            <Link
              href="/"
              className="inline-flex min-h-11 items-center rounded-md border border-border bg-card px-5 text-sm font-semibold text-foreground no-underline hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              Return to the library
            </Link>
          </div>
        </Card>
      </Container>
    </Section>
  );
}
