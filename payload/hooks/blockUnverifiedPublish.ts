import type { CollectionBeforeChangeHook, Payload } from "payload";
import { APIError } from "payload";

/**
 * The no-fabrication constitution as code: content cannot reach
 * status "published" while any linked citation or scripture record is still
 * source-pending, or while placeholder markers remain in its text.
 *
 * This runs on the server for every create/update, so neither the admin UI
 * nor the REST API can bypass it.
 */

const PLACEHOLDER_PATTERNS = [
  /\[VERIFIED[^\]]*PENDING\]/i,
  /\[Add (Quran|Bible) verse:/i,
  /\[(?:SOURCE[ -]?PENDING|CITATION PENDING)\]/i,
  /citation needed/i,
];

function findPlaceholder(text: string): string | undefined {
  for (const pattern of PLACEHOLDER_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      return match[0];
    }
  }

  return undefined;
}

function relationIds(value: unknown): (string | number)[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) =>
      typeof item === "object" && item !== null && "id" in item
        ? (item as { id: string | number }).id
        : (item as string | number),
    )
    .filter((id) => id !== null && id !== undefined);
}

async function assertAllVerified(
  payload: Payload,
  collection: "citations" | "quran-verses" | "bible-verses",
  ids: (string | number)[],
  label: string,
) {
  if (ids.length === 0) {
    return;
  }

  const docs = await payload.find({
    collection,
    where: { id: { in: ids } },
    limit: ids.length,
    depth: 0,
  });

  const unverified = docs.docs.filter(
    (doc) => (doc as { status?: string }).status !== "verified",
  );

  if (unverified.length > 0) {
    const names = unverified
      .map(
        (doc) =>
          (doc as { citationKey?: string; reference?: string; title?: string })
            .citationKey ??
          (doc as { reference?: string }).reference ??
          (doc as { title?: string }).title ??
          String(doc.id),
      )
      .join(", ");

    throw new APIError(
      `Cannot publish: ${label} not yet verified: ${names}. Verify every source before publishing.`,
      400,
    );
  }
}

function collectStrings(value: unknown, out: string[]): void {
  if (typeof value === "string") {
    out.push(value);
  } else if (Array.isArray(value)) {
    for (const item of value) {
      collectStrings(item, out);
    }
  } else if (typeof value === "object" && value !== null) {
    for (const key of Object.keys(value)) {
      // Relationship objects carry unrelated text; only walk plain fields.
      if (key === "id" || key === "createdAt" || key === "updatedAt") {
        continue;
      }
      collectStrings((value as Record<string, unknown>)[key], out);
    }
  }
}

export const blockUnverifiedPublish: CollectionBeforeChangeHook = async ({
  data,
  req,
}) => {
  if (data?.status !== "published") {
    return data;
  }

  // 1. No placeholder markers anywhere in the document's text.
  const strings: string[] = [];
  collectStrings(data, strings);
  for (const text of strings) {
    const placeholder = findPlaceholder(text);
    if (placeholder) {
      throw new APIError(
        `Cannot publish: placeholder marker "${placeholder}" is still present. Replace all placeholders with verified content first.`,
        400,
      );
    }
  }

  // 2. Every linked citation must be verified (top-level and per-section).
  const citationIds = [
    ...relationIds(data.citations),
    ...(Array.isArray(data.sections)
      ? data.sections.flatMap((section: { citations?: unknown }) =>
          relationIds(section?.citations),
        )
      : []),
    ...relationIds(data.sources),
  ];
  await assertAllVerified(req.payload, "citations", citationIds, "citations");

  // 3. Comparison articles: every linked scripture record must be verified.
  await assertAllVerified(
    req.payload,
    "quran-verses",
    relationIds(data.quranVerses),
    "Quran verses",
  );
  await assertAllVerified(
    req.payload,
    "bible-verses",
    relationIds(data.bibleVerses),
    "Bible verses",
  );

  return data;
};
