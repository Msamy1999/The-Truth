import type {
  Article,
  ArticleSection,
  ArticleSectionKind,
  CategorySlug,
  TopicTag,
} from "@/types/domain";

// Developer warning:
// All articles in this file are draft placeholders. Any scripture, historical,
// theological, manuscript, or academic claim must be verified and cited before
// publication. Placeholder scripture text is intentionally not real scripture.

const LAST_UPDATED = "2026-07-04";

const DEFAULT_CITATIONS = [
  "source-pending-quran-translation",
  "source-pending-bible-version",
  "source-pending-academic-context",
  "citation-needed-general",
];

type DraftSectionInput = {
  id: string;
  title: string;
  kind: ArticleSectionKind;
  body: string;
  citationIds?: string[];
};

type DraftArticleInput = {
  slug: string;
  title: string;
  subtitle: string;
  category: CategorySlug;
  summary: string;
  tags: TopicTag[];
  sections: DraftSectionInput[];
  relatedArticles: string[];
};

function createDraftArticle(input: DraftArticleInput): Article {
  return {
    slug: input.slug,
    title: input.title,
    subtitle: input.subtitle,
    category: input.category,
    audienceLevel: "beginner",
    summary: input.summary,
    tags: input.tags,
    status: "draft",
    lastUpdated: LAST_UPDATED,
    sections: input.sections.map((section): ArticleSection => ({
      citationIds: ["citation-needed-general"],
      ...section,
    })),
    citations: DEFAULT_CITATIONS,
    relatedArticles: input.relatedArticles,
  };
}

function jesusSections(topic: string): DraftSectionInput[] {
  return [
    section(
      "beginner-summary",
      "Beginner summary",
      "summary",
      `${topic} draft placeholder. Start with a simple summary for Christians and seekers, then show exactly which sources need to be checked before conclusions are made.`,
    ),
    section(
      "main-question",
      "Main question",
      "notes",
      `Main question placeholder for ${topic}. State the question precisely and avoid answering it before scripture and context are presented.`,
    ),
    section(
      "quranic-perspective",
      "Quranic perspective",
      "scripture",
      "[Add Quran verse: Surah Maryam reference, Arabic + translation, translator/source attribution.] Source pending.",
      ["source-pending-quran-translation"],
    ),
    section(
      "biblical-perspective",
      "Biblical perspective",
      "scripture",
      "[Add Bible verse: Gospel reference, translation/version.] Source pending.",
      ["source-pending-bible-version"],
    ),
    section(
      "historical-theological-context",
      "Historical/theological context",
      "history",
      "Placeholder. Add only verified historical or theological background, and label interpretation separately from source data.",
      ["source-pending-academic-context"],
    ),
    section(
      "key-differences",
      "Key differences",
      "argument",
      "Placeholder. List differences only after the relevant scripture and interpretation have been sourced.",
    ),
    section(
      "islamic-conclusion",
      "Islamic conclusion",
      "argument",
      "Placeholder. Present Islam's conclusion confidently through evidence, without insulting Christians or overstating what has been shown.",
    ),
    section(
      "sources-needed",
      "Sources needed",
      "sources",
      "Needed before publication: verified Quran text and translation, Bible passage/version, Christian interpretation source, Islamic interpretation source, and any historical references.",
      DEFAULT_CITATIONS,
    ),
    section(
      "related-topics",
      "Related topics",
      "notes",
      "Placeholder. Link this article to Jesus, Tawhid, Quran vs Bible, salvation, and source-library topics as appropriate.",
    ),
  ];
}

