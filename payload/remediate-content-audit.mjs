/**
 * Applies the July 2026 full-corpus audit corrections to content-drafts.
 *
 * The migration edits top-level JSON values in place so unrelated formatting
 * stays intact. It is idempotent: running it again leaves corrected content
 * unchanged. Missing scripture records are copied from an already verified
 * draft or fetched from the same canonical APIs used by verify-drafts.mjs.
 *
 *   node payload/remediate-content-audit.mjs
 */
import { readdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const draftsDir = path.resolve(dirname, "../content-drafts");
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const states = new Map();
for (const file of readdirSync(draftsDir).filter((name) => name.endsWith(".json"))) {
  const filePath = path.join(draftsDir, file);
  const raw = readFileSync(filePath, "utf8");
  const data = JSON.parse(raw);
  states.set(data.slug, {
    data,
    file,
    filePath,
    raw,
    changedKeys: new Set(),
  });
}

function stateFor(slug) {
  const state = states.get(slug);
  if (!state) throw new Error("Unknown draft slug: " + slug);
  return state;
}

function mark(state, ...keys) {
  for (const key of keys) state.changedKeys.add(key);
}

function section(draft, sectionId) {
  const found = draft.sections.find((item) => item.sectionId === sectionId);
  if (!found) throw new Error(draft.slug + ": missing section " + sectionId);
  return found;
}

function replaceRequired(text, from, to, label) {
  if (text.includes(to)) return text;
  if (!text.includes(from)) {
    throw new Error(label + ": expected text was not found: " + from.slice(0, 100));
  }
  return text.replace(from, to);
}

function replaceParagraph(body, needle, replacement, label) {
  if (body.includes(replacement)) return body;
  const paragraphs = body.split("\n\n");
  const index = paragraphs.findIndex((paragraph) => paragraph.includes(needle));
  if (index === -1) throw new Error(label + ": paragraph not found: " + needle);
  paragraphs[index] = replacement;
  return paragraphs.join("\n\n");
}

function replaceTopLevelValue(raw, key, value) {
  const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const keyPattern = new RegExp("\\n([ \\t]*)\\\"" + escapedKey + "\\\"\\s*:");
  const keyMatch = keyPattern.exec(raw);
  if (!keyMatch) throw new Error("Top-level JSON key not found: " + key);
  const baseIndent = keyMatch[1];
  let start = keyMatch.index + keyMatch[0].length;
  while (/\s/.test(raw[start])) start += 1;

  let end = start;
  const opener = raw[start];
  if (opener === '"') {
    end += 1;
    let escaped = false;
    while (end < raw.length) {
      const character = raw[end];
      if (!escaped && character === '"') {
        end += 1;
        break;
      }
      escaped = !escaped && character === "\\";
      if (character !== "\\") escaped = false;
      end += 1;
    }
  } else if (opener === "[" || opener === "{") {
    const closer = opener === "[" ? "]" : "}";
    let depth = 0;
    let inString = false;
    let escaped = false;
    while (end < raw.length) {
      const character = raw[end];
      if (inString) {
        if (!escaped && character === '"') inString = false;
        escaped = !escaped && character === "\\";
        if (character !== "\\") escaped = false;
      } else if (character === '"') {
        inString = true;
      } else if (character === opener) {
        depth += 1;
      } else if (character === closer) {
        depth -= 1;
        if (depth === 0) {
          end += 1;
          break;
        }
      }
      end += 1;
    }
  } else {
    while (end < raw.length && !/[\n,}]/.test(raw[end])) end += 1;
  }

  const serialized = JSON.stringify(value, null, 2).replace(/\n/g, "\n" + baseIndent);
  return raw.slice(0, start) + serialized + raw.slice(end);
}

function update(slug, keys, callback) {
  const state = stateFor(slug);
  callback(state.data);
  mark(state, ...keys);
}

