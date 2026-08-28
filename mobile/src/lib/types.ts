/**
 * App-side content types, mapped from the CMS API document shapes.
 * Mirrors the website's types/domain.ts.
 */

export type ArticleStatus = "draft" | "reviewed" | "published";

export type ArticleSection = {
  id: string;
  title: string;
  kind: string;
  body: string;
  citationIds: string[];
};

export type Article = {
  slug: string;
  title: string;
  subtitle: string;
  category: string;
  audienceLevel: string;
  summary: string;
  tags: string[];
  status: ArticleStatus;
  lastUpdated: string;
  sections: ArticleSection[];
  citations: string[];
  relatedArticles: string[];
};

export type Citation = {
  id: string;
  type: string;
  title: string;
  author?: string;
  publisher?: string;
  year?: number;
  url?: string;
  note?: string;
  status: "pending" | "verified";
};

export type QuranVerse = {
  scripture: "quran";
  surahName: string;
  surahNumber: number;
  ayahNumber: number;
  arabic: string;
  translation: string;
  translator: string;
  reference: string;
  notes?: string;
  status: "pending" | "verified";
};

export type BibleVerse = {
  scripture: "bible";
  book: string;
  chapter: number;
  verse: number | string;
  text: string;
  version: string;
  reference: string;
  notes?: string;
  status: "pending" | "verified";
};

export type ArticleKeyScripture = {
  quranVerses: QuranVerse[];
  bibleVerses: BibleVerse[];
};

export type GlossaryTerm = {
  term: string;
  pronunciation?: string;
  definition: string;
  category: string;
  relatedTerms: string[];
};

export type SourceLibraryItem = {
  id: string;
  title: string;
  type: string;
  category: string;
  authorOrPublisher?: string;
  year?: number;
  url?: string;
  notes: string;
  status: "pending" | "verified";
};

export type SourceLibraryCategory = {
  title: string;
  description: string;
  items: SourceLibraryItem[];
};

export type EvidenceReference = {
  kind: "Quran" | "Hadith";
  reference: string;
  summary: string;
  href: string;
};

export type ClaimAgainstIslam = {
  id: string;
  title: string;
  claim: string;
  response: string[];
  evidence: EvidenceReference[];
  links?: { href: string; label: string }[];
};

export type FutureTopic = {
  title: string;
  description: string;
  href?: string;
};

export type SiteCategory = {
  slug: string;
  title: string;
  href: string;
  description: string;
  icon: string;
  tags: string[];
  futureTopics: FutureTopic[];
  relatedSlugs: string[];
};

export type ResearchTreeNode = {
  id?: string;
  title: string;
  description?: string;
  href?: string;
  children?: ResearchTreeNode[];
  status?: string;
  tag?: string;
  defaultOpen?: boolean;
};

export type PathStep = {
  title: string;
  description: string;
  href: string;
};

export type HomeData = {
  mainPaths: ResearchTreeNode[];
  christianLearningPath: PathStep[];
  comparisonMethods: { title: string; description: string }[];
  featuredResearchCards: {
    title: string;
    description: string;
    href: string;
    label?: string;
  }[];
};

export type AppContent = {
  categories: SiteCategory[];
  home: HomeData;
  articles: Article[];
  citations: Citation[];
  glossary: GlossaryTerm[];
  sources: SourceLibraryCategory[];
  claimsAgainstIslam: ClaimAgainstIslam[];
  keyScriptureByArticle: Record<string, ArticleKeyScripture>;
};
