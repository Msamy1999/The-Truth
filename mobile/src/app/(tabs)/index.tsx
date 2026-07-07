import { Image } from "react-native";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import {
  Body,
  Card,
  ListRow,
  SectionHeader,
  categoryIcon,
} from "../../components/ui";
import { useContent } from "../../lib/content";
import { useBookmarks } from "../../lib/store";
import {
  radius,
  siteName,
  siteNameArabic,
  space,
  type,
  useTheme,
} from "../../lib/theme";

const PATH_ICONS: Record<string, string> = {
  "learn-islam": "school-outline",
  "compare-islam-christianity": "git-compare-outline",
  "questions-from-atheists-and-agnostics": "help-circle-outline",
  "people-of-palestine": "people-outline",
  "common-questions": "chatbubbles-outline",
};

const TREE_SECTIONS = [
  "islam-overview",
  "islam-christianity",
  "atheism-agnosticism",
  "people-of-palestine",
];

function toRoute(href: string): string {
  if (href.startsWith("/articles/")) {
    return href.replace("/articles/", "/article/");
  }
  if (href === "/sources") return "/sources";
  if (href === "/glossary") return "/glossary";
  const slug = href.replace("/", "");
  if (TREE_SECTIONS.includes(slug)) return `/section/${slug}`;
  return `/category/${slug}`;
}

export default function HomeScreen() {
  const theme = useTheme();
  const content = useContent();
  const { bookmarks } = useBookmarks();

  const bookmarkedArticles = content.articles.filter((article) =>
    bookmarks.includes(article.slug),
  );

  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={styles.container}
    >
      {/* Hero */}
      <View
        style={[
          styles.hero,
          { backgroundColor: theme.accentSoft, borderColor: theme.border },
        ]}
      >
        <Image
          source={require("../../../assets/images/icon.png")}
          style={styles.heroMark}
          accessibilityIgnoresInvertColors
        />
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={[type.display, { color: theme.foreground, fontSize: 24, lineHeight: 30 }]}>
            {siteName}
          </Text>
          <Text style={[styles.arabic, { color: theme.accent }]}>
            {siteNameArabic}
          </Text>
        </View>
      </View>
      <Body>
        An Islamic knowledge and research library for sincere seekers —
        source-aware study with honest draft labels.
      </Body>

      <SectionHeader>Main paths</SectionHeader>
      <View style={styles.list}>
        {content.home.mainPaths.map((path) => (
          <ListRow
            key={path.id ?? path.title}
            href={toRoute(path.href ?? "/")}
            icon={(PATH_ICONS[path.id ?? ""] ?? "compass-outline") as never}
            title={path.title}
            subtitle={path.description}
          />
        ))}
      </View>

      {bookmarkedArticles.length > 0 ? (
        <>
          <SectionHeader>Your bookmarks</SectionHeader>
          <View style={styles.list}>
            {bookmarkedArticles.map((article) => (
              <ListRow
                key={article.slug}
                href={`/article/${article.slug}`}
                icon="bookmark-outline"
                title={article.title}
                subtitle={article.summary}
              />
            ))}
          </View>
        </>
      ) : null}

      <SectionHeader>Recommended path for Christians</SectionHeader>
      <Card style={{ gap: 0, paddingVertical: space.xs }}>
        {content.home.christianLearningPath.map((step, index) => (
          <View
            key={step.title}
            style={[
              styles.step,
              index > 0 && {
                borderTopWidth: StyleSheet.hairlineWidth,
                borderTopColor: theme.hairline,
              },
            ]}
          >
            <View style={[styles.stepNumber, { backgroundColor: theme.accentSoft }]}>
              <Text style={{ color: theme.accent, fontWeight: "700", fontSize: 13 }}>
                {index + 1}
              </Text>
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={[type.cardTitle, { color: theme.foreground }]}>
                {step.title}
              </Text>
              <Text style={[type.caption, { color: theme.mutedForeground }]}>
                {step.description}
              </Text>
            </View>
          </View>
        ))}
      </Card>

      <SectionHeader>How we study</SectionHeader>
      <Card style={{ gap: space.md }}>
        {content.home.comparisonMethods.map((method) => (
          <View key={method.title} style={styles.method}>
            <View style={[styles.methodDot, { backgroundColor: theme.accent }]} />
            <View style={{ flex: 1 }}>
              <Text style={[type.cardTitle, { color: theme.foreground, fontSize: 14.5 }]}>
                {method.title}
              </Text>
              <Text style={[type.caption, { color: theme.mutedForeground }]}>
                {method.description}
              </Text>
            </View>
          </View>
        ))}
      </Card>

      <SectionHeader>Featured research</SectionHeader>
      <View style={styles.list}>
        {content.home.featuredResearchCards.map((card) => (
          <ListRow
            key={card.title}
            href={toRoute(card.href)}
            icon={categoryIcon("scripture")}
            title={card.title}
            subtitle={card.description}
          />
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: space.lg, gap: space.sm, paddingBottom: 48 },
  hero: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.lg,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: space.lg,
  },
  heroMark: { width: 52, height: 52, borderRadius: 14 },
  arabic: {
    fontSize: 17,
    fontWeight: "600",
    writingDirection: "rtl",
    textAlign: "left",
  },
  list: { gap: space.sm },
  step: {
    flexDirection: "row",
    gap: space.md,
    alignItems: "flex-start",
    paddingVertical: space.md,
  },
  stepNumber: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  method: { flexDirection: "row", gap: space.md, alignItems: "flex-start" },
  methodDot: { width: 7, height: 7, borderRadius: 4, marginTop: 7 },
});