function applyCoreCorrections() {
  update(
    "archeological-evidence-for-quranic-accounts",
    ["summary", "seo", "sections", "faq"],
    (draft) => {
      draft.summary =
        "This article surveys Quranic narratives concerning the People of Ad, Thamud, the people addressed by Lot, and Pharaoh's army, asking what archaeology can and cannot establish. The evidence ranges from independent attestation of names and settings to disputed site proposals and narratives with no direct material corroboration.";
      draft.seo.metaDescription =
        "A critical survey of archaeological evidence related to Quranic accounts of Ad, Thamud, the people of Lot, and Pharaoh, with disputed identifications clearly labelled.";
      draft.seo.keywords = [
        ...new Set(
          draft.seo.keywords
            .filter((keyword) => keyword !== "Tower of Babel" && keyword !== "Sodom")
            .concat(["People of Lot", "archaeological limits"]),
        ),
      ];

      section(draft, "introduction").body =
        "The Quran frequently refers to earlier peoples and events in order to make theological and moral arguments. Among them are Ad, Thamud, the people addressed by Lot, the companions of the Elephant, and the drowning of Pharaoh's pursuing forces. Archaeology can sometimes illuminate the names, places, technologies, and political settings connected with such narratives, but it rarely proves the theological interpretation of an event.\n\nThis distinction is essential. Independent evidence that a people called Thamud existed does not by itself demonstrate every detail of the Quranic account, and destruction at a Dead Sea site does not identify that site as the city associated with Lot. This article therefore separates direct evidence, indirect historical context, disputed identification, and absence of corroboration rather than presenting resemblance as confirmation.";

      const tower = section(draft, "tower-babel");
      tower.title = "Pharaoh and Haman's Tower: Not the Tower of Babel";
      tower.body =
        "The Quran does not narrate the Tower of Babel episode found in Genesis 11. It does not place a defiant tower in Babylon, connect a tower with the origin of multiple languages, or identify Etemenanki with a Quranic event. Treating Babylon's ziggurat as confirmation of a Quranic Babel account therefore attributes a narrative to the Quran that is not present.\n\nThe Quran does contain a different tower episode. In Quran 28:38 Pharaoh commands Haman to kindle a fire over clay and build a lofty structure so that Pharaoh may look toward the God of Moses. Quran 40:36-37 contains a related command. These verses are set in the story of Pharaoh in Egypt and serve the narrative's portrayal of his arrogance; they are not a retelling of Genesis 11.\n\nNo known archaeological structure can be securely identified as the building requested in these verses. Archaeology confirms that monumental building and mud-brick construction belonged to the ancient Near Eastern world, but that general background is not direct corroboration of this particular episode.";

      section(draft, "scholarly-synthesis").body =
        "The evidence falls into several different categories.\n\n**Independent historical context:** Assyrian, Babylonian, Greco-Roman, and Nabatean sources attest peoples called Thamud or closely related forms. This establishes that the name belonged to real Arabian groups, but it does not independently verify the Quranic account of Salih or identify the Nabatean tombs at Al-Hijr as the dwellings described in that account.\n\n**Disputed site proposals:** Bronze Age destruction is documented at several sites around the Dead Sea, but identifying any one of them with the people addressed by Lot remains contested. The Quran itself does not supply the modern site names required to make that identification.\n\n**No confirmed archaeological correlate:** No site is generally accepted as the Quranic Ad, and no direct Egyptian evidence confirms the drowning of Pharaoh's pursuing force. Arguments from missing records must remain cautious in both directions: absence of evidence is not automatic disproof, but neither is it positive confirmation.\n\n**A textual boundary:** The Quran does not contain the Genesis Tower of Babel narrative. Babylon's Etemenanki therefore cannot be presented as archaeological confirmation of a Quranic Babel story.\n\nThe responsible conclusion is limited: archaeology can illuminate settings and sometimes corroborate names or broad cultural features, while the specific narrative and its theological meaning may remain unverified by material evidence.";

      section(draft, "conclusion").body =
        "Archaeology provides a mixed and carefully bounded picture. The long extra-Quranic attestation of the name Thamud is meaningful historical context, but it does not identify a particular excavation with the Quranic narrative. Dead Sea destruction layers make several historical reconstructions possible, but no proposed city of Lot commands consensus. Ad and the drowning of Pharaoh's forces remain without direct archaeological confirmation.\n\nThe earlier version of this article wrongly included the Tower of Babel as a Quranic narrative. The Quran contains no Genesis 11 Babel or language-dispersal episode; its tower passages concern Pharaoh and Haman in Egypt. Correcting that mistake illustrates the method this subject requires: establish first what the text actually says, then distinguish material evidence from analogy, and finally label faith conclusions as faith conclusions.\n\nSacred narratives may retain theological meaning regardless of what survives in the ground, but archaeology should not be made to prove more than the evidence can bear. The most defensible survey reports confirmed names and settings, disputed identifications, and missing corroboration in separate categories.";

      const babelFaq = draft.faq.find(
        (item) => item.question.includes("Babylon's tower") || item.question.includes("Tower of Babel"),
      );
      if (!babelFaq) throw new Error(draft.slug + ": Babel FAQ not found");
      babelFaq.question = "Does the Quran contain the Tower of Babel story?";
      babelFaq.answer =
        "No. The Babel and language-dispersal story is in Genesis 11, not the Quran. Quran 28:38 and 40:36-37 instead describe Pharaoh asking Haman for a lofty structure in Egypt. Babylon's Etemenanki is real, but it is not archaeological confirmation of a Quranic Babel narrative.";
    },
  );

  update("the-historical-jesus", ["sections"], (draft) => {
    section(draft, "islamic-sources").body =
      "Islamic sources present Jesus (Isa) as a major prophetic figure honored in the Quran and hadith. The personal name Isa occurs twenty-five times in the Quran. Additional passages refer to him through titles such as the Messiah, as the son of Mary, or by context, so broader totals depend on what a compiler chooses to count and should not be presented as a simple by-name statistic.\n\nThe Quran affirms Jesus' miraculous birth to Mary, his prophetic mission, and miracles performed by God's permission. Islamic tradition counts him among the major messengers often called ulu al-azm, alongside Noah, Abraham, Moses, and Muhammad.\n\n**On divinity:** Quran 4:171 calls Jesus the Messiah, a messenger of God, and a word conveyed to Mary, then warns readers not to say 'Three' and states that God is one and exalted above having a son. The wording 'He is Allah, One' and 'He neither begets nor is born' belongs to Quran 112:1-3 and must not be quoted as though it were 4:171.\n\n**On crucifixion:** Quran 4:157 says that Jesus' opponents did not kill or crucify him and that the matter was made to appear so to them. Quran 3:55 speaks of God taking and raising Jesus. Classical exegetes offered more than one account of how to understand these verses, including substitution narratives, while agreeing on the Quran's denial that Jesus' enemies successfully killed him.\n\nMuslim tradition also expects Jesus to return before the final Hour. These claims are theological affirmations grounded in revelation; historical-critical scholarship evaluates the crucifixion differently because it works from earlier Christian and non-Christian historical sources rather than accepting the Quran as revealed testimony.";
  });

  update("creation-and-nature", ["sections", "furtherReading"], (draft) => {
    section(draft, "contemporary").body =
      "Contemporary physics has renewed philosophical discussion of design through so-called fine-tuning: some parameters in physical models must fall within life-permitting ranges for stable matter, long-lived stars, or complex chemistry to be possible. The amount of permitted variation is not uniformly 'a few percent.' It differs greatly by parameter, by which constants are allowed to vary together, and by the physical model being tested. Fine-tuning is therefore a family of technical and philosophical arguments, not one settled numerical result.\n\nA weak anthropic observation says that observers necessarily find themselves in conditions compatible with observers. Some philosophers regard that selection effect as insufficient to explain why life-permitting laws or domains exist; others argue that no further explanation is warranted until the probability distribution over possible laws is known.\n\nMultiverse proposals also need careful separation. Eternal-inflation models, landscape proposals in high-energy physics, and the many-worlds interpretation of quantum mechanics are distinct ideas. They are sometimes discussed together, but many-worlds by itself does not establish a cosmological ensemble with different fundamental constants. These proposals should be assessed on their physical motivations and evidence, not described as attempts to 'escape' design.\n\nTheistic design, deeper physical necessity, observational selection, and multiverse models are competing or sometimes compatible philosophical explanations. None currently functions as a laboratory proof of theism or atheism. A design inference also would not, by itself, identify the designer with the full theology of any particular religion.";

    section(draft, "integrating-views").body =
      "Contemporary Muslim and Christian thinkers offer several ways of relating evolutionary science to creation theology. Some accept evolutionary mechanisms while holding that God creates and sustains the natural order. Others reject important parts of common descent or insist on special creation of human beings. These are real internal disagreements, not a single religious position.\n\nOn a theistic-evolutionary reading, scripture teaches who creates and why creation matters rather than supplying a modern account of biological mechanism. Critics answer that some traditional readings make historical claims that cannot simply be converted into metaphor. The dispute therefore concerns hermeneutics as well as science.\n\nProvidential approaches add that apparently contingent natural processes can still fall within divine governance. Such a claim is theological rather than a competing scientific mechanism, because it does not normally generate a different experimental prediction.\n\nHuman dignity is likewise not determined solely by biological ancestry. Religious accounts may ground dignity in moral agency, vocation, relationship to God, or the image of God, while debates continue over how those doctrines relate to evolutionary continuity.\n\nThe maxim that truth does not oppose truth is associated with Ibn Rushd's *Decisive Treatise*, not al-Ghazali. Ibn Rushd argued that sound demonstration and correctly interpreted revelation cannot ultimately conflict. Al-Ghazali also used rigorous reasoning and did not reject science as such, but he criticized particular metaphysical claims of the philosophers; assigning Ibn Rushd's maxim to him reverses an important historical attribution.";

    const dajani = draft.furtherReading.find((item) =>
      item.title.includes("Evolution and Islam's Quantum Question"),
    );
    if (!dajani) throw new Error(draft.slug + ": Dajani source not found");
    Object.assign(dajani, {
      type: "journalArticle",
      journal: "Zygon: Journal of Religion and Science",
      year: 2012,
      volume: "47",
      issue: "2",
      pages: "343-353",
      doi: "10.1111/j.1467-9744.2012.01259.x",
      url: "https://doi.org/10.1111/j.1467-9744.2012.01259.x",
    });
  });

  update("rights-of-non-muslims", ["sections", "faq"], (draft) => {
    const dhimma = section(draft, "the-dhimma-system");
    dhimma.body = replaceParagraph(
      dhimma.body,
      "The system's Quranic anchor is Quran 9:29",
      "Dhimma means a covenant of protection; ahl al-dhimma, 'the people of the covenant,' were non-Muslims who lived permanently under Muslim rule as protected but legally differentiated persons. Jurists commonly connected the institution to Quran 9:29, which commands fighting certain People of the Scripture until they pay jizya. The verse itself does not contain the inserted phrase 'who fight against the Muslim polity.' Some modern interpreters restrict the command through its historical setting or through other verses governing hostilities, while many classical jurists read it more broadly. The article must distinguish the verse's wording from those competing legal interpretations.",
      draft.slug,
    );
    dhimma.body = replaceParagraph(
      dhimma.body,
      "What the covenant guaranteed is stated consistently",
      "Legal manuals commonly describe protection of life and property and some degree of communal religious practice in exchange for jizya and acceptance of Muslim rule. The scope was not uniform. Rules concerning new or existing churches and synagogues, public ritual, clothing, officeholding, testimony, and exemptions from jizya varied by school, treaty, ruler, period, and locality. Some communities enjoyed substantial autonomy and security; others experienced restrictive enforcement or persecution. These historical differences should not be compressed into a claim that one package of rights was consistently guaranteed everywhere.",
      draft.slug,
    );

    const lived = section(draft, "lived-history");
    lived.title = "Fourteen Centuries in Practice: Persistence, Flourishing, and Persecution";
    lived.body = lived.body.replace(/sixteen centuries/gi, "approximately fourteen centuries");

    const jizya = draft.faq.find((item) => item.question.includes("What exactly was the jizya"));
    if (!jizya) throw new Error(draft.slug + ": jizya FAQ not found");
    jizya.answer =
      "The jizya was an annual poll tax imposed on protected non-Muslim subjects. Classical rules commonly focused on free adult men with means, while exemptions for women, children, poverty, disability, age, clergy, or military service differed across schools and administrations. In return the state claimed duties of protection, and dhimmis ordinarily did not pay zakat as Muslims did. The system nevertheless marked a legally subordinate status based partly on religious identity, and its actual burdens varied considerably across time and place.";
  });

  update("development-of-trinity-doctrine", ["sections"], (draft) => {
    const councils = section(draft, "broader-implications");
    councils.body = replaceParagraph(
      councils.body,
      "Oriental Orthodox",
      "Churches that rejected Chalcedon, now commonly called Oriental Orthodox, remained Nicene and Trinitarian. Their division from Chalcedonian churches concerned Christology: the terminology used to confess the union of Christ's divinity and humanity. It should not be presented as a variant denial of the Trinity. Modern official dialogues have found substantial shared Christological faith even while ecclesial divisions and terminological disagreements remain.",
      draft.slug,
    );
  });

  update("seas-and-barriers", ["sections"], (draft) => {
    section(draft, "oceanographic-reality").body =
      "Fresh and salt water mix wherever they meet, but the rate and pattern of mixing depend on tides, river flow, wind, basin shape, temperature, and salinity. Because fresher water is usually less dense, it can flow above denser seawater and form a stratified estuary. A halocline is a zone in which salinity changes rapidly with depth; it is a gradient, not an impermeable wall.\n\nOceanographers describe salt-wedge, partially mixed, well-mixed, and fjord-type circulation among other patterns. In a strongly stratified estuary, two water masses may remain visibly or instrumentally distinguishable over distance while turbulence and molecular diffusion continuously exchange water across the boundary. In a well-mixed estuary, salinity may vary much more horizontally than vertically.\n\nThe scientifically accurate description is therefore not that the waters 'do not mix,' but that density gradients and circulation can preserve a recognizable boundary or layered structure while mixing continues. River plumes such as the Amazon's provide dramatic examples, but they are dynamic and gradually diluted into the ocean.";
    section(draft, "pre-modern-observation").body =
      "Pre-modern observers could notice that river water sometimes retained a different color, taste, sediment load, or surface flow after entering the sea. Greek and Roman geographical writing contains observations of rivers or water masses remaining distinguishable. Such observations did not require knowledge of molecular diffusion or modern fluid dynamics.\n\nThis context neither makes the Quranic imagery false nor proves that it discloses otherwise inaccessible science. It shows that a visible boundary between water masses and the modern explanation of mixing across that boundary are different levels of description.";
    section(draft, "critical-analysis").body =
      "Several points can be stated without forcing a theological conclusion. Fresh and saline waters can form stable-looking layers or fronts; they nevertheless mix. These patterns were observable before modern oceanography. The Arabic word *barzakh* can denote a barrier, partition, or intervening boundary, but the physical imagery should not be converted into an impermeable wall.\n\nThe Quranic passages also are not identical in wording. Quran 25:53 and 35:12 explicitly contrast palatable fresh water with salty water. Quran 55:19-20 speaks of two seas meeting with a barzakh between them but does not, in those verses alone, identify one as fresh and the other as salt. Interpretation should preserve those textual differences.\n\nA faith reading may see the ordered behavior of waters as a sign of divine wisdom. A historical reading may emphasize accessible natural observation. Neither requires the scientifically incorrect statement that the waters never mix.";
    section(draft, "scientific-accuracy").body =
      "The passages can be read accurately at the level of ordinary observation if 'barrier' denotes a boundary or transition and if 'not transgressing' is not expanded into a claim of zero mixing. Modern oceanography explains why water masses may remain distinguishable: salinity and temperature affect density, while flow and turbulence govern exchange. It does not confirm an invisible wall that prevents their molecules from mixing.";
    section(draft, "conclusion").body =
      "The Quran draws attention to meeting waters as signs within creation. Modern science confirms that fronts, plumes, and stratified layers are real, while also showing that the waters continuously mix. The most defensible comparison preserves both facts: a boundary can be meaningful and persistent without being impermeable. Claims that the Quran says fresh and salt water never mix should therefore be removed.";
  });

  update("mountains", ["sections"], (draft) => {
    section(draft, "intro").body =
      "The Quran describes mountains with images such as 'pegs' and says that mountains were cast into the earth lest it should shift with people. Biblical poetry likewise depicts mountains as ancient, enduring, or foundational features of the created order. These are important theological and literary images, but they should not be turned into the modern geological claim that mountain ranges stop tectonic movement or stabilize the planet.\n\nModern geology explains mountains through plate collision, subduction, volcanism, faulting, uplift, and erosion. Many major mountain belts are located precisely where crustal deformation and earthquakes are concentrated. This article therefore distinguishes scriptural imagery, premodern interpretation, and present geological knowledge.";
    section(draft, "geological-reality").body =
      "Mountain ranges form through active geological processes. Continental collision thickens and folds crust; subduction produces volcanic arcs; faulting uplifts blocks; and erosion reshapes the resulting relief. Thickened continental crust commonly extends downward beneath high ranges as an isostatic root, but that root is a consequence of crustal buoyancy and mountain building, not a peg that fixes a tectonic plate in place.\n\nMountains do not prevent earthquakes or stop the crust from moving. The Himalayas, Andes, Alps, and many island arcs lie along active plate boundaries, and the stresses that build mountains also generate major earthquakes and volcanism. Isostasy describes gravitational adjustment of the lithosphere, not a mechanism by which mountains hold the entire earth still.\n\nMountains nevertheless have important environmental effects. They redirect atmospheric circulation, influence rainfall and rain shadows, store snow and ice, feed rivers, expose diverse rocks and minerals, and create habitats. These contributions to climate and habitability are scientifically defensible but should not be confused with planetary mechanical stabilization.";
    section(draft, "scholarly-consensus").body =
      "Interpreters broadly agree that scriptural mountain language is theological and rhetorically powerful rather than a technical account of plate tectonics. They disagree over whether particular images also anticipate modern findings. A careful compatibility reading may compare 'pegs' with the unseen depth of mountain roots as an analogy, while acknowledging that the texts do not describe isostasy and that roots do not stop tectonic motion.\n\nThe stronger claim that modern geology confirms mountains as stabilizers is not supportable. Geological evidence instead associates many mountain belts with ongoing deformation. Theological meaning does not depend on making that scientific claim.";
    section(draft, "broader-context").body =
      "Within both traditions, mountains primarily function as signs of divine power, locations of revelation, images of endurance, and features of a world ordered for life. Their effects on water, climate, landscape, and ecosystems can be discussed accurately. Their theological role is independent of the mistaken idea that they mechanically keep Earth's crust from moving.";
  });

  update("cosmology", ["summary", "seo", "sections", "faq"], (draft) => {
    draft.summary = draft.summary
      .replace("the Quran's description of cosmic expansion", "one interpretation of the Quran's language about divine vastness or expansion")
      .replace("align with", "are compared with");
    section(draft, "big-bang-connection").body =
      "Quran 21:30 describes the heavens and earth as a joined entity (*ratq*) that God separated (*fataq*). Modern writers sometimes compare this language with the Big Bang. The comparison is possible as a theological analogy, but the verse does not state the equations, chronology, hot plasma state, nucleosynthesis, or observational evidence that define modern cosmology. Classical exegetes offered meanings such as the sky and earth being joined before separation or the sky withholding rain and earth withholding vegetation before God opened them.\n\nThe standard cosmological model is supported by expansion, the cosmic microwave background, and primordial-element abundances. It reconstructs an early hot, dense universe and its subsequent evolution. Extrapolating classical general relativity backward produces a singular boundary in simple models, but that does not amount to an experimentally demonstrated physical singularity or a settled account of an absolute beginning; quantum-gravity proposals remain open.\n\nThe safest conclusion is that 21:30 can resonate with a universe that has a physical history and develops from an earlier joined condition, while it should not be presented as a technical prediction of Big Bang cosmology.";
    section(draft, "expansion-universe").body =
      "Quran 51:47 says that God built the heaven with power and uses the participle *musi'un*. Saheeh International renders it 'We are [its] expander,' while other translators and lexicographers understand divine vastness, ample power, or making the heaven vast. The grammar permits discussion of expansion, but the modern cosmological reading is not the only established translation and was not the dominant technical reading of premodern exegesis.\n\nModern cosmic expansion means that large-scale distances encoded by the metric of space increase over time; it is not simply the statement that the sky is broad. The verse may be read by believers as compatible with that discovery, but the article should say 'a possible modern resonance,' not that the Quran unambiguously teaches Hubble expansion.";
    section(draft, "biblical-scientific").body =
      "Genesis presents an ordered creation in ancient literary and conceptual language. The Hebrew *raqia* is commonly translated 'expanse' or 'firmament' and belongs to debates about ancient understandings of the sky; it should not be presented as a reference to modern cosmic expansion. Scholars also debate how rigidly to reconstruct one universal ancient Near Eastern model from varied texts.\n\nContemporary Christians relate Genesis to science through young-earth, old-earth, framework, analogical-day, and evolutionary-creation readings. The scientific question and the hermeneutical question should be distinguished: modern cosmology describes physical development, while Genesis makes theological claims about God, order, dependence, and human vocation.";
    section(draft, "scholarly-perspectives").body =
      "There is no measured 'scholarly consensus' that the Quran or Bible agrees with Big Bang cosmology in a technical sense. Muslim and Christian scholars range from scientific-miracle readings to literary and historical readings that resist such correlations. Cosmologists likewise do not decide scriptural interpretation as part of their scientific work.\n\nA responsible comparison distinguishes compatibility from prediction. A verse can be compatible with modern science without encoding the modern model, and a theological doctrine of creation can coexist with more than one physical model. Claims about a beginning, purpose, or divine agency also go beyond what observations alone establish.";
    section(draft, "conclusion").body =
      "Modern evidence supports an expanding universe that evolved from an early hot, dense state about 13.8 billion years ago. Whether physics ultimately describes an absolute beginning, a bounce, or another quantum-gravitational boundary remains unsettled.\n\nQuran 21:30 and 51:47 can be read as theologically compatible with an evolving and expanding cosmos, but neither passage supplies the technical Big Bang model, and the translation of *musi'un* is debated. Genesis likewise affirms creation and order without describing Hubble expansion. The strongest conclusion is therefore modest: the scriptures can be interpreted alongside modern cosmology, while claims of prediction or universal scholarly agreement exceed the evidence.";
  });
}

