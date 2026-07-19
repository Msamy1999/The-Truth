import type { ResearchTreeNode } from "@/types/domain";

const beliefPath: ResearchTreeNode[] = [
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
];

const objections: ResearchTreeNode[] = [
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
];

const meaningAndScience: ResearchTreeNode[] = [
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
];

/** Guided reading path for questions from atheists and agnostics. */
export const atheismAgnosticismTree: ResearchTreeNode[] = [
  {
    id: "is-belief-reasonable",
    title: "Is belief reasonable?",
    description: "From God's existence to the possibility of revelation and Islam's claim.",
    children: beliefPath,
    defaultOpen: true,
  },
  {
    id: "honest-objections",
    title: "Honest objections",
    description: "Suffering and morality considered without caricaturing nonbelief.",
    children: objections,
  },
  {
    id: "meaning-mind-and-science",
    title: "Meaning, mind, and science",
    description: "Purpose, consciousness, and the relationship between science and faith.",
    children: meaningAndScience,
  },
  {
    id: "the-qurans-claim",
    title: "The Quran's claim",
    description: "A final study of the Quran's message, transmission, and guidance.",
    children: [
      {
        id: "why-the-quran",
        title: "Why the Quran?",
        description:
          "A cumulative closing case from message, Arabic form, transmission, historical emergence, and lived guidance.",
        href: "/articles/why-the-quran",
        status: "draft",
        tag: "Conclusion",
      },
    ],
  },
];
