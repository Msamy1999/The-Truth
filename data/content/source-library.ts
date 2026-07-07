import type { CitationType, SourceLibraryCategory } from "@/types/domain";

// Developer warning:
// These cards are placeholders for future verification. Do not add authors,
// publishers, years, URLs, or manuscript details unless they have been checked.

function source(
  id: string,
  title: string,
  type: CitationType,
  category: string,
  notes: string,
) {
  return {
    id,
    title,
    type,
    category,
    notes,
    status: "pending" as const,
  };
}

export const sourceLibraryCategories: SourceLibraryCategory[] = [
  {
    title: "Quran translations",
    description:
      "Future verified Quran text and translation sources, with translator attribution.",
    items: [
      source(
        "pending-quran-translation-primary",
        "Source pending: Quran Arabic text and English translation",
        "quran",
        "Quran translations",
        "Add a verified Quran text source and named translator before publishing verse cards.",
      ),
    ],
  },
  {
    title: "Tafsir",
    description:
      "Future Quran commentary sources for interpretation notes and deeper study.",
    items: [
      source(
        "pending-tafsir-source",
        "Source pending: tafsir reference",
        "tafsir",
        "Tafsir",
        "Add exact tafsir title, author, edition/publisher, and passage reference before use.",
      ),
    ],
  },
  {
    title: "Hadith",
    description:
      "Future hadith sources with exact collection, grading/status where appropriate, and reference details.",
    items: [
      source(
        "pending-hadith-source",
        "Source pending: hadith collection reference",
        "hadith",
        "Hadith",
        "Add exact collection, book/chapter, hadith number or reference, and verification notes before use.",
      ),
    ],
  },
  {
    title: "Bible translations",
    description:
      "Future Bible translation/version sources for quoted passages and comparison tables.",
    items: [
      source(
        "pending-bible-translation",
        "Source pending: Bible translation/version",
        "bible",
        "Bible translations",
        "Add exact Bible version, publisher/source, and usage notes before publishing Bible quotations.",
      ),
    ],
  },
  {
    title: "Christian commentaries",
    description:
      "Future Christian interpretation sources represented fairly and with clear attribution.",
    items: [
      source(
        "pending-christian-commentary",
        "Source pending: Christian commentary",
        "christian-commentary",
        "Christian commentaries",
        "Add title, author, publisher, year, and passage/topic before summarizing Christian interpretation.",
      ),
    ],
  },
  {
    title: "Academic books",
    description:
      "Future academic sources for historical, textual, and theological background.",
    items: [
      source(
        "pending-academic-book",
        "Source pending: academic book",
        "book",
        "Academic books",
        "Add complete bibliographic data before using this source for claims.",
      ),
    ],
  },
  {
    title: "Manuscript resources",
    description:
      "Future manuscript databases or catalogues for preservation and transmission studies.",
    items: [
      source(
        "pending-manuscript-resource",
        "Source pending: manuscript resource",
        "manuscript",
        "Manuscript resources",
        "Add exact manuscript identifiers, repository/catalogue links, dates, and source notes only after verification.",
      ),
    ],
  },
  {
    title: "Historical sources",
    description:
      "Future primary and secondary historical sources, with uncertainty clearly labeled.",
    items: [
      source(
        "pending-historical-source",
        "Source pending: historical source",
        "academic",
        "Historical sources",
        "Add source type, author, title, date/year, publisher or repository, and relevance notes before use.",
      ),
    ],
  },
  {
    title: "Articles and essays",
    description:
      "Future shorter references for essays, articles, and carefully reviewed online resources.",
    items: [
      source(
        "pending-article-essay",
        "Source pending: article or essay",
        "article",
        "Articles and essays",
        "Add title, author, publication, date/year, URL if available, and reason for use before citing.",
      ),
    ],
  },
];

export const sourceLibraryItems = sourceLibraryCategories.flatMap(
  (category) => category.items,
);