function applyTransmissionAndEthicsCorrections() {
  update("uthmanic-standardization", ["summary", "sections"], (draft) => {
    draft.summary =
      "Around the middle of the seventh century, Caliph Uthman commissioned standard codices from the sheets kept by Hafsa and distributed them to regional centers, ordering other Quranic materials withdrawn. The project anchored public recitation in a shared written archetype, while small regional rasm differences and transmitted qira'at remained part of the textual history.";
    section(draft, "historical-context").body =
      "The principal Sunni report is Sahih al-Bukhari 4987. It says that Hudhayfah, alarmed by recitation disputes during campaigns in Armenia and Azerbaijan, urged Uthman to act. Uthman requested the sheets kept by Hafsa and appointed Zayd ibn Thabit with Abdullah ibn al-Zubayr, Said ibn al-As, and Abd al-Rahman ibn al-Harith to copy them. If the Qurashi members disagreed with Zayd over wording or writing, Uthman told them to write it in the dialect of Quraysh. The report then says copies were sent to the provinces and other Quranic sheets or codices were burned.\n\nThat report does not itself name every destination, say that each copy traveled with a designated reciter, or reduce every earlier companion-codex difference to spelling. Later Muslim historical and rasm literature supplies additional regional details, but those details should be cited separately rather than placed inside Bukhari's account.\n\nManuscript and rasm studies strongly support descent of the standard text from an early written archetype and identify regional branches associated with Uthmanic codices. They also document a small number of consonantal or orthographic differences among those regional exemplars. These variants are minor compared with the text as a whole, but they make 'perfectly identical copies' too strong.\n\nThe standardization constrained public written transmission; it did not abolish all recitational variation. Canonical qira'at later preserved differences in pronunciation and, in a minority of cases, word form within the accepted Uthmanic rasm tradition.";
    section(draft, "comparison").body =
      "The Quranic and Biblical textual histories differ, but the contrast should be stated without absolutes. The Uthmanic project was an early state-sponsored standardization tied by Muslim reports to named participants and Hafsa's sheets. Surviving manuscripts support a remarkably stable early written archetype, alongside small regional rasm variants and the continued history of qira'at.\n\nThe Bible developed through multiple authors, textual traditions, languages, regions, and gradually recognized canons. Its larger manuscript tradition preserves many variants that textual critics compare. This does not mean the Quran has no variants or that the Bible is unrecoverable; it means their corpora, standardization events, and modes of transmission have different shapes.\n\nA fair comparison asks what kind of variation exists, how early the witnesses are, and how each tradition identified authoritative readings. It should not contrast an absolutely variant-free Quran with an irredeemably unstable Bible.";
    section(draft, "faq").body =
      "Q: Did Uthman change the wording of the Quran?\nA: Bukhari 4987 presents the project as copying Hafsa's existing sheets to resolve public recitation disputes, not composing a new revelation. Historical analysis strongly supports an early common written archetype, while the report and manuscript evidence still require careful discussion of companion codices, small regional rasm differences, and qira'at.\n\nQ: Why were other materials burned?\nA: Bukhari 4987 says Uthman ordered other Quranic materials destroyed after distributing the official codices. In the traditional account this removed sources of communal dispute; historians also recognize that the action canonized one written tradition over other companion materials.\n\nQ: Were all regional copies letter-for-letter identical?\nA: No absolute claim is necessary. Rasm literature and early manuscripts preserve a small number of regional consonantal or orthographic differences while also supporting descent from a common written archetype.\n\nQ: Do the qira'at contradict standardization?\nA: They show that standardization did not eliminate all authorized recitational variation. The canonical readings operate within the Uthmanic written tradition and are transmitted through named reading schools.\n\nQ: Is this identical to the history of the Biblical canon?\nA: No. The corpora and institutional histories differ substantially, but both should be described using the same evidential standards rather than slogans.";
  });

  update("written-compilation-of-the-quran", ["sections"], (draft) => {
    section(draft, "historical-context").body =
      "Muhammad died in 632 CE. During the Ridda wars, the Battle of Yamama killed a number of Quran reciters. In Sahih al-Bukhari 4986, Umar urges Abu Bakr to commission a collection because further deaths might result in loss. Abu Bakr appoints Zayd ibn Thabit, who says he gathered the Quran from written materials and from people's memories. The report says the resulting sheets passed from Abu Bakr to Umar and then to Hafsa.\n\nBukhari 4986 does not straightforwardly state the often-repeated rule that every verse had to be supported by exactly two independent forms of evidence. Other reports and later scholarly reconstructions discuss witnesses and verification procedures, but the article should attribute those details rather than turn them into the explicit wording of Bukhari. The strongest conclusion from the main report is that Zayd used both written remains and living recitation in a careful collection process.\n\nThe report also says Zayd found the final verses of Surat al-Tawbah with Abu Khuzaymah al-Ansari. This does not mean no one else knew or memorized the verses; the narration concerns locating the required written material during the collection. Different reports use the names Khuzaymah and Abu Khuzaymah, so the identification and the precise evidentiary rule should be handled cautiously.\n\nThe sheets were later requested by Uthman for the standardization described in Bukhari 4987. The two reports distinguish collection under Abu Bakr from copying and regional distribution under Uthman.";
    section(draft, "common-misconceptions").body =
      "'Zayd relied on memory alone.' Bukhari 4986 describes collection from written materials and from people who had learned the Quran.\n\n'Bukhari explicitly says every verse required two written witnesses plus two memorizers.' The main report does not state that formula. Later reports and scholarly explanations of the verification procedure must be cited on their own terms.\n\n'The last verses of al-Tawbah were known to only one person.' Bukhari's statement concerns where Zayd located the written passage during his collection, not whether the verses existed in only one person's memory.\n\n'Compilation means composition.' The traditional account describes gathering and checking material treated as already revealed and recited, not authoring new passages.";
  });

  update("terrorism-and-extremism-islamic-perspective", ["sections", "faq"], (draft) => {
    const kindness = section(draft, "kindness-non-combatants");
    kindness.body = replaceParagraph(
      kindness.body,
      "no good emerges from violence",
      "The tradition also praises gentleness without inventing a rule in the Prophet's name. Sahih Muslim 2594a reports: 'Gentleness is not found in anything except that it beautifies it, and it is not withdrawn from anything except that it makes it defective.' This ethical preference supports reconciliation and restraint, while questions about when force is lawful still belong to the separate jurisprudence of war, policing, and self-defense.",
      draft.slug,
    );
    const warfare = section(draft, "legitimate-warfare-conditions");
    warfare.title = "Classical Rules of Warfare and the Modern Defensive-War Position";
    warfare.body =
      "Quran 2:190 commands fighting those who fight while forbidding transgression. Modern Muslim writers frequently build a defensive theory of war from this verse, Quran 22:39-40, treaty obligations, and the protection of noncombatants. That is an important contemporary position, but it should not be projected backward as the only doctrine in classical law.\n\nClassical Sunni jurists agreed that private persons could not simply declare unrestricted violence and that warfare belonged to public authority. They developed rules governing treaties, safe-conduct, protected persons, property, and categories of combatants. They nevertheless differed over the grounds and aims of jihad, and major premodern schools allowed forms of state-led offensive warfare under conditions that modern defensive-only theories reject or reinterpret.\n\nThis historical complexity does not provide a defense of terrorism. Secret or non-state attacks deliberately directed at civilians do not become lawful because classical jurists discussed offensive war between polities. The relevant modern judgment must distinguish jus ad bellum questions, conduct during war, rebellion, banditry, murder, and terrorism rather than treating them as one category.\n\nClaims of consensus should therefore be narrow: contemporary Muslim institutions overwhelmingly condemn intentional attacks on civilians, while the broader history of Islamic war law contains genuine disagreements that must be acknowledged.";
    const corruption = section(draft, "corruption-earth");
    corruption.body =
      "The Quran condemns *fasad fi al-ard*, corruption or destructive disorder in the land, in several contexts. Islamic legal writing also developed the category of *hirabah*, often associated with armed banditry, violent robbery, terrorizing roads, or attacks that destroy public security. The two terms overlap in some interpretation but are not a single timeless technical definition of modern terrorism.\n\nJurists differed over whether hirabah required taking property, occurred only outside cities, included murder without robbery, or extended to organized intimidation. Modern scholars sometimes apply the category analogically to terrorist violence because deliberate attacks on civilians spread fear and assault public security. That application should be presented as legal reasoning from a varied premodern category, not as a precise classical definition written for modern terrorism.\n\nQuran 5:33 also carries severe penalties and therefore demands careful legal context. It cannot be turned into authorization for vigilante punishment; classical adjudication belonged to recognized courts and authorities and was surrounded by evidentiary and interpretive rules.";
    const faq = draft.faq.find((item) => item.question.includes("How does Islamic law prohibit terrorism"));
    if (faq) {
      faq.answer =
        "Islamic arguments against terrorism draw on the sanctity of life, protection of noncombatants, treaty obligations, the prohibition of private vigilantism, and rules limiting the use of force. Classical schools did not reduce all lawful war to defense, so that broader history must be stated honestly. It still does not authorize non-state groups to murder civilians or disregard public authority and the law of armed conflict.";
    }
  });

  update("early-islamic-preservation", ["sections"], (draft) => {
    section(draft, "intro").body =
      "Every religious tradition faces the problem of preserving teachings across generations. Early Muslims used overlapping oral and written practices: memorized recitation and teaching, personal notebooks, letters, legal documents, and gradually expanding collections. Large canonical Sunni hadith compilations reached their mature form in the third Islamic century, but writing did not begin only then.\n\nThe Quranic commands to follow the Prophet gave preservation of his example theological importance. Hadith transmission consequently developed isnad criticism, transmitter biography, comparison of variants, and classification of reports. These methods were unusually elaborate, while their effectiveness and the dating of particular reports remain subjects of debate between traditional hadith scholarship and modern historical criticism.";
    section(draft, "companions-oral-period").body =
      "During Muhammad's lifetime and the first generations, teaching was strongly oral but not purely oral. Companions memorized and repeated reports, and some also wrote personal sahifah collections, letters, and legal instructions. Restrictions reported about writing hadith coexisted with permissions and actual written records, and scholars debate their chronology and scope.\n\nOral study circles created teacher-to-student chains, while written notes could support memory and later compilation. The named isnad became increasingly central as communities demanded provenance for disputed reports. It is safer to describe a mixed transmission culture that became progressively systematized than an unwritten era followed centuries later by writing.";
    section(draft, "major-collections").body =
      "Hadith writing and collection developed in stages. Early notebooks and first- and second-century compilations preceded the large third-century canonical works. Malik's *Muwatta*, the *Musannaf* works of Abd al-Razzaq and Ibn Abi Shaybah, and other collections show substantial written organization before Bukhari and Muslim.\n\nAl-Bukhari and Muslim produced selective collections in the ninth century CE using demanding isnad and comparison criteria. Their works became the two most authoritative Sunni compilations, followed in the conventional Six Books by Abu Dawud, al-Tirmidhi, al-Nasa'i, and Ibn Majah. Canonical status itself developed through later scholarly reception; the books did not instantly become a fixed canon on publication.\n\nTraditional numbers about how many reports a compiler examined often count multiple chains and repeated versions, not hundreds of thousands of wholly different sayings. They should be explained rather than used as a simple measure of rejection rates.";
    section(draft, "comparison-biblical").body =
      "Islamic hadith and New Testament transmission preserve different kinds of material through different institutions. Hadith reports foreground named transmitter chains and later critical classifications. New Testament textual criticism compares a large manuscript tradition, ancient translations, and patristic quotations.\n\nApproximately 5,800 Greek New Testament manuscripts or fragments are often cited, but that is a total across antiquity and the medieval period, not a collection of 5,800 early witnesses. Only a small fraction are papyri from the first several centuries, while most surviving Greek copies are much later. The large total still matters for textual comparison, but it must not be mislabeled.\n\nNeither tradition used only one mechanism. Early Christians also taught orally, and Muslims also wrote. A fair comparison evaluates date, independence, provenance, copying, communal use, and critical methods rather than contrasting an exclusively oral Islam with an exclusively written Christianity.";
    section(draft, "conclusion").body =
      "Islamic hadith preservation developed an extensive culture of named transmission, biographical evaluation, comparison, and written compilation. Its scale and sophistication are historically important without needing the unsupported superlative 'unprecedented.' Early notebooks and compilations also correct the impression that writing began only centuries after Muhammad.\n\nThe system did not eliminate disagreement: Muslim critics graded reports differently, and modern historians continue to debate how far isnads can establish first-century origins. The responsible conclusion recognizes both the richness of the evidence and its methodological limits.";
  });

  update("embryology", ["sections"], (draft) => {
    section(draft, "muslim-interpretation").body =
      "A prominent modern *scientific i'jaz* literature maps Quranic terms such as *nutfah*, *alaqah*, and *mudghah* onto stages described by contemporary embryology. This approach is popular in apologetic preaching and among some Muslim physicians and writers, but it should not be called the single mainstream position of Islamic scholarship. Muslim scholars also offer literary, theological, premodern medical, and critical readings.\n\nSome comparisons are intuitively suggestive: *nutfah* denotes a small quantity of fluid, *alaqah* has a semantic range involving clinging or a clot-like substance, and *mudghah* evokes something chewed. The terms are broad, however, and translating them with modern technical labels can import knowledge not contained in the Arabic itself.\n\nThe theological force of the passages does not depend on a claim of scientific novelty. They direct attention to dependence, development, resurrection, and divine power using language accessible to their first hearers.";
    section(draft, "ancient-medical-context").body =
      "Greek medical writers, especially Hippocrates, Aristotle, and Galen, described staged generation using male and female contributions, blood, flesh, and bone. Their works circulated through Greek, Syriac, Persian, and later Arabic scholarly networks. Similarities between some ancient stage schemes and later Quranic interpretation are therefore historically relevant.\n\nWhat is much harder to demonstrate is the exact route by which a particular Galenic scheme reached the Hijaz before or during Muhammad's lifetime. Contacts between Arabia and neighboring learned cultures make transmission possible, but the evidence does not justify the categorical phrase 'pre-Islamic Arabian medical thought' unless a specific Arabian source is cited. Similarity alone cannot decide direct borrowing, shared observation, or later interpretive convergence.";
    section(draft, "scholarly-critique").body =
      "Critics argue that the Quranic terms are nontechnical and flexible enough to be aligned retrospectively with more than one biological scheme. The problem should not be framed as the words being deliberately vague, which assigns an unverifiable motive. The defensible observation is that their semantic range is broader than modern embryological terminology.\n\nModern embryology also does not describe a simple sequence in which a complete skeleton forms first and is only afterward covered with flesh; tissues differentiate through overlapping processes. Translating Quran 23:14 as a modern laboratory sequence therefore requires interpretive qualification.\n\nClassical exegetes did interpret the verses as fetal development in the medical and observational categories available to them. What they did not do was map the words to modern cell biology, implantation science, or Carnegie stages. Saying they offered no embryological interpretation at all is incorrect.";
    section(draft, "claims-summary").body =
      "The Quran describes human development through a memorable sequence of fluid, clinging or clot-like material, a chewed-like lump, bones, flesh, and a further creation. Premodern commentators treated this as fetal development and moral proof of creation and resurrection. Modern scientific-miracle writers identify detailed correspondences with embryology; critics answer that the broad terms and overlapping biological processes do not sustain claims of technical prediction.\n\nThe strongest shared conclusion is modest: the passages speak meaningfully about staged human development in premodern language. Whether their correspondence with modern science is miraculous is a theological and interpretive judgment, not a result established by embryology alone.";
  });

  update("strong-vs-debated-scientific-claims", ["sections"], (draft) => {
    section(draft, "mountains-stabilizers").body =
      "Quranic descriptions of mountains as pegs and as features connected with the earth not shifting are theologically and poetically significant, but a literal claim that mountain ranges stop tectonic motion is not supported by geology. Mountains commonly form through collision, subduction, uplift, and faulting, and many lie in highly seismic zones.\n\nIsostatic roots beneath ranges can be compared visually with pegs, but they are consequences of crustal thickness and buoyancy rather than anchors that immobilize plates. This claim therefore belongs in the disputed category unless 'stability' is explicitly limited to nontechnical meanings such as durable landscape, environmental influence, or habitability.";
    section(draft, "jonah-whale").body =
      "Known human physiology provides no natural mechanism for surviving for an extended period inside a large marine animal. The scriptural narratives present Jonah's rescue as an extraordinary divine act, not as an ordinary biological process. Science can assess natural survivability and find it implausible; it cannot experimentally rule on a singular miracle defined as divine intervention.\n\nThe article should therefore distinguish two claims: survival by unaided normal physiology conflicts with current biological knowledge, while miraculous rescue lies outside a testable natural mechanism.";
    section(draft, "molten-sea-pi").body =
      "First Kings 7:23 gives a diameter of ten cubits and a circumference of thirty, yielding three if both numbers are treated as exact measurements of the same circular line. That is less precise than pi. The text, however, uses whole cubits in an architectural description and also describes a thick rim. Rounding or measuring diameter and circumference at different parts of the vessel can reduce or remove the apparent discrepancy.\n\nIt is therefore fair to call the verse numerically approximate, but too strong to say it demonstrates that the author believed the mathematical constant was exactly three.";
    section(draft, "molten-sea-pushback").body =
      "The dimensions do not support claims of hidden mathematical precision, but neither do they establish a major scientific contradiction. Ancient architectural measurements are commonly rounded, and the vessel's thickness creates more than one possible diameter. The honest classification is a low-precision numerical description whose exact geometry cannot be reconstructed from the verse alone.";
    section(draft, "fetal-development-pushback").body =
      "The Quranic terms describe recognizable stages at a broad observational level, but they are not equivalent to modern embryological staging. Bone, cartilage, muscle, and connective tissue develop through overlapping processes. Scientific-miracle claims should therefore be presented as interpretive correspondences rather than exact technical sequence.\n\nA separate hadith discussion is sometimes summarized as 'ensoulment at 120 days,' commonly based on Sahih al-Bukhari 3208 and Sahih Muslim 2643a. Jurists and hadith commentators differ over how the three forty-day phrases are related and how they interact with other reports. The 120-day formulation is influential in law and ethics but should not be presented as an uncontested biological finding or the only Islamic interpretation.";
    section(draft, "conclusion").body =
      "Scientific comparison is strongest when it distinguishes ordinary observation, broad compatibility, disputed modern correlation, and genuine tension. Water-cycle imagery and life's dependence on water are compatible with science without being uniquely modern discoveries. Cosmic expansion and embryological mappings remain interpretation-dependent. Mountains as literal tectonic stabilizers are not confirmed by geology. The Molten Sea dimensions are approximate rather than a decisive mathematical contradiction, and Jonah's survival is a miracle claim rather than a natural mechanism.\n\nScripture need not function as a science textbook to carry theological meaning. Accuracy improves when the article resists both forced miracle claims and exaggerated conflict claims.";
  });
}

