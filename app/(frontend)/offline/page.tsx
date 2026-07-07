import type { Metadata } from "next";
import { WifiOff } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { ButtonLink } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Offline",
  robots: { index: false },
};

export default function OfflinePage() {
  return (
    <Section spacing="lg">
      <Container className="flex flex-col items-center text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-md bg-muted text-accent">
          <WifiOff aria-hidden="true" className="h-6 w-6" />
        </div>
        <h1 className="mt-5 text-2xl font-semibold sm:text-3xl">
          You are offline
        </h1>
        <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">
          This page is not available without a connection. Pages you have
          already visited may still open from the cache.
        </p>
        <div className="mt-6">
          <ButtonLink href="/">Try the home page</ButtonLink>
        </div>
      </Container>
    </Section>
  );
}
