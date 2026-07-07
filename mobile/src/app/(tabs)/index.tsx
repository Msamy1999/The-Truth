import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Body, Eyebrow, LinkCard, Pill, Row, Title } from "../../components/ui";
import { useContent } from "../../lib/content";
import { useBookmarks } from "../../lib/store";
import { siteName, siteNameArabic, useTheme } from "../../lib/theme";

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
      <View style={styles.brand}>
        <Title size={26}>{siteName}</Title>
        <Text
          style={[styles.arabic, { color: theme.mutedForeground }]}
          // Quranic/Arabic text renders right-to-left inside the English UI.
        >
          {siteNameArabic}
        </Text>
        <Body>
          An Islamic knowledge and research library for sincere seekers —
          source-aware study with honest draft labels.
        </Body>
      </View>

      <Eyebrow>Main paths</Eyebrow>
      <View style={styles.list}>
        {content.home.mainPaths.map((path) => (
          <LinkCard key={path.id ?? path.title} href={toRoute(path.href ?? "/")}>
            <Row>
              <Title size={16}>{path.title}</Title>
              {path.tag ? <Pill label={path.tag} /> : null}
            </Row>
            {path.description ? <Body>{path.description}</Body> : null}
          </LinkCard>
        ))}
      </View>

      {bookmarkedArticles.length > 0 ? (
        <>
          <Eyebrow>Your bookmarks</Eyebrow>
          <View style={styles.list}>
            {bookmarkedArticles.map((article) => (
              <LinkCard key={article.slug} href={`/article/${article.slug}`}>
                <Title size={16}>{article.title}</Title>
                <Body>{article.summary}</Body>
              </LinkCard>
            ))}
          </View>
        </>
      ) : null}

      <Eyebrow>Recommended path for Christians</Eyebrow>
      <View style={styles.list}>
        {content.home.christianLearningPath.map((step, index) => (
          <LinkCard key={step.title} href={toRoute(step.href)}>
            <Row>
              <View style={[styles.stepBadge, { backgroundColor: theme.muted }]}>
                <Text style={{ color: theme.accent, fontWeight: "700" }}>
                  {index + 1}
                </Text>
              </View>
              <Title size={15}>{step.title}</Title>
            </Row>
            <Body>{step.description}</Body>
          </LinkCard>
        ))}
      </View>
    </ScrollView>
  );
}

/**
 * Maps website hrefs from the shared content data onto app routes.
 * Category pages map to /category/[slug]; articles map to /article/[slug].
 */
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
  if (href === "/sources") {
    return "/sources";
  }
  if (href === "/glossary") {
    return "/glossary";
  }
  const slug = href.replace("/", "");
  if (TREE_SECTIONS.includes(slug)) {
    return `/section/${slug}`;
  }
  return `/category/${slug}`;
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 10, paddingBottom: 40 },
  brand: { gap: 6, marginBottom: 10 },
  arabic: {
    fontSize: 18,
    writingDirection: "rtl",
    textAlign: "left",
  },
  list: { gap: 10, marginBottom: 14 },
  stepBadge: {
    width: 26,
    height: 26,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
});