function applyInterpretiveCorrections() {
  update("celestial-signs-in-the-quran", ["sections"], (draft) => {
    const orbits = section(draft, "orbits-swimming");
    orbits.body = replaceParagraph(
      orbits.body,
      "universal in their era",
      "Geocentric astronomy was dominant across late antique and medieval learned traditions, but it was not literally universal or intellectually static. A small number of ancient and medieval thinkers discussed Earth's rotation, and later Islamic astronomers critically revised Ptolemaic devices even while usually retaining geocentrism. The Quranic image of celestial bodies swimming in an orbit is compatible with observed regular motion, but it does not by itself choose between geocentric and heliocentric models.",
      draft.slug,
    );
    const plants = section(draft, "pairs-in-plants");
    plants.body = replaceParagraph(
      plants.body,
      "Assyrian",
      "Ancient Near Eastern reliefs are sometimes interpreted as showing artificial pollination of date palms, but the scenes may also carry ritual or royal symbolism and their precise action is debated. They can support the general point that people long understood practical differences between productive palms, but they should not be treated as an uncontested visual record of botanical theory without a specialist archaeological citation.",
      draft.slug,
    );
  });

  update("the-divinity-verses-examined", ["sections"], (draft) => {
    const method = section(draft, "method");
    method.body = method.body.replace(
      "Where the grammar is genuinely close to a coin flip among neutral specialists — as with the theological implications of the qualitative reading at John 1:1, or the sense of harpagmos in Philippians 2:6 — this article says that too.",
      "Where a construction permits more than one defensible analysis — as with the sense of harpagmos in Philippians 2:6 — this article identifies the alternatives without implying an unsupported numerical division among specialists.",
    );
    section(draft, "john-1-1").body =
      "John 1:1 places *theos* without the article before the verb in the clause commonly translated 'the Word was God.' The construction is often described as qualitative: it characterizes what the Word was, rather than saying that the Word was the same person as 'the God' mentioned in the preceding clause.\n\nA qualitative reading is not, however, close to a neutral scholarly coin flip between full deity and a merely godlike creature. Mainstream Johannine and Koine scholarship commonly understands the clause as attributing divine nature or quality to the Word while preserving a personal distinction from the Father. Translations such as 'what God was, the Word was' express that qualitative force without reducing it to a created agent.\n\nUnitarian interpreters may argue that agency language, wisdom traditions, and the Gospel's subordination sayings permit a lesser sense. That is a real theological reading, but it should be identified as a minority inference rather than represented as one half of an even specialist division. The verse remains one of the strongest New Testament texts used in high Christology.";
    section(draft, "john-10-30").body =
      "In John 10:30 Jesus says, 'I and the Father are one.' The neuter form *hen* does not mean they are one person. Trinitarian interpreters understand unity of power, action, and divine identity in the context of Jesus giving eternal life and preserving the sheep. John 17's prayer that disciples be one shows that the same word can express relational unity, but it does not by itself prove that every use has the same depth.\n\nThe appeal to Psalm 82 in John 10:34-36 is likewise debated. Some interpreters see Jesus answering a charge of blasphemy from the lesser-to-greater logic of scripture; others see the passage reinforcing the unique consecration and sending of the Son. A strictly functional or merely human-agent reading exists, but it should not be called equally representative of mainstream Johannine scholarship without evidence.";
  });

  update("did-anyone-see-god", ["sections", "faq"], (draft) => {
    const quran = section(draft, "quranic-perspective");
    quran.body = replaceParagraph(
      quran.body,
      "majority Sunni position",
      "Islamic theology debated whether the impossibility of seeing God in this life also applies to the Hereafter. The mainstream Sunni creed affirms that believers will see their Lord in Paradise, citing Quran 75:22-23 and narrations such as Sahih al-Bukhari 7434 and Sahih Muslim 182a, which compare the clarity of the vision to seeing the full moon without crowding. Sunni theologians affirm the vision without likeness or comprehension. Mu'tazili theologians historically denied any visual perception of God, arguing that it would imply direction or embodiment, and interpreted the relevant verses differently. This is therefore a real dispute in the broader history of Islamic theology, but not an unresolved question inside mainstream Sunni creed.",
      draft.slug,
    );
    const comparison = section(draft, "comparison");
    comparison.body = comparison.body.replace(
      "though this is contested within Islamic scholarship itself by the historic Mu‘tazila position",
      "while the historic Mu'tazila rejected that doctrine",
    );
    const misconception = section(draft, "common-misconceptions");
    misconception.body = misconception.body.replace(
      "This is not a settled or unanimous Islamic position. The majority Sunni view affirms",
      "Mainstream Sunni creed affirms",
    );
    const visionFaq = draft.faq.find((item) => item.question.includes("Will believers ever see God"));
    if (!visionFaq) throw new Error(draft.slug + ": vision FAQ not found");
    visionFaq.answer =
      "Mainstream Sunni theology says yes, citing Quran 75:22-23 and hadith such as Sahih al-Bukhari 7434 and Sahih Muslim 182a. The vision is affirmed without likeness or encompassing God's essence. The historic Mu'tazila denied visual perception of God, so the wider history of Islamic theology contains disagreement even though the affirmative view is settled Sunni creed.";
    const faqSection = section(draft, "faq");
    faqSection.body = replaceParagraph(
      faqSection.body,
      "Q: Will believers ever see God",
      "Q: Will believers ever see God, according to Islam?\nA: Mainstream Sunni theology says yes, citing Quran 75:22-23 and hadith such as Sahih al-Bukhari 7434 and Sahih Muslim 182a. The vision is affirmed without likeness or encompassing God's essence. The historic Mu'tazila denied visual perception of God, so the wider history of Islamic theology contains disagreement even though the affirmative view is settled Sunni creed.",
      draft.slug,
    );
  });

  update("end-times-beliefs", ["sections"], (draft) => {
    section(draft, "signs-of-the-hour").body =
      "Islamic hadith literature contains extensive accounts of signs preceding the Hour, but each sign should be tied to an exact report rather than attributed vaguely to 'the hadith.' Sahih Muslim 2901a lists ten major signs, including the Dajjal, the beast, Gog and Magog, the rising of the sun from the west, three major landslides, smoke, the descent of Jesus, and a fire driving people to assembly. Individual reports supply further detail and are interpreted with differing degrees of literalism.\n\nSahih Muslim 2937a gives an extended account of the Dajjal, Jesus' descent and defeat of him, and the release of Gog and Magog. Quranic passages independently mention Gog and Magog and the beast but do not contain the full later hadith chronology.\n\nThe Trumpet is Quranic, while identifying the angel who blows it as Israfil depends on later reports and interpretive tradition. The article should keep Quranic statements, authenticated hadith, and later synthesis visibly separate.";
    section(draft, "jesus-isa-islamic-eschatology").body =
      "Mainstream Islamic eschatology expects the personal return of Jesus. Sahih al-Bukhari 2476 says that the son of Mary will descend as a just ruler, break the cross, kill swine, and abolish jizya. The report describes concrete actions; interpreting the breaking of the cross as the ending of false beliefs about Jesus is a theological explanation of the action, not a replacement for its wording.\n\nSahih Muslim 2937a places Jesus' descent within the Dajjal narrative and describes him defeating the deceiver. Other reports and later syntheses discuss the duration of his life, peace, abundance, and death. These details should be sourced individually because they do not all occur in one narration.\n\nThe Quranic basis is briefer and interpretive. Classical commentators often connect Quran 4:159 and 43:61 with Jesus' future return, while the detailed sequence comes from hadith. Islam understands the return as vindicating Jesus as Messiah and human messenger, not as God incarnate.";
  });

  update("womens-worth-classical-voices", ["sections", "furtherReading"], (draft) => {
    const islamic = section(draft, "islamic-tradition-honesty");
    islamic.body = islamic.body.replace(
      "Mainstream Muslim scholarship has never denied this hadith's authenticity",
      "Canonical Sunni hadith scholarship has generally accepted this report's authenticity, while some modern Muslim hadith-critical and feminist scholars have challenged its transmission, scope, or interpretation",
    );
    islamic.body = islamic.body.replace(
      "Canonical Sunni hadith scholarship has generally accepted this report's authenticity, while some modern Muslim hadith-critical and feminist scholars have challenged its transmission, scope, or interpretation;",
      "Canonical Sunni hadith scholarship has generally accepted this report's authenticity (Sahih al-Bukhari 304), while some modern Muslim hadith-critical and feminist scholars have challenged its transmission, scope, or interpretation;",
    );
    islamic.body = islamic.body.replace(
      /al-Nawawi on the parallel report in Sahih Muslim(?: 79a)*/,
      "al-Nawawi on the parallel report in Sahih Muslim 79a",
    );
    const article = draft.furtherReading.find((item) => item.title.includes("Misbegotten"));
    if (article) Object.assign(article, {
      type: "journalArticle",
      journal: "Priscilla Papers",
      volume: "38",
      issue: "4",
      year: 2024,
      pages: "5-8",
      url: "https://www.cbeinternational.org/wp-content/uploads/2024/10/Thomas-Aquinass-Misbegotten-Concept-of-Women.pdf",
    });
  });

  update("early-christianity", ["sections"], (draft) => {
    for (const item of draft.sections) {
      item.body = item.body.replace(
        'Quran 2:87 states: "We gave Moses the Torah"',
        'Quran 2:87 states, in the cited Saheeh International translation: "We gave Moses the Scripture"',
      );
    }
  });
}

