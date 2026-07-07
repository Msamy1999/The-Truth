import type { CategorySlug, FutureTopic, SiteCategory } from "@/types/domain";

function topic(title: string, description: string, href?: string): FutureTopic {
  return { title, description, href };
}

export const siteCategories = [
  {
    slug: "quran-vs-bible",
    title: "Quran vs Bible",
    href: "/quran-vs-bible",
    description:
      "A beginner-friendly hub for comparing major questions in the Quran and Bible with clear source status.",
    icon: "scripture",
    tags: ["Scripture", "Theology"],
    futureTopics: [
      topic(
        "Who is God?",
        "A draft comparison of how God is described, worshiped, and understood.",
        "/articles/who-is-god-quran-and-bible-comparison",
      ),
      topic(
        "Who is Jesus?",
        "A study path for comparing Jesus with scripture, interpretation, and context kept separate.",
        "/articles/who-is-jesus",
      ),
      topic(
        "What is revelation?",
        "A planned study on scripture, prophethood, inspiration, and source attribution.",
      ),
      topic(
        "What is salvation?",
        "A planned comparison of forgiveness, accountability, mercy, and purpose.",
      ),
      topic(
        "What is sin?",
        "A planned topic for personal responsibility, repentance, and moral accountability.",
      ),
      topic(
        "What is worship?",
        "A planned study on worshiping God, prayer, obedience, and devotion.",
      ),
      topic(
        "What is the Day of Judgment?",
        "A planned comparison of accountability, resurrection, judgment, and final destiny.",
      ),
      topic(
        "What is the final message?",
        "A planned research path about prophecy, revelation, and the completion of guidance.",
      ),
    ],
    relatedSlugs: ["preservation", "jesus", "sources"],
  },
  {
    slug: "jesus",
    title: "Jesus in Islam & Christianity",
    href: "/jesus",
    description:
      "A respectful path for Christians and other seekers to study Jesus through scripture, theology, and history.",
    icon: "jesus",
    tags: ["Jesus", "Theology"],
    futureTopics: [
      topic(
        "Who is Jesus?",
        "A draft study for defining the main question before comparing scripture and interpretation.",
        "/articles/who-is-jesus",
      ),
      topic(
        "The miraculous birth of Jesus",
        "A planned study with Quran and Bible passages to be added only after verification.",
      ),
      topic(
        "The miracles of Jesus",
        "A planned topic for comparing miracles with clear references and source notes.",
      ),
      topic(
        "Did Jesus worship God?",
        "A draft Christian-facing study question with scripture placeholders.",
        "/articles/did-jesus-worship-god",
      ),
      topic(
        "Did Jesus claim to be God?",
        "A planned study separating text, interpretation, and theological argument.",
      ),
      topic(
        "Jesus and the Trinity",
        "A planned bridge into Tawhid, Trinity, incarnation, and worship.",
        "/tawhid-vs-trinity",
      ),
      topic(
        "Jesus as Messiah",
        "A planned study on the meaning of Messiah in Islamic and Christian discussions.",
      ),
      topic(
        "The crucifixion question",
        "A planned careful comparison with source status kept visible.",
      ),
      topic(
        "The second coming of Jesus",
        "A planned study of future expectation with scripture and source placeholders.",
      ),
      topic(
        "Who follows Jesus more closely?",
        "A draft article framework for comparing devotion, worship, and obedience respectfully.",
        "/articles/who-follows-jesus-more-closely",
      ),
    ],
    relatedSlugs: ["tawhid-vs-trinity", "quran-vs-bible", "questions"],
  },
  {
    slug: "preservation",
    title: "Preservation of Scripture",
    href: "/preservation",
    description:
      "A source-conscious study area for transmission, manuscripts, compilation, and why preservation matters.",
    icon: "preservation",
    tags: ["Preservation", "History", "Scripture"],
    futureTopics: [
      topic(
        "How the Quran was preserved",
        "A draft study framework for preservation, source status, and careful definitions.",
        "/articles/how-was-the-quran-preserved",
      ),
      topic(
        "Oral memorization of the Quran",
        "A planned study on memorization that needs verified sources before claims are made.",
      ),
      topic(
        "Written compilation of the Quran",
        "A planned topic for compilation history with source placeholders.",
      ),
      topic(
        "Early Quran manuscripts",
        "A planned manuscript topic with no manuscript data added until verified.",
      ),
      topic(
        "Uthmanic standardization",
        "A planned study requiring careful historical source review.",
      ),
      topic(
        "Qira'at explained simply",
        "A planned beginner explanation with terminology and source safeguards.",
      ),
      topic(
        "Bible manuscript transmission",
        "A draft comparison article about transmission questions and source status.",
        "/articles/how-was-the-bible-transmitted",
      ),
      topic(
        "Gospel authorship and dating",
        "A planned historical topic with citations required before publication.",
      ),
      topic(
        "Biblical canon formation",
        "A planned study on canon history and source types.",
      ),
      topic(
        "Textual variants explained",
        "A planned beginner topic on variants, evidence, and fair evaluation.",
      ),
      topic(
        "Why preservation matters",
        "A planned reflection on why source history matters for seekers.",
      ),
    ],
    relatedSlugs: ["quran-vs-bible", "history", "sources"],
  },
  {
    slug: "difficult-questions",
    title: "Contradictions & Difficult Questions",
    href: "/difficult-questions",
    description:
      "A careful space for hard questions, context, fair representation, and source-backed responses.",
    icon: "questions",
    tags: ["Questions", "Scripture"],
    futureTopics: [
      topic(
        "What is a contradiction?",
        "A planned method page for defining contradiction before evaluating examples.",
      ),
      topic(
        "Genealogies of Jesus",
        "A planned question page with Bible references and source notes pending.",
      ),
      topic(
        "The death of Judas",
        "A planned comparison that must quote exact passages and versions before analysis.",
      ),
      topic(
        "The timing of the crucifixion",
        "A planned topic requiring careful context and source attribution.",
      ),
      topic(
        "Did anyone see God?",
        "A planned question page separating text, interpretation, and theology.",
      ),
      topic(
        "Is original sin just?",
        "A planned bridge into salvation, responsibility, and justice.",
        "/articles/original-sin-vs-personal-responsibility",
      ),
      topic(
        "Can God become man?",
        "A planned theology question linked to incarnation and Tawhid.",
      ),
      topic(
        "Does salvation require a sacrifice?",
        "A planned study linked to forgiveness, mercy, and atonement.",
        "/articles/forgiveness-in-islam-and-christianity",
      ),
    ],
    relatedSlugs: ["questions", "quran-vs-bible", "sources"],
  },
  {
    slug: "scientific-signs",
    title: "Scientific & Natural Signs",
    href: "/scientific-signs",
    description:
      "A cautious category for future discussions about the natural world, interpretation, and the limits of argument.",
    icon: "science",
    tags: ["Science", "Theology"],
    futureTopics: [
      topic(
        "Interpretation caution guide",
        "A planned note on avoiding overstatement when discussing scripture and the natural world.",
      ),
      topic(
        "Natural signs source map",
        "A placeholder for future passages, commentary, and source attribution.",
      ),
      topic(
        "Limits of scientific claims",
        "A future study note separating observation, interpretation, and argument.",
      ),
    ],
    relatedSlugs: ["history", "questions", "sources"],
  },
  {
    slug: "history",
    title: "Historical Evidence",
    href: "/history",
    description:
      "A place to gather historical context, timelines, and source-based background for major claims.",
    icon: "history",
    tags: ["History", "Sources"],
    futureTopics: [
      topic(
        "Timeline template",
        "A planned layout for dates, events, sources, and uncertainty notes.",
      ),
      topic(
        "Primary vs secondary sources",
        "A future article explaining how source types will be presented.",
      ),
      topic(
        "Historical method notes",
        "A placeholder for careful standards before drawing historical conclusions.",
      ),
    ],
    relatedSlugs: ["preservation", "sources", "jesus"],
  },
  {
    slug: "tawhid-vs-trinity",
    title: "Tawhid vs Trinity",
    href: "/tawhid-vs-trinity",
    description:
      "A respectful comparison of Islamic monotheism and Christian Trinitarian theology using definitions and sources.",
    icon: "theology",
    tags: ["Theology", "Jesus"],
    futureTopics: [
      topic(
        "What is Tawhid?",
        "A draft beginner article defining the topic with source placeholders.",
        "/articles/what-is-tawhid",
      ),
      topic(
        "What is the Trinity?",
        "A draft article intended to explain Christian belief fairly before comparison.",
        "/articles/what-is-the-trinity",
      ),
      topic(
        "Did the prophets teach pure monotheism?",
        "A planned study needing verified scripture and historical sources.",
      ),
      topic(
        "Did Jesus worship the Father?",
        "A planned bridge topic linked to Jesus and worship.",
        "/articles/did-jesus-worship-god",
      ),
      topic(
        "Incarnation explained",
        "A planned Christian-theology explainer requiring careful sourcing.",
      ),
      topic(
        "Shirk explained",
        "A planned Islamic-theology explainer requiring careful sourcing.",
      ),
      topic(
        "God's nature in Islam and Christianity",
        "A planned comparison of divine nature, attributes, and worship.",
      ),
      topic(
        "Worshiping God alone",
        "A planned study on worship, devotion, and theological consistency.",
      ),
    ],
    relatedSlugs: ["jesus", "salvation", "glossary"],
  },
  {
    slug: "salvation",
    title: "Salvation & Purpose of Life",
    href: "/salvation",
    description:
      "A future guide to worship, forgiveness, accountability, mercy, and purpose with sources separated from commentary.",
    icon: "salvation",
    tags: ["Purpose", "Theology"],
    futureTopics: [
      topic(
        "Purpose of life in Islam and Christianity",
        "A planned beginner study of worship, meaning, and accountability.",
      ),
      topic(
        "Sin and repentance",
        "A planned comparison of sin, repentance, mercy, and return to God.",
      ),
      topic(
        "Original sin vs personal responsibility",
        "A draft article comparing the issue with fair framing and source placeholders.",
        "/articles/original-sin-vs-personal-responsibility",
      ),
      topic(
        "Grace, mercy, faith, and deeds",
        "A planned study of key salvation terms and how each tradition uses them.",
      ),
      topic(
        "Forgiveness without blood sacrifice",
        "A draft article about forgiveness, sacrifice, mercy, and justice.",
        "/articles/forgiveness-in-islam-and-christianity",
      ),
      topic(
        "Heaven and Hell",
        "A planned study of final destiny and source-backed definitions.",
      ),
      topic(
        "Judgment Day",
        "A planned comparison of accountability and divine justice.",
      ),
      topic(
        "Why Islam's view of salvation is coherent",
        "A planned Islamic conclusion page that must be argued with sources.",
      ),
    ],
    relatedSlugs: ["tawhid-vs-trinity", "questions", "jesus"],
  },
  {
    slug: "prophecies",
    title: "Prophecies & Signs",
    href: "/prophecies",
    description:
      "A future index for prophecy discussions, interpretive frameworks, and source-backed notes.",
    icon: "prophecies",
    tags: ["Prophecy", "History"],
    futureTopics: [
      topic(
        "Prophecy claim checklist",
        "A planned method for recording the text, interpretation, dating, and source status.",
      ),
      topic(
        "Context and fulfillment notes",
        "A future article structure for keeping context visible while comparing interpretations.",
      ),
      topic(
        "Source status table",
        "A placeholder for tracking which references are verified and which are pending.",
      ),
    ],
    relatedSlugs: ["history", "quran-vs-bible", "sources"],
  },
  {
    slug: "questions",
    title: "Common Questions",
    href: "/questions",
    description:
      "Short beginner-friendly answers will live here, with links to deeper cited studies.",
    icon: "questions",
    tags: ["Questions"],
    futureTopics: [
      topic(
        "New reader questions",
        "A planned collection for visitors who are just beginning comparative study.",
      ),
      topic(
        "Christian visitor questions",
        "A future section for respectful questions Christians commonly ask about Islam.",
      ),
      topic(
        "Muslim study questions",
        "A placeholder for organized study prompts and citation-backed answers.",
      ),
    ],
    relatedSlugs: ["difficult-questions", "salvation", "glossary"],
  },
  {
    slug: "glossary",
    title: "Glossary",
    href: "/glossary",
    description:
      "Definitions for theological, historical, Arabic, and biblical terms used across the library.",
    icon: "glossary",
    tags: ["Sources", "Theology"],
    futureTopics: [
      topic(
        "Arabic terms",
        "A future glossary section for Arabic words with transliteration and source notes.",
      ),
      topic(
        "Biblical terms",
        "A planned glossary section for terms used in Bible and Christian theology discussions.",
      ),
      topic(
        "Historical method terms",
        "A placeholder for terms that appear in source criticism and history articles.",
      ),
    ],
    relatedSlugs: ["sources", "tawhid-vs-trinity", "questions"],
  },
  {
    slug: "sources",
    title: "Source Library",
    href: "/sources",
    description:
      "A structured place to track translations, primary texts, academic references, and source status.",
    icon: "sources",
    tags: ["Sources", "Scripture", "History"],
    futureTopics: [
      topic(
        "Translation registry",
        "A planned list of Quran translations, Bible versions, and how each source is cited.",
      ),
      topic(
        "Citation status labels",
        "A future guide to verified, source-pending, and citation-needed labels.",
      ),
      topic(
        "Primary source index",
        "A placeholder index for primary texts and source access notes.",
      ),
    ],
    relatedSlugs: ["glossary", "history", "quran-vs-bible"],
  },
] satisfies SiteCategory[];

export const islamChristianityCategorySlugs = [
  "quran-vs-bible",
  "jesus",
  "preservation",
  "difficult-questions",
  "scientific-signs",
  "history",
  "tawhid-vs-trinity",
  "salvation",
  "prophecies",
] satisfies CategorySlug[];

export const learnIslamCategorySlugs = [
  "tawhid-vs-trinity",
  "quran-vs-bible",
  "preservation",
  "salvation",
  "questions",
  "glossary",
  "sources",
] satisfies CategorySlug[];

// This file holds pure data only. Category lookup helpers live in
// lib/content, SEO metadata construction lives in lib/seo, and navigation
// config lives in lib/navigation.
