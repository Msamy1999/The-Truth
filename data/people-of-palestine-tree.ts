import type { ResearchTreeNode } from "@/types/domain";

/**
 * Flat outline for /people-of-palestine. Kept deliberately careful and
 * source-pending: no dates, figures, or historical claims are stated here.
 * "Source library for Palestine" is the only entry with a real destination
 * today (the general source library), since a dedicated source list has not
 * been verified and published yet.
 */
export const peopleOfPalestineTree: ResearchTreeNode[] = [
  {
    id: "who-are-the-people-of-palestine",
    title: "Who are the people of Palestine?",
    description:
      "Planned introduction focused on human dignity, community, and daily life rather than politics or slogans.",
    tag: "Planned",
  },
  {
    id: "why-palestine-matters-to-muslims",
    title: "Why Palestine matters to Muslims",
    description:
      "Planned topic on the religious, historical, and human ties Muslims feel toward Palestine, written carefully and without inflammatory language.",
    tag: "Planned",
  },
  {
    id: "jerusalem-and-al-aqsa",
    title: "Jerusalem and Al-Aqsa",
    description:
      "Planned topic on the significance of Jerusalem and Al-Aqsa Mosque, with historical claims added only after verification.",
    tag: "Planned",
  },
  {
    id: "human-dignity-and-justice",
    title: "Human dignity and justice",
    description:
      "Planned reflection on dignity, compassion, and justice as shared human and Islamic values.",
    tag: "Planned",
  },
  {
    id: "how-to-learn-responsibly",
    title: "How to learn responsibly",
    description:
      "Planned guide for evaluating sources, avoiding propaganda, and reading history and news carefully.",
    tag: "Planned",
  },
  {
    id: "source-library-for-palestine",
    title: "Source library for Palestine",
    description:
      "A dedicated, verified reading list is planned. Until then, the general source library tracks citation status.",
    href: "/sources",
    tag: "Planned",
  },
];