function applyHadithLocatorCorrections() {
  update("female-scholars-and-leaders", ["sections"], (draft) => {
    const objections = section(draft, "objections-and-restrictions");
    objections.body = objections.body.replace(
      "the hadith in Sahih Bukhari (Book of Menstruation)",
      "the hadith in Sahih al-Bukhari 304",
    );
  });

  update("jesus-as-messiah", ["sections", "faq"], (draft) => {
    for (const item of draft.faq) {
      if (item.question.includes("false messiah")) {
        item.answer = item.answer.replace(
          "Narrations in Sahih al-Bukhari and Sahih Muslim",
          "Narrations including Sahih al-Bukhari 2476 and Sahih Muslim 2937a",
        );
      }
      if (item.question.includes("Messiah will return")) {
        item.answer =
          "Yes. Mainstream Islamic teaching connects Quran 4:159 and 43:61 with Jesus' return and relies on detailed reports including Sahih al-Bukhari 2476 and Sahih Muslim 2937a. The Quranic application is classical interpretation; the descent and Dajjal details come from hadith.";
      }
    }
    const faqSection = section(draft, "faq");
    faqSection.body = faqSection.body.replace(
      "Narrations in Sahih al-Bukhari and Sahih Muslim describe an end-times deceiver",
      "Reports including Sahih al-Bukhari 2476 and Sahih Muslim 2937a describe an end-times deceiver",
    );
    faqSection.body = faqSection.body.replace(
      "drawing on the Quran’s allusions and well-known narrations in the major hadith collections, holds that Jesus will return before the end of history",
      "connecting Quran 4:159 and 43:61 with reports including Sahih al-Bukhari 2476 and Sahih Muslim 2937a, holds that Jesus will return before the end of history",
    );
  });

  update("eve-in-islam-and-christianity", ["sections"], (draft) => {
    const inheritance = section(draft, "no-inherited-burden");
    inheritance.body = inheritance.body.replace(
      "a well-known hadith in Sahih al-Bukhari states that every child is born upon the fitra",
      "Sahih al-Bukhari 1385 states that every child is born upon the fitra",
    );
    const caveat = section(draft, "hadith-and-tafsir");
    caveat.body = caveat.body.replace(
      "A hadith in Sahih al-Bukhari (no. 3330; a close variant appears in Sahih Muslim) reads",
      "Sahih al-Bukhari 3330, with a close variant in Sahih Muslim 1470a, reads",
    );
  });

  update("pseudepigrapha-in-the-new-testament", ["sections"], (draft) => {
    const islamicLens = section(draft, "islamic-comparison");
    islamicLens.body = islamicLens.body.replace(
      /the compilation reports preserved in Sahih al-Bukhari(?: 4986 and 4987)*/,
      "the compilation reports preserved in Sahih al-Bukhari 4986 and 4987",
    );
  });

  update("marriage-and-divorce", ["sections"], (draft) => {
    const divorce = section(draft, "islamic-divorce");
    divorce.body = divorce.body.replace(
      "hadith collections in Abu Dawud and al-Tirmidhi report the Prophet cursing both the muhallil",
      "Jami at-Tirmidhi 1119 reports the Prophet cursing both the muhallil",
    );
    const age = section(draft, "marriage-age-consent");
    age.body = age.body.replace(
      "hadith reports in Sahih al-Bukhari and Sahih Muslim stating",
      "reports in Sahih al-Bukhari 5134 and Sahih Muslim 1422b stating",
    );
  });

  update("qiraat-explained-simply", ["sections"], (draft) => {
    const question = section(draft, "main-question");
    question.body = question.body.replace(
      "recorded in hadith collections such as Sahih al-Bukhari, describing",
      "including Sahih al-Bukhari 4992, describing",
    );
  });

  update("the-crucifixion-question", ["sections", "faq"], (draft) => {
    const quran = section(draft, "quranic-perspective");
    quran.body = quran.body.replace(
      "narrations in Sahih al-Bukhari and Sahih Muslim describe",
      "reports including Sahih al-Bukhari 2476 and Sahih Muslim 2937a describe",
    );
    for (const item of draft.faq) {
      item.answer = item.answer.replace(
        "narrations in Sahih al-Bukhari and Sahih Muslim",
        "reports including Sahih al-Bukhari 2476 and Sahih Muslim 2937a",
      );
    }
    const faqSection = section(draft, "faq");
    faqSection.body = faqSection.body.replace(
      "a hope described in narrations in Sahih al-Bukhari and Sahih Muslim",
      "a hope described in reports including Sahih al-Bukhari 2476 and Sahih Muslim 2937a",
    );
  });

  update("the-day-of-judgment", ["sections"], (draft) => {
    const misconceptions = section(draft, "common-misconceptions");
    misconceptions.body = misconceptions.body.replace(
      "Narrations in the major hadith collections describe the Prophet Muhammad teaching that no one enters Paradise by deeds alone, but only by God's mercy",
      "Sahih Muslim 2816c records the Prophet Muhammad teaching that no one's deeds alone entitle that person to Paradise, not even the Prophet, except through God's mercy",
    );
  });

  update("the-second-coming-of-jesus", ["sections", "faq"], (draft) => {
    const quran = section(draft, "quranic-perspective");
    quran.body =
      "What the Quran states briefly, the hadith literature fills out with individually identifiable reports. Sahih al-Bukhari 2476 describes the son of Mary descending as a just ruler, breaking the cross, killing swine, and abolishing jizya. Sahih Muslim 2937a places Jesus' descent in the extended account of the Dajjal and Gog and Magog and describes Jesus defeating the Dajjal.\n\nThese reports are described rather than quoted at length, but exact locators matter. Details about an era of peace, the length of Jesus' remaining life, marriage, death, or burial occur in different reports with different evaluations and should not be fused into one unnamed narration.\n\nThe reports of descent became settled mainstream Sunni doctrine and also appear in Shia eschatological expectation, though the surrounding accounts of the Mahdi and sequence of events differ.";
    const reading = section(draft, "further-reading");
    reading.body = reading.body.replace(
      "Muslim narrations were described, not quoted, in line with this library’s sourcing rules; readers can locate them in Sahih al-Bukhari and Sahih Muslim in the chapters on tribulations and the signs of the Hour.",
      "Muslim narrations are identified by exact locator, especially Sahih al-Bukhari 2476 and Sahih Muslim 2937a, so readers can check the wording and context directly.",
    );
    for (const item of draft.faq) {
      if (item.question.includes("really believe")) {
        item.answer = item.answer.replace(
          "numerous narrations in the most authenticated hadith collections",
          "reports including Sahih al-Bukhari 2476 and Sahih Muslim 2937a",
        );
      }
    }
  });

  update("how-was-the-quran-preserved", ["sections"], (draft) => {
    const history = section(draft, "historical-context");
    history.body = history.body
      .replace(
        "Hadith collections such as Sahih al-Bukhari also relate that the Prophet reviewed the revelation with the angel Gabriel every Ramadan, and twice in his final year.",
        "Sahih al-Bukhari 4998 relates that Gabriel reviewed the Quran with the Prophet once each year and twice in his final year.",
      )
      .replace(
        "According to the account preserved in Sahih al-Bukhari, after the Battle of Yamama",
        "According to Sahih al-Bukhari 4986, after the Battle of Yamama",
      );
    const readings = section(draft, "qiraat-canonical-readings");
    readings.body = readings.body.replace(
      "Hadith collections relate that the Quran was revealed in several modes (ahruf)",
      "Sahih al-Bukhari 4992 relates that the Quran was revealed in seven ahruf",
    );
  });

  update("was-the-quran-preserved", ["sections"], (draft) => {
    const history = section(draft, "historical-context");
    history.body = history.body.replace(
      "According to the standard accounts in the hadith literature",
      "According to Sahih al-Bukhari 4986 and 4987",
    );
    history.body = history.body.replace(
      "so that a single written standard would anchor public recitation everywhere. From then on, one consonantal skeleton — the Uthmanic rasm — underlay the Quran wherever Islam spread.",
      "so that an official written tradition would anchor public recitation. The resulting Uthmanic rasm is remarkably stable, while rasm literature and manuscripts also preserve a small number of regional orthographic or consonantal differences and the canonical qira'at preserve bounded recitational variation.",
    );
  });

  update("original-sin-vs-personal-responsibility", ["sections"], (draft) => {
    const quran = section(draft, "quranic-perspective");
    quran.body = quran.body.replace(
      "recorded in the hadith collections of al-Bukhari and Muslim",
      "recorded in Sahih al-Bukhari 1385 and Sahih Muslim 2658e",
    );
  });

  update("what-is-salvation", ["sections"], (draft) => {
    const misconceptions = section(draft, "common-misconceptions");
    misconceptions.body = misconceptions.body.replace(
      "Traditional Islamic teaching, reflected in narrations found in collections such as Sahih Muslim, describes God's mercy as vastly exceeding His wrath",
      "Traditional Islamic teaching includes Sahih Muslim 2751a, in which God's mercy predominates over His wrath",
    );
  });

  update("what-is-worship", ["sections"], (draft) => {
    const introduction = section(draft, "introduction");
    introduction.body = introduction.body.replace(
      "Narrations in the hadith literature, the recorded traditions of the Prophet Muhammad, describe him teaching his companions that even a smile shared with another person can count as an act of devotion when the intention behind it is right.",
      "Jami at-Tirmidhi 1956 reports the Prophet teaching that smiling in the face of one's brother is charity, alongside other ordinary acts of assistance.",
    );
  });
}

