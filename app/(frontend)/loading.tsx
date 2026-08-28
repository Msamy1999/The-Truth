import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";

export default function Loading() {
  return (
    <Section>
      <Container>
        <Card
          role="status"
          aria-live="polite"
          aria-label="Loading page"
          className="mx-auto flex max-w-md items-center justify-center gap-3 p-6 text-sm font-semibold text-foreground"
        >
          <Spinner className="h-5 w-5 text-accent" />
          <span>Loading page…</span>
        </Card>
      </Container>
    </Section>
  );
}