function quranBibleSections(topic: string): DraftSectionInput[] {
  return [
    section(
      "beginner-summary",
      "Beginner summary",
      "summary",
      `${topic} draft placeholder. Introduce the issue simply and make clear that source verification is still pending.`,
    ),
    section(
      "main-question",
      "Main question",
      "notes",
      `Main question placeholder for ${topic}. Define the exact comparison before presenting evidence.`,
    ),
    section(
      "quranic-perspective",
      "Quranic perspective if relevant",
      "scripture",
      "[Add Quran verse: exact surah/ayah, Arabic + translation, translator/source attribution.] Source pending.",
      ["source-pending-quran-translation"],
    ),
    section(
      "biblical-perspective",
      "Biblical perspective if relevant",
      "scripture",
      "[Add Bible verse: exact book/chapter/verse and translation/version.] Source pending.",
      ["source-pending-bible-version"],
    ),
    section(
      "historical-context",
      "Historical context",
      "history",
      "Placeholder. Add verified historical context only after identifying sources and uncertainty.",
      ["source-pending-academic-context"],
    ),
    section(
      "key-comparison",
      "Key comparison",
      "argument",
      "Placeholder. Compare only what the verified sources actually support.",
    ),
    section(
      "what-muslims-argue",
      "What Muslims argue",
      "argument",
      "Placeholder. Present the Islamic argument clearly and source it before review.",
    ),
    section(
      "what-christians-may-respond",
      "What Christians may respond",
      "interpretation",
      "Placeholder. Represent Christian responses fairly and with citations before publication.",
      ["source-pending-bible-version", "citation-needed-general"],
    ),
    section(
      "fair-evaluation",
      "Fair evaluation",
      "argument",
      "Placeholder. Weigh the evidence calmly, avoid overclaiming, and identify what still needs sourcing.",
    ),
    section(
      "sources-needed",
      "Sources needed",
      "sources",
      "Needed before publication: primary scripture references, translation/version details, historical sources, and any academic sources used.",
      DEFAULT_CITATIONS,
    ),
  ];
}

function theologySections(topic: string): DraftSectionInput[] {
  return [
    section(
      "beginner-summary",
      "Beginner summary",
      "summary",
      `${topic} draft placeholder. Begin gently, define terms, and make the comparison understandable for sincere readers.`,
    ),
    section(
      "christian-belief",
      "Christian belief explained fairly",
      "interpretation",
      "Placeholder. Explain the Christian belief in a way Christians would recognize, with citations added before publication.",
      ["source-pending-bible-version", "citation-needed-general"],
    ),
    section(
      "islamic-belief",
      "Islamic belief explained clearly",
      "interpretation",
      "Placeholder. Explain the Islamic belief clearly with verified Quran, hadith, tafsir, or scholarly references before publication.",
      ["source-pending-quran-translation", "citation-needed-general"],
    ),
    section(
      "scripture-placeholders",
      "Relevant scripture placeholders",
      "scripture",
      "[Add Quran verse: exact reference, Arabic + translation.] [Add Bible verse: exact Gospel or epistle reference, translation/version.] Source pending.",
      ["source-pending-quran-translation", "source-pending-bible-version"],
    ),
    section(
      "theological-comparison",
      "Theological comparison",
      "argument",
      "Placeholder. Compare the beliefs after definitions and sources are in place.",
    ),
    section(
      "common-objections",
      "Common objections",
      "notes",
      "Placeholder. State objections fairly, avoid caricature, and answer only with sourced material.",
    ),
    section(
      "islamic-response",
      "Islamic response",
      "argument",
      "Placeholder. Present the Islamic response confidently through evidence and respectful reasoning.",
    ),
    section(
      "sources-needed",
      "Sources needed",
      "sources",
      "Needed before publication: scripture references, Christian theological sources, Islamic theological sources, and historical context where relevant.",
      DEFAULT_CITATIONS,
    ),
    section(
      "related-topics",
      "Related topics",
      "notes",
      "Placeholder. Link to Jesus, Tawhid vs Trinity, salvation, difficult questions, and glossary entries.",
    ),
  ];
}

function section(
  id: string,
  title: string,
  kind: ArticleSectionKind,
  body: string,
  citationIds?: string[],
): DraftSectionInput {
  return { id, title, kind, body, citationIds };
}