function applyBibliographyCorrections() {
  update("the-exodus-in-historical-context", ["furtherReading"], (draft) => {
    const source = draft.furtherReading.find((item) => item.title.includes("The Qur'an and the Bible"));
    if (!source) throw new Error(draft.slug + ": Reynolds source not found");
    Object.assign(source, {
      author: "Gabriel Said Reynolds; Quran translation by Ali Quli Qarai",
      type: "book",
      publisher: "Yale University Press",
      year: 2018,
      isbn: "9780300182224",
      url: "https://yalebooks.yale.edu/book/9780300182224/the-quran-and-the-bible/",
      note: "Comparative text and commentary on Quranic engagement with Biblical and post-Biblical traditions.",
    });
  });

  update("prophecies-about-jesus", ["furtherReading"], (draft) => {
    const servant = draft.furtherReading.find((item) => item.title.includes("Suffering Servant"));
    const introduction = draft.furtherReading.find((item) => item.title.includes("Introduction to the Old Testament"));
    if (!servant || !introduction) throw new Error(draft.slug + ": bibliography targets not found");
    Object.assign(servant, {
      title: "The Suffering Servant in Deutero-Isaiah: An Historical and Critical Study",
      author: "Christopher R. North",
      type: "book",
      publisher: "Oxford University Press",
      year: 1956,
      isbn: "9780198261315",
      note: "Historical-critical study of the servant passages and their major interpretive possibilities.",
    });
    Object.assign(introduction, {
      title: "An Introduction to the Old Testament: The Canon and Christian Imagination",
      author: "Walter Brueggemann",
      type: "book",
      publisher: "Westminster John Knox Press",
      year: 2003,
      isbn: "9780664224127",
      note: "A canonical and theological introduction to the Old Testament that situates prophetic literature within the wider corpus.",
    });
  });

  update("end-times-beliefs", ["furtherReading"], (draft) => {
    const source = draft.furtherReading.find(
      (item) => item.author === "Jamal Badawi" || item.author === "Neal Robinson",
    );
    if (!source) throw new Error(draft.slug + ": unverified Badawi source not found");
    Object.assign(source, {
      title: "Christ in Islam and Christianity: The Representation of Jesus in the Qur'an and the Classical Muslim Commentaries",
      author: "Neal Robinson",
      type: "book",
      publisher: "State University of New York Press",
      year: 1991,
      isbn: "9780791405581",
      note: "Academic study of Quranic and classical Muslim interpretations of Jesus, including his return, crucifixion, miracles, and birth.",
    });
  });

  update("possible-prophecies-about-muhammad", ["furtherReading"], (draft) => {
    const gospel = draft.furtherReading.find((item) => item.title.includes("Gospel") && item.title.includes("John"));
    if (!gospel) throw new Error(draft.slug + ": Gospel of John source not found");
    Object.assign(gospel, {
      title: "The Gospel According to John, World English Bible",
      author: "Anonymous; traditionally attributed to John",
      type: "primaryText",
      publisher: "World English Bible",
      url: "https://worldenglish.bible/",
      note: "Primary Biblical text used for the Paraclete passages; the specific public-domain translation is identified for reproducibility.",
    });
  });

  update("punishment-for-apostasy-and-war", ["furtherReading"], (draft) => {
    const article = draft.furtherReading.find((item) => item.author.includes("Rudolph Peters"));
    if (!article) throw new Error(draft.slug + ": Peters article not found");
    Object.assign(article, {
      type: "journalArticle",
      journal: "Die Welt des Islams",
      year: "1976-1977",
      volume: "17",
      issue: "1/4",
      pages: "1-25",
      doi: "10.2307/1570336",
      url: "https://doi.org/10.2307/1570336",
    });
  });
}

