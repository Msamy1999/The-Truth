import type { GlossaryTerm, TopicTag } from "@/types/domain";

// Developer warning:
// Glossary definitions are draft, source-pending study aids. Do not treat them
// as final theological or academic definitions until reliable sources are added.

function term(
  termName: string,
  definition: string,
  category: TopicTag,
  relatedTerms: string[] = [],
  pronunciation?: string,
): GlossaryTerm {
  return {
    term: termName,
    pronunciation,
    definition,
    category,
    relatedTerms,
    citations: ["citation-needed-general"],
  };
}

export const glossaryTerms: GlossaryTerm[] = [
  term(
    "Allah",
    "Source-pending draft: the Arabic word for God. Future notes should distinguish language, theology, and usage by Arabic-speaking Muslims and Christians.",
    "Theology",
    ["Tawhid", "Revelation"],
    "source pending",
  ),
  term(
    "Tawhid",
    "Source-pending draft: Islamic monotheism, centered on worshiping God alone. Future definition should cite Quran, hadith, and reliable theology sources.",
    "Theology",
    ["Allah", "Shirk", "Trinity"],
    "source pending",
  ),
  term(
    "Trinity",
    "Source-pending draft: Christian doctrine about Father, Son, and Holy Spirit. Future definition should cite recognized Christian sources and avoid caricature.",
    "Theology",
    ["Tawhid", "Incarnation"],
    "source pending",
  ),
  term(
    "Incarnation",
    "Source-pending draft: Christian theological term related to God and Jesus. Future entry should cite Christian sources before comparison.",
    "Theology",
    ["Trinity", "Messiah"],
  ),
  term(
    "Messiah",
    "Source-pending draft: a title used for Jesus in Christian and Islamic discussions. Future entry should define the term from relevant sources.",
    "Jesus",
    ["Gospel", "Injil"],
  ),
  term(
    "Gospel",
    "Source-pending draft: term often used for the message of Jesus or the written Gospel texts, depending on context. Future entry should separate these meanings.",
    "Scripture",
    ["Injil", "Canon"],
  ),
  term(
    "Injil",
    "Source-pending draft: Arabic/Quranic term often translated as Gospel. Future notes should cite Quran references and scholarly explanations.",
    "Scripture",
    ["Gospel", "Revelation"],
  ),
  term(
    "Shirk",
    "Source-pending draft: Islamic theological term related to associating partners with God. Future entry should cite Quran and reliable Islamic sources.",
    "Theology",
    ["Tawhid", "Allah"],
  ),
  term(
    "Revelation",
    "Source-pending draft: divine communication or guidance. Future entry should compare usage in Islam and Christianity with cited sources.",
    "Scripture",
    ["Quran", "Gospel", "Injil"],
  ),
  term(
    "Canon",
    "Source-pending draft: recognized collection of authoritative scriptures. Future entry should cite sources on biblical canon and Islamic scripture separately.",
    "History",
    ["Manuscript", "Gospel"],
  ),
  term(
    "Manuscript",
    "Source-pending draft: a handwritten textual witness. Future entry should cite manuscript studies before using examples.",
    "History",
    ["Canon", "Revelation"],
  ),
  term(
    "Hadith",
    "Source-pending draft: reports connected to the Prophet Muhammad's words, actions, or approvals. Future entry should cite hadith methodology sources.",
    "Sources",
    ["Sunnah", "Tafsir"],
  ),
  term(
    "Sunnah",
    "Source-pending draft: prophetic practice and guidance in Islam. Future entry should distinguish Sunnah from hadith with sources.",
    "Sources",
    ["Hadith"],
  ),
  term(
    "Salvation",
    "Source-pending draft: term for being saved or reaching final success. Future entry should compare Islamic and Christian usage carefully.",
    "Purpose",
    ["Atonement", "Original sin"],
  ),
  term(
    "Atonement",
    "Source-pending draft: Christian theological term connected to sin, forgiveness, and reconciliation. Future entry should cite Christian sources.",
    "Theology",
    ["Salvation", "Original sin"],
  ),
  term(
    "Original sin",
    "Source-pending draft: Christian theological concept related to sin and humanity. Future entry should explain differing Christian views fairly.",
    "Theology",
    ["Salvation", "Atonement"],
  ),
];
