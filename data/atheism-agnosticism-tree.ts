import type { ResearchTreeNode } from "@/types/domain";

/**
 * Guided reading path for /atheism-agnosticism. Draft links point to the
 * evidence-checked source articles and are promoted to published status by
 * the normal editorial workflow.
 */
export const atheismAgnosticismTree: ResearchTreeNode[] = [
  {
    id: "does-god-exist",
    title: "Does God exist?",
    description:
      "A cumulative philosophical case from contingency, cosmic origins, order, and consciousness, with the strongest objections kept in view.",
    href: "/articles/does-god-exist",
    status: "draft",
    tag: "Foundation",
  },
  {
    id: "why-believe-in-revelation",
    title: "Why believe in revelation?",
    description:
      "Why divine communication is a coherent possibility and how a claimed revelation can be tested without circular reasoning.",
    href: "/articles/why-believe-in-revelation",
    status: "draft",
    tag: "Bridge",
  },
  {
    id: "why-islam-not-just-a-creator",
    title: "Why Islam and not just \"a creator\"?",
    description:
      "A step-by-step bridge from generic theism to Tawhid, prophecy, Muhammad, the Quran, and a lived response.",
    href: "/articles/why-islam-not-just-a-creator",
    status: "draft",
    tag: "Bridge",
  },
  {
    id: "the-problem-of-evil",
    title: "The problem of evil",
    description:
      "Logical, evidential, and personal dimensions of suffering, considered through freedom, natural order, test, and final justice.",
    href: "/articles/the-problem-of-evil",
    status: "draft",
    tag: "Objection",
  },
  {
    id: "morality-without-god",
    title: "Morality without God",
    description:
      "A fair comparison of secular and theistic moral grounding that never confuses nonbelief with lack of character.",
    href: "/articles/morality-without-god",
    status: "draft",
    tag: "Ethics",
  },
  {
    id: "purpose-of-life",
    title: "Purpose of life",
    description:
      "Created meaning and the Islamic claim of objective purpose through worship, stewardship, trial, and return to God.",
    href: "/articles/purpose-of-life-atheism-agnosticism",
    status: "draft",
    tag: "Purpose",
  },
  {
    id: "consciousness-and-the-soul",
    title: "Consciousness and the soul",
    description:
      "What neuroscience establishes, what the hard problem asks, and what Islam affirms without pretending the soul has been scientifically detected.",
    href: "/articles/consciousness-and-the-soul",
    status: "draft",
    tag: "Mind",
  },
  {
    id: "science-and-religion",
    title: "Science and religion",
    description:
      "A careful framework for naturalism, interpretation, evolution, miracles, and scientific claims without forced conflict or harmony.",
    href: "/articles/science-and-religion",
    status: "draft",
    tag: "Science",
  },
  {
    id: "why-the-quran",
    title: "Why the Quran?",
    description:
      "A cumulative closing case from message, Arabic form, transmission, historical emergence, and lived guidance.",
    href: "/articles/why-the-quran",
    status: "draft",
    tag: "Conclusion",
  },
];