const explicitQuranReferences = {
  cosmology: ["Quran 18:86", "Quran 67:5", "Quran 37:6"],
  "council-of-nicaea": ["Quran 23:91", "Quran 4:171"],
  "development-of-trinity-doctrine": ["Quran 42:11"],
  "female-scholars-and-leaders": ["Quran 2:282", "Quran 4:34"],
  "how-to-approach-scientific-claims-carefully": ["Quran 18:86"],
  "incarnation-explained": ["Quran 3:45"],
  "marriage-and-divorce": ["Quran 4:129", "Quran 4:6"],
  "prophecies-about-jesus": ["Quran 4:157", "Quran 17:15"],
  "purpose-of-life": ["Quran 16:125"],
  "terrorism-and-extremism-islamic-perspective": ["Quran 2:190"],
  "what-is-a-contradiction": ["Quran 3:7"],
  "worshiping-god-alone": ["Quran 5:116"],
  "the-historical-jesus": ["Quran 4:171", "Quran 112:1", "Quran 112:2", "Quran 112:3"],
};

const explicitBibleReferences = {
  "can-god-become-man": ["Philippians 2:7"],
  "chronological-alignment-quranic-biblical-timelines": ["Acts 7:23", "Numbers 14:33-34", "Deuteronomy 8:2", "Exodus 12:40"],
  "civilian-protection-in-war": ["Leviticus 27:21"],
  "creation-and-nature": ["Proverbs 8:22-30", "John 1:3"],
  "did-anyone-see-god": ["Exodus 33:21-23", "Genesis 18:1", "John 1:17", "Numbers 12:8"],
  "did-prophets-teach-pure-monotheism": ["John 5:30", "John 14:28", "Philippians 2:7", "John 8:58", "John 10:30", "Colossians 1:15", "Hebrews 1:3", "John 16:13", "Acts 7:59", "Philippians 2:6-11"],
  "early-islamic-preservation": ["1 John 5:7-8", "John 7:53-8:11", "Mark 16:9-20", "1 Thessalonians 5:27"],
  "heaven-and-hell": ["2 Corinthians 12:2-4", "1 Corinthians 13:12"],
  "historical-support-for-biblical-narratives": ["1 Corinthians 15:8"],
  "how-to-approach-scientific-claims-carefully": ["Genesis 1:3"],
  "incarnation-explained": ["Philippians 2:7", "Colossians 1:17"],
  "inheritance-and-testimony": ["Luke 12:13-14", "Deuteronomy 21:17", "Deuteronomy 19:15-19", "1 Timothy 5:8"],
  "james-josephus-and-external-evidence": ["Genesis 13:8", "Colossians 4:10"],
  "judgment-day": ["1 Corinthians 15:52-53", "1 Corinthians 15:20-23", "1 John 1:9", "2 Corinthians 5:10", "Romans 14:12", "2 Corinthians 5:10-11", "Matthew 25:15", "1 Corinthians 3:15"],
  "modesty-and-dress": ["1 Timothy 2:11-15"],
  "possible-prophecies-about-muhammad": ["Deuteronomy 18:18", "Deuteronomy 18:18-19", "Deuteronomy 34:10-12", "Deuteronomy 34:10", "John 16:8-11", "Acts 3:22-26", "Deuteronomy 18:15", "Acts 2:1-4", "Acts 1:3"],
  "prophecies-about-jesus": ["Mark 14:27", "Luke 22:37"],
  "self-defense-in-scripture": ["Luke 22:37", "Isaiah 53:12", "Luke 22:38", "Luke 22:49-51", "Matthew 26:52"],
  "shirk-explained": ["Matthew 28:19-20", "John 10:30", "Matthew 28:19"],
  "strong-vs-debated-scientific-claims": ["2 Chronicles 4:2", "Leviticus 11:6", "Leviticus 11:20-23", "Leviticus 11:13-19", "Joshua 10:12-13", "1 Kings 7:26"],
  "textual-variants-explained": ["Mark 16:9", "John 7:53-8:11"],
  "the-crucifixion-and-history": ["Mark 16:9-20"],
  "the-day-of-judgment": ["Matthew 25:32", "Matthew 25:31"],
  "the-miracles-of-jesus": ["John 11:41", "John 11:42"],
  "the-miraculous-birth-of-jesus": ["Isaiah 7:14"],
  "the-timing-of-the-crucifixion": ["Mark 14:22-26", "Matthew 26:26-30", "1 Corinthians 15:4", "1 Corinthians 15:3-4"],
  "what-is-a-contradiction": ["1 Kings 22:19-23", "Genesis 50:20"],
  "what-is-the-trinity": ["1 John 5:7"],
  "when-was-deuteronomy-written": ["Genesis 12:6", "Genesis 22:14", "Deuteronomy 3:11"],
  "who-is-god-quran-and-bible-comparison": ["Exodus 34:6", "Exodus 34:7"],
  "women-in-the-quran-and-bible": ["1 Peter 3:7", "1 Corinthians 11:5", "Romans 16:7", "Ephesians 5:22-24"],
};

