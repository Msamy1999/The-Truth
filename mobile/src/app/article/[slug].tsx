import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import {
  Body,
  Card,
  Eyebrow,
  LinkCard,
  Pill,
  Row,
  StatusPill,
  Title,
} from "../../components/ui";
import { useContent } from "../../lib/content";
import { useBookmarks, useFontScale } from "../../lib/store";
import { useTheme } from "../../lib/theme";

export default function ArticleScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const theme = useTheme();
  const content = useContent();
  const { bookmarks, toggle } = useBookmarks();
  const { fontScale, cycle } = useFontScale();

  const article = content.articles.find((item) => item.slug === slug);

  if (!article) {
    return (
      <View style={[styles.missing, { backgroundColor: theme.background }]}>
        <Title size={18}>Article not found</Title>
        <Body>This article may not be available offline yet.</Body>
      </View>
    );
  }

  const citations = content.citations.filter((citation) =>
    article.citations.includes(citation.id),
  );
  const related = content.articles.filter((item) =>
    article.relatedArticles.includes(item.slug),
  );
  const bookmarked = bookmarks.includes(article.slug);

  return (
    <>
      <Stack.Screen
        options={{
          title: article.title,
          headerRight: () => (
            <Row>
              <Pressable
                onPress={cycle}
                accessibilityLabel="Change reading text size"
                hitSlop={8}
                style={styles.headerButton}
              >
                <Text style={{ color: theme.accent, fontWeight: "700" }}>
                  A{fontScale > 1 ? "+" : ""}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => toggle(article.slug)}
                accessibilityLabel={
                  bookmarked ? "Remove bookmark" : "Add bookmark"
                }
                hitSlop={8}
                style={styles.headerButton}
              >
                <Ionicons
                  name={bookmarked ? "bookmark" : "bookmark-outline"}
                  size={20}
                  color={theme.accent}
                />
              </Pressable>
            </Row>
          ),
        }}
      />
      <ScrollView
        style={{ backgroundColor: theme.background }}
        contentContainerStyle={styles.container}
      >
        <Eyebrow>Research article</Eyebrow>
        <Title size={22}>{article.title}</Title>
        <Body scale={fontScale}>{article.subtitle}</Body>
        <Row>
          <StatusPill status={article.status} />
          {article.tags.map((tag) => (
            <Pill key={tag} label={tag} />
          ))}
          <Pill label={article.audienceLevel} />
        </Row>
        <Body>Last updated: {article.lastUpdated}</Body>

        <Card>
          <Eyebrow>Beginner summary</Eyebrow>
          <Body scale={fontScale}>{article.summary}</Body>
        </Card>

        {article.sections.map((section) => (
          <View key={section.id} style={styles.section}>
            <Eyebrow>{section.kind}</Eyebrow>
            <Title size={17}>{section.title}</Title>
            <Body scale={fontScale}>{section.body}</Body>
            {section.citationIds.length > 0 ? (
              <Body>
                Source markers to verify: {section.citationIds.join(", ")}
              </Body>
            ) : null}
          </View>
        ))}

        <View style={styles.section}>
          <Eyebrow>Sources</Eyebrow>
          <View style={styles.list}>
            {citations.map((citation) => (
              <Card key={citation.id}>
                <Row>
                  <Pill label={citation.type} />
                  <StatusPill status={citation.status} />
                </Row>
                <Title size={14}>{citation.title}</Title>
                {citation.note ? <Body>{citation.note}</Body> : null}
              </Card>
            ))}
          </View>
        </View>

        {related.length > 0 ? (
          <View style={styles.section}>
            <Eyebrow>Related articles</Eyebrow>
            <View style={styles.list}>
              {related.map((item) => (
                <LinkCard key={item.slug} href={`/article/${item.slug}`}>
                  <Title size={15}>{item.title}</Title>
                  <Body>{item.summary}</Body>
                </LinkCard>
              ))}
            </View>
          </View>
        ) : null}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 10, paddingBottom: 48 },
  section: { gap: 6, marginTop: 10 },
  list: { gap: 10 },
  missing: { flex: 1, padding: 24, gap: 8 },
  headerButton: { paddingHorizontal: 6, paddingVertical: 4 },
});
