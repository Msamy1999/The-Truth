import type {
  CategorySlug,
  ResearchTreeNode,
  ResearchTreeStatus,
} from "@/types/domain";

/**
 * Pure branch definitions for the Islam & Christianity tree. Each branch
 * references a category by slug; lib/content composes the full tree nodes
 * (title/description/href from the category record) so this file stays
 * data-only with no cross-file logic imports.
 */
export type IslamChristianityBranchDef = {
  slug: CategorySlug;
  children: ResearchTreeNode[];
  defaultOpen?: boolean;
};

const plannedDescription =
  "Planned source-pending topic. Add verified references, translations, and context before publishing claims.";

function branch(
  slug: CategorySlug,
  children: ResearchTreeNode[],
  options: Pick<IslamChristianityBranchDef, "defaultOpen"> = {},
): IslamChristianityBranchDef {
  return {
    slug,
    defaultOpen: options.defaultOpen,
    children,
  };
}

function topic(
  title: string,
  href: string,
  description = plannedDescription,
  status?: ResearchTreeStatus,
  tag?: string,
): ResearchTreeNode {
  return {
    title,
    description,
    href,
    status,
    tag,
  };
}

function planned(title: string, categoryHref: string, description?: string) {
  return topic(title, `${categoryHref}#future-topics`, description, undefined, "Planned");
}