export const articles: Article[] = [
  createDraftArticle({
    slug: "who-is-jesus",
    title: "Who is Jesus?",
    subtitle:
      "A draft Christian-facing study of Jesus with scripture, interpretation, and context kept separate.",
    category: "jesus",
    summary:
      "Draft placeholder. This article will compare Islamic and Christian claims about Jesus with verified scripture and careful interpretation.",
    tags: ["Jesus", "Theology", "Scripture"],
    sections: jesusSections("Who is Jesus?"),
    relatedArticles: [
      "did-jesus-worship-god",
      "who-follows-jesus-more-closely",
      "what-is-tawhid",
    ],
  }),
  createDraftArticle({
    slug: "did-jesus-worship-god",
    title: "Did Jesus worship God?",
    subtitle:
      "A draft study question about prayer, worship, obedience, and what those actions mean.",
    category: "jesus",
    summary:
      "Draft placeholder. This article will ask how Jesus' worship and prayer should be understood, while treating Christian belief respectfully.",
    tags: ["Jesus", "Theology", "Scripture"],
    sections: jesusSections("Did Jesus worship God?"),
    relatedArticles: ["who-is-jesus", "what-is-tawhid", "what-is-the-trinity"],
  }),
  createDraftArticle({
    slug: "who-follows-jesus-more-closely",
    title: "Who follows Jesus more closely?",
    subtitle:
      "A draft comparison about worship, obedience, belief, and love for Jesus.",
    category: "jesus",
    summary:
      "Draft placeholder. This article will compare claims about following Jesus without mocking Christian devotion or Muslim conviction.",
    tags: ["Jesus", "Theology", "Questions"],
    sections: jesusSections("Who follows Jesus more closely?"),
    relatedArticles: ["who-is-jesus", "did-jesus-worship-god", "forgiveness-in-islam-and-christianity"],
  }),
  createDraftArticle({
    slug: "who-is-god-quran-and-bible-comparison",
    title: "Who is God? Quran and Bible comparison",
    subtitle:
      "A draft comparison of divine identity, worship, and revelation with source placeholders.",
    category: "quran-vs-bible",
    summary:
      "Draft placeholder. This article will compare how God is described and worshiped, using verified scripture and fair interpretation.",
    tags: ["Scripture", "Theology"],
    sections: quranBibleSections("Who is God? Quran and Bible comparison"),
    relatedArticles: ["what-is-tawhid", "what-is-the-trinity", "who-is-jesus"],
  }),
  createDraftArticle({
    slug: "how-was-the-quran-preserved",
    title: "How was the Quran preserved?",
    subtitle:
      "A draft preservation study with manuscript and transmission claims held for source review.",
    category: "preservation",
    summary:
      "Draft placeholder. This article will study Quran preservation through definitions, oral transmission, written compilation, and verified sources.",
    tags: ["Preservation", "Scripture", "History", "Sources"],
    sections: quranBibleSections("How was the Quran preserved?"),
    relatedArticles: ["how-was-the-bible-transmitted", "was-the-quran-preserved", "source-status-labels"],
  }),
  createDraftArticle({
    slug: "how-was-the-bible-transmitted",
    title: "How was the Bible transmitted?",
    subtitle:
      "A draft comparison article about Bible transmission, manuscripts, canon, and source status.",
    category: "preservation",
    summary:
      "Draft placeholder. This article will study Bible transmission respectfully, with exact manuscript or textual data added only after verification.",
    tags: ["Preservation", "Scripture", "History", "Sources"],
    sections: quranBibleSections("How was the Bible transmitted?"),
    relatedArticles: ["how-was-the-quran-preserved", "who-is-god-quran-and-bible-comparison", "source-status-labels"],
  }),
  createDraftArticle({
    slug: "what-is-tawhid",
    title: "What is Tawhid?",
    subtitle:
      "A draft explanation of Islamic monotheism for Christian and seeker audiences.",
    category: "tawhid-vs-trinity",
    summary:
      "Draft placeholder. This article will define Tawhid clearly and compare it respectfully with Christian theology.",
    tags: ["Theology", "Jesus"],
    sections: theologySections("What is Tawhid?"),
    relatedArticles: ["what-is-the-trinity", "did-jesus-worship-god", "who-is-god-quran-and-bible-comparison"],
  }),
  createDraftArticle({
    slug: "what-is-the-trinity",
    title: "What is the Trinity?",
    subtitle:
      "A draft article for explaining Christian belief fairly before comparison with Tawhid.",
    category: "tawhid-vs-trinity",
    summary:
      "Draft placeholder. This article will explain Trinitarian belief with Christian sources before presenting Islamic comparison.",
    tags: ["Theology", "Jesus"],
    sections: theologySections("What is the Trinity?"),
    relatedArticles: ["what-is-tawhid", "who-is-jesus", "did-jesus-worship-god"],
  }),
  createDraftArticle({
    slug: "original-sin-vs-personal-responsibility",
    title: "Original sin vs personal responsibility",
    subtitle:
      "A draft comparison of inherited guilt, accountability, repentance, and justice.",
    category: "salvation",
    summary:
      "Draft placeholder. This article will compare original sin and personal responsibility while representing Christian belief fairly.",
    tags: ["Purpose", "Theology", "Questions"],
    sections: theologySections("Original sin vs personal responsibility"),
    relatedArticles: ["forgiveness-in-islam-and-christianity", "what-is-tawhid", "who-is-jesus"],
  }),
  createDraftArticle({
    slug: "forgiveness-in-islam-and-christianity",
    title: "Forgiveness in Islam and Christianity",
    subtitle:
      "A draft comparison of mercy, repentance, sacrifice, faith, and deeds.",
    category: "salvation",
    summary:
      "Draft placeholder. This article will compare forgiveness in Islam and Christianity with scripture placeholders and fair theological framing.",
    tags: ["Purpose", "Theology", "Questions"],
    sections: theologySections("Forgiveness in Islam and Christianity"),
    relatedArticles: ["original-sin-vs-personal-responsibility", "what-is-tawhid", "who-follows-jesus-more-closely"],
  }),
  createDraftArticle({
    slug: "was-the-quran-preserved",
    title: "Was the Quran Preserved?",
    subtitle:
      "A draft comparison template for studying preservation claims with careful source status.",
    category: "preservation",
    summary:
      "Draft placeholder. This page will later organize preservation questions, manuscript context, transmission claims, and source notes without overstating evidence.",
    tags: ["Preservation", "Scripture", "History", "Sources"],
    sections: quranBibleSections("Was the Quran preserved?"),
    relatedArticles: ["how-was-the-quran-preserved", "how-was-the-bible-transmitted", "source-status-labels"],
  }),
  createDraftArticle({
    slug: "how-to-read-comparisons",
    title: "How to Read Comparisons Carefully",
    subtitle: "A draft template for future beginner-friendly study pages.",
    category: "quran-vs-bible",
    summary:
      "Placeholder article showing how future content can separate scripture, interpretation, history, and argument.",
    tags: ["Scripture", "Questions"],
    sections: quranBibleSections("How to read comparisons carefully"),
    relatedArticles: ["source-status-labels", "who-is-god-quran-and-bible-comparison"],
  }),
  createDraftArticle({
    slug: "source-status-labels",
    title: "Source Status Labels",
    subtitle: "A draft standard for citation-needed and source-pending content.",
    category: "sources",
    summary:
      "Placeholder article defining how future pages can mark draft, reviewed, and published source status.",
    tags: ["Sources"],
    sections: [
      section(
        "why-labels-matter",
        "Why labels matter",
        "notes",
        "Draft placeholder. Future source labels should protect readers from unsupported claims.",
      ),
      section(
        "before-publication",
        "Before publication",
        "sources",
        "Draft placeholder. Any article moving to reviewed or published status must replace placeholder citations.",
        ["citation-needed-general"],
      ),
    ],
    relatedArticles: ["how-to-read-comparisons", "how-was-the-quran-preserved"],
  }),
];
