import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";

export const metadata: Metadata = {
  title: "Privacy",
  description: "How The Straight Path handles anonymous, consented analytics.",
};

export default function PrivacyPage() {
  return (
    <Container size="narrow" className="py-12 sm:py-16">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">
        Privacy
      </p>
      <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">
        A simple, consent-first approach
      </h1>
      <div className="mt-6 space-y-5 text-muted-foreground">
        <p>
          The Straight Path does not require an account to read its content. The
          optional analytics feature is off until a visitor gives clear consent.
          If consent is declined, the site does not send analytics events.
        </p>
        <p>
          When enabled, the site records an anonymous visitor and session ID,
          page path and title, the referring page, the time the
          page was active, broad device and browser categories, and country,
          region, or city headers supplied by Cloudflare when available. This is
          used to understand which pages help readers and where the site needs
          improvement.
        </p>
        <p>
          The analytics record never stores an IP address, raw user-agent,
          name, email address, advertising identifier, query string, or page
          content. Records are visible only to authenticated site administrators
          and are not sold or shared for advertising. Use the analytics
          control in the footer at any time to turn the feature off or on for
          future visits.
        </p>
        <p>
          Your choice is kept in a small browser preference so the site can
          remember whether analytics is allowed. It is not an account, and it
          is not used to identify you.
        </p>
      </div>
    </Container>
  );
}