const bibleBooks = [
  "Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy", "Joshua", "Judges", "Ruth",
  "1 Samuel", "2 Samuel", "1 Kings", "2 Kings", "1 Chronicles", "2 Chronicles", "Ezra", "Nehemiah",
  "Esther", "Job", "Psalms", "Proverbs", "Ecclesiastes", "Song of Solomon", "Isaiah", "Jeremiah",
  "Lamentations", "Ezekiel", "Daniel", "Hosea", "Joel", "Amos", "Obadiah", "Jonah", "Micah",
  "Nahum", "Habakkuk", "Zephaniah", "Haggai", "Zechariah", "Malachi", "Matthew", "Mark", "Luke",
  "John", "Acts", "Romans", "1 Corinthians", "2 Corinthians", "Galatians", "Ephesians", "Philippians",
  "Colossians", "1 Thessalonians", "2 Thessalonians", "1 Timothy", "2 Timothy", "Titus", "Philemon",
  "Hebrews", "James", "1 Peter", "2 Peter", "1 John", "2 John", "3 John", "Jude", "Revelation",
];

function articleProse(draft) {
  return [
    draft.summary,
    ...draft.sections.map((item) => item.body),
    ...(draft.faq ?? []).flatMap((item) => [item.question, item.answer]),
  ].join("\n");
}

function detectedQuranReferences(draft) {
  const references = new Set(explicitQuranReferences[draft.slug] ?? []);
  const regex = /\b(?:Qur(?:an|['’]an)|Surah)\s+(\d{1,3}):(\d{1,3})\b/gi;
  for (const match of articleProse(draft).matchAll(regex)) {
    references.add("Quran " + Number(match[1]) + ":" + Number(match[2]));
  }
  return [...references];
}

function detectedBibleReferences(draft) {
  const references = new Set(explicitBibleReferences[draft.slug] ?? []);
  const escapedBooks = [...bibleBooks]
    .sort((a, b) => b.length - a.length)
    .map((book) => book.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const regex = new RegExp(
    "\\b(" + escapedBooks.join("|") + ")\\s+(\\d+):(\\d+(?:\\s*[-–]\\s*(?:(?:\\d+):)?\\d+)?)",
    "g",
  );
  for (const match of articleProse(draft).matchAll(regex)) {
    const verse = match[3].replace(/\s*[–-]\s*/g, "-");
    references.add(match[1] + " " + Number(match[2]) + ":" + verse);
  }
  return [...references];
}

async function fetchJson(url, attempt = 1) {
  const response = await fetch(url);
  if (response.status === 429 && attempt <= 5) {
    await sleep(attempt * 2000);
    return fetchJson(url, attempt + 1);
  }
  if (!response.ok) throw new Error("HTTP " + response.status + " for " + url);
  return response.json();
}

async function fetchQuranVerse(reference) {
  const match = /^Quran (\d+):(\d+)$/.exec(reference);
  if (!match) throw new Error("Unsupported Quran reference: " + reference);
  const data = await fetchJson(
    "https://api.alquran.cloud/v1/ayah/" + match[1] + ":" + match[2] + "/editions/quran-uthmani,en.sahih",
  );
  const [arabic, english] = data.data;
  await sleep(250);
  return {
    surahName: english.surah.englishName,
    surahNumber: Number(match[1]),
    ayahNumber: Number(match[2]),
    reference,
    arabic: arabic.text,
    translation: english.text,
    translator: "Saheeh International",
    sourceAttribution: "api.alquran.cloud — Tanzil Uthmani text; Saheeh International translation",
  };
}

async function fetchBibleVerse(reference) {
  const match = /^(.*?) (\d+):(.+)$/.exec(reference);
  if (!match) throw new Error("Unsupported Bible reference: " + reference);
  const book = match[1];
  const chapter = Number(match[2]);
  const verse = match[3];
  const bookForUrl = book.toLowerCase().replace(/\s+/g, "+");
  const data = await fetchJson(
    "https://bible-api.com/" + bookForUrl + "+" + chapter + ":" + verse + "?translation=web",
  );
  await sleep(400);
  return {
    book,
    chapter,
    verse,
    reference,
    text: data.text,
    version: "World English Bible",
    sourceAttribution: "bible-api.com — World English Bible (public domain)",
  };
}

async function ensureScriptureCoverage() {
  const quranIndex = new Map();
  const bibleIndex = new Map();
  for (const state of states.values()) {
    for (const verse of state.data.quranVerses ?? []) quranIndex.set(verse.reference, verse);
    for (const verse of state.data.bibleVerses ?? []) bibleIndex.set(verse.reference, verse);
  }

  for (const state of states.values()) {
    const quranExisting = new Set((state.data.quranVerses ?? []).map((item) => item.reference));
    for (const reference of detectedQuranReferences(state.data)) {
      if (quranExisting.has(reference)) continue;
      let verse = quranIndex.get(reference);
      if (!verse) {
        console.log("fetching " + reference);
        verse = await fetchQuranVerse(reference);
        quranIndex.set(reference, verse);
      }
      state.data.quranVerses.push(structuredClone(verse));
      quranExisting.add(reference);
      mark(state, "quranVerses");
    }

    const bibleExisting = new Set((state.data.bibleVerses ?? []).map((item) => item.reference));
    for (const reference of detectedBibleReferences(state.data)) {
      if (bibleExisting.has(reference)) continue;
      let verse = bibleIndex.get(reference);
      if (!verse) {
        console.log("fetching " + reference);
        verse = await fetchBibleVerse(reference);
        bibleIndex.set(reference, verse);
      }
      state.data.bibleVerses.push(structuredClone(verse));
      bibleExisting.add(reference);
      mark(state, "bibleVerses");
    }
  }
}

function normalizeMalformedReferences() {
  for (const slug of ["early-islamic-preservation", "textual-variants-explained"]) {
    update(slug, ["sections", "faq"], (draft) => {
      for (const item of draft.sections) {
        item.body = item.body.replace(/John 7:53[–-]8(?!:11)/g, "John 7:53-8:11");
      }
      for (const item of draft.faq ?? []) {
        item.answer = item.answer.replace(/John 7:53[–-]8(?!:11)/g, "John 7:53-8:11");
      }
    });
  }
}

async function main() {
  applyCoreCorrections();
  applyTransmissionAndEthicsCorrections();
  applyInterpretiveCorrections();
  applyHadithLocatorCorrections();
  applyBibliographyCorrections();
  normalizeMalformedReferences();
  await ensureScriptureCoverage();

  let filesChanged = 0;
  for (const state of states.values()) {
    if (state.changedKeys.size === 0) continue;
    let nextRaw = state.raw;
    for (const key of state.changedKeys) {
      nextRaw = replaceTopLevelValue(nextRaw, key, state.data[key]);
    }
    JSON.parse(nextRaw);
    if (nextRaw !== state.raw) {
      writeFileSync(state.filePath, nextRaw, "utf8");
      filesChanged += 1;
      console.log("updated " + state.file);
    }
  }
  console.log("content audit remediation complete; files changed: " + filesChanged);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
