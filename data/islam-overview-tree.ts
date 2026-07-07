import type { ResearchTreeNode } from "@/types/domain";

/**
 * Flat beginner outline for /islam-overview. Entries without an href are
 * planned, source-pending topics with no article yet — shown as
 * non-clickable rows rather than a link to nowhere.
 */
export const islamOverviewTree: ResearchTreeNode[] = [
  {
    id: "who-is-allah",
    title: "Who is Allah?",
    description:
      "Planned beginner topic on the Islamic understanding of God, His names, and His attributes.",
    tag: "Planned",
  },
  {
    id: "what-is-tawhid",
    title: "What is Tawhid?",
    description:
      "A draft beginner article defining Islamic monotheism with source placeholders.",
    href: "/articles/what-is-tawhid",
    status: "draft",
  },
  {
    id: "what-is-the-quran",
    title: "What is the Quran?",
    description:
      "Planned introduction to revelation, structure, and how the Quran will be cited across the library.",
    tag: "Planned",
  },
  {
    id: "who-is-prophet-muhammad",
    title: "Who is Prophet Muhammad ﷺ?",
    description:
      "Planned beginner biography with sourced dates and events added only after verification.",
    tag: "Planned",
  },
  {
    id: "what-are-the-prophets",
    title: "What are the prophets?",
    description:
      "Planned overview of prophethood in Islam and the shared line of messengers.",
    tag: "Planned",
  },
  {
    id: "five-pillars-of-islam",
    title: "Five pillars of Islam",
    description:
      "Planned beginner explanation of the five acts of worship that structure Muslim practice.",
    tag: "Planned",
  },
  {
    id: "six-pillars-of-faith",
    title: "Six pillars of faith",
    description:
      "Planned explanation of the core articles of Islamic belief (Iman).",
    tag: "Planned",
  },
  {
    id: "worship-and-daily-life",
    title: "Worship and daily life",
    description:
      "Planned overview of how worship shapes daily routine, character, and community.",
    tag: "Planned",
  },
  {
    id: "why-islam",
    title: "Why Islam?",
    description:
      "Planned closing argument bringing scripture, theology, preservation, and purpose together.",
    tag: "Planned",
  },
];