export const islamChristianityBranches: IslamChristianityBranchDef[] = [
  branch(
    "quran-vs-bible",
    [
      topic(
        "Who is God?",
        "/articles/who-is-god-quran-and-bible-comparison",
        "A draft comparison of how God is described, worshiped, and understood.",
        "draft",
      ),
      topic(
        "Who is Jesus?",
        "/articles/who-is-jesus",
        "A draft study path for comparing Jesus with scripture, interpretation, and context kept separate.",
        "draft",
      ),
      planned(
        "What is revelation?",
        "/quran-vs-bible",
        "Planned source-pending study on scripture, prophethood, inspiration, and source attribution.",
      ),
      planned("What is salvation?", "/quran-vs-bible"),
      planned("What is sin?", "/quran-vs-bible"),
      planned("What is worship?", "/quran-vs-bible"),
      planned("The Day of Judgment", "/quran-vs-bible"),
      planned("The final message", "/quran-vs-bible"),
    ],
    { defaultOpen: true },
  ),
  branch(
    "jesus",
    [
      topic(
        "Who is Jesus?",
        "/articles/who-is-jesus",
        "A draft study for defining the main question before comparing scripture and interpretation.",
        "draft",
      ),
      topic(
        "The miraculous birth of Jesus",
        "/articles/the-miraculous-birth-of-jesus",
        "A draft study of the virgin birth as affirmed in both scriptures, and what each tradition concludes from it.",
        "draft",
      ),
      topic(
        "The miracles of Jesus",
        "/articles/the-miracles-of-jesus",
        "A draft study of the miracles reported in both scriptures and what they establish about Jesus.",
        "draft",
      ),
      topic(
        "Did Jesus worship God?",
        "/articles/did-jesus-worship-god",
        "A draft study question about prayer, worship, obedience, and what those actions mean.",
        "draft",
      ),
      topic(
        "Did Jesus claim to be God?",
        "/articles/did-jesus-claim-to-be-god",
        "A draft study separating text, interpretation, and theological argument on the pivotal question.",
        "draft",
      ),
      planned(
        "Jesus and the Trinity",
        "/jesus",
        "Planned bridge into Tawhid, Trinity, incarnation, and worship.",
      ),
      topic(
        "Jesus as Messiah",
        "/articles/jesus-as-messiah",
        "A draft study on the shared title of Messiah and what each tradition means by it.",
        "draft",
      ),
      topic(
        "The crucifixion question",
        "/articles/the-crucifixion-question",
        "A draft study presenting the Christian, historical-critical, and Quranic positions fairly.",
        "draft",
      ),
      topic(
        "The second coming of Jesus",
        "/articles/the-second-coming-of-jesus",
        "A draft study of the shared expectation of Jesus' return.",
        "draft",
      ),
      topic(
        "Who follows Jesus more closely?",
        "/articles/who-follows-jesus-more-closely",
        "A draft framework for comparing devotion, worship, and obedience respectfully.",
        "draft",
      ),
    ],
    { defaultOpen: true },
  ),
  branch("preservation", [
    topic(
      "How the Quran was preserved",
      "/articles/how-was-the-quran-preserved",
      "A draft framework for preservation, source status, and careful definitions.",
      "draft",
    ),
    planned("Oral memorization of the Quran", "/preservation"),
    planned("Written compilation of the Quran", "/preservation"),
    planned("Early Quran manuscripts", "/preservation"),
    planned("Uthmanic standardization", "/preservation"),
    planned("Qira'at explained simply", "/preservation"),
    topic(
      "Bible manuscript transmission",
      "/articles/how-was-the-bible-transmitted",
      "A draft comparison article about transmission questions and source status.",
      "draft",
    ),
    planned("Gospel authorship and dating", "/preservation"),
    planned("Biblical canon formation", "/preservation"),
    planned("Textual variants explained", "/preservation"),
    planned("Why preservation matters", "/preservation"),
  ]),
  branch("difficult-questions", [
    planned("What is a contradiction?", "/difficult-questions"),
    planned("Genealogies of Jesus", "/difficult-questions"),
    planned("The death of Judas", "/difficult-questions"),
    planned("The timing of the crucifixion", "/difficult-questions"),
    planned("Did anyone see God?", "/difficult-questions"),
    topic(
      "Is original sin just?",
      "/articles/original-sin-vs-personal-responsibility",
      "A draft comparison of inherited guilt, accountability, repentance, and justice.",
      "draft",
    ),
    planned("Can God become man?", "/difficult-questions"),
    topic(
      "Does salvation require a sacrifice?",
      "/articles/forgiveness-in-islam-and-christianity",
      "A draft study linked to forgiveness, sacrifice, mercy, and justice.",
      "draft",
    ),
  ]),
  branch("scientific-signs", [
    planned(
      "How to approach scientific claims carefully",
      "/scientific-signs",
      "Planned guide for avoiding overstatement when discussing scripture and the natural world.",
    ),
    planned("Embryology", "/scientific-signs"),
    planned("Cosmology", "/scientific-signs"),
    planned("Mountains", "/scientific-signs"),
    planned("Seas and barriers", "/scientific-signs"),
    planned("Creation and nature", "/scientific-signs"),
    planned("Strong vs debated arguments", "/scientific-signs"),
  ]),
  branch("history", [
    planned("The historical Jesus", "/history"),
    planned("Early Christianity", "/history"),
    planned("Paul and his influence", "/history"),
    planned("Gospel authorship and dating", "/history"),
    planned("Council of Nicaea", "/history"),
    planned("Development of Trinity doctrine", "/history"),
    planned("Quranic revelation history", "/history"),
    planned("Early Islamic preservation", "/history"),
  ]),
  branch("tawhid-vs-trinity", [
    topic(
      "What is Tawhid?",
      "/articles/what-is-tawhid",
      "A draft beginner article defining the topic with source placeholders.",
      "draft",
    ),
    topic(
      "What is the Trinity?",
      "/articles/what-is-the-trinity",
      "A draft article intended to explain Christian belief fairly before comparison.",
      "draft",
    ),
    planned("Did the prophets teach pure monotheism?", "/tawhid-vs-trinity"),
    topic(
      "Did Jesus worship the Father?",
      "/articles/did-jesus-worship-god",
      "A draft bridge topic linked to Jesus and worship.",
      "draft",
    ),
    planned("Incarnation explained", "/tawhid-vs-trinity"),
    planned("Shirk explained", "/tawhid-vs-trinity"),
    planned("God's nature in Islam and Christianity", "/tawhid-vs-trinity"),
    planned("Worshiping God alone", "/tawhid-vs-trinity"),
  ]),
  branch("salvation", [
    planned("Purpose of life in Islam and Christianity", "/salvation"),
    planned("Sin and repentance", "/salvation"),
    topic(
      "Original sin vs personal responsibility",
      "/articles/original-sin-vs-personal-responsibility",
      "A draft comparison of inherited guilt, accountability, repentance, and justice.",
      "draft",
    ),
    planned("Grace, mercy, faith, and deeds", "/salvation"),
    topic(
      "Forgiveness without blood sacrifice",
      "/articles/forgiveness-in-islam-and-christianity",
      "A draft article about forgiveness, sacrifice, mercy, and justice.",
      "draft",
    ),
    planned("Heaven and Hell", "/salvation"),
    planned("Judgment Day", "/salvation"),
  ]),
  branch("prophecies", [
    planned("Prophecies about Jesus", "/prophecies"),
    planned("Possible prophecies about Muhammad", "/prophecies"),
    planned("Quranic fulfilled prophecies", "/prophecies"),
    planned("Biblical prophecies and interpretation", "/prophecies"),
    planned("End-times beliefs", "/prophecies"),
  ]),
];
