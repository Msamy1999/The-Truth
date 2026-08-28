import type { Citation as CitationRecord } from "@/types/content";
import { safeExternalUrl } from "@/lib/external-url";

type CitationListProps = {
  citations: CitationRecord[];
};

export function CitationList({ citations }: CitationListProps) {
  if (citations.length === 0) {
    return null;
  }

  return (
    <ol className="space-y-3">
      {citations.map((citation) => {
        const sourceUrl = safeExternalUrl(citation.url);
        return (
          <li
            key={citation.id}
            className="rounded-lg border border-border bg-card p-4 text-sm leading-7 text-card-foreground"
          >
            <p className="font-semibold">{citation.title}</p>
            <p className="mt-1 text-muted-foreground">
              {formatCitationMeta(citation)}
            </p>
            {sourceUrl ? (
              <a
                href={sourceUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="mt-2 inline-flex rounded-sm text-muted-foreground hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                Source link
              </a>
            ) : null}
            {citation.note ? (
              <p className="mt-2 text-muted-foreground">{citation.note}</p>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}

function formatCitationMeta(citation: CitationRecord) {
  const parts = [
    citation.type,
    citation.author,
    citation.publisher,
    citation.year?.toString(),
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(" | ") : "Publication details unavailable";
}
