import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import {
  Body,
  Card,
  ListRow,
  Pill,
  Row,
  SectionHeader,
  StatusPill,
  categoryIcon,
} from "../../components/ui";
import { useContent } from "../../lib/content";
import { useBookmarks, useFontScale } from "../../lib/store";
import { space, type, useTheme } from "../../lib/theme";

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
        <Ionicons
          name="document-outline"
          size={32}
          color={theme.mutedForeground}
        />
        <Text style={[type.title, { color: theme.foreground }]}>
          Article not found
        </Text>
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
          title: "",
          headerRight: () => (
            <View style={styles.headerActions}>
              <Pressable
                onPress={cycle}
                accessibilityLabel="Change reading text size"
                hitSlop={8}
                style={({ pressed }) => [
                  styles.headerButton,
                  {
                    backgroundColor: theme.accentSoft,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
              >
                <Text style={{ color: theme.accent, fontWeight: "800", fontSize: 13 }}>
                  A{fontScale > 1.2 ? "++" : fontScale > 1 ? "+" : ""}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => toggle(article.slug)}
                accessibilityLabel={
                  bookmarked ? "Remove bookmark" : "Add bookmark"
                }
                hitSlop={8}
                style={({ pressed }) => [
                  styles.headerButton,
                  {
                    backgroundColor: theme.accentSoft,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
              >
                <Ionicons
                  name={bookmarked ? "bookmark" : "bookmark-outline"}
                  size={16}
                  color={theme.accent}
                />
              </Pressable>
            </View>
          ),
        }}
      />
      <ScrollView
        style={{ backgroundColor: theme.background }}
        contentContainerStyle={styles.container}
      >
        <Text style={[type.label, { color: theme.accent }]}>
          Research article
        </Text>
        <Text style={[type.display, { color: theme.foreground, fontSize: 24, lineHeight: 31 }]}>
          {article.title}
        </Text>
        <Body scale={fontScale}>{article.subtitle}</Body>
        <Row>
          <StatusPill status={article.status} />
          {article.tags.map((tag) => (
            <Pill key={tag} label={tag} />
          ))}
        </Row>
        <Text style={[type.caption, { color: theme.mutedForeground }]}>
          Last updated {article.lastUpdated}
        </Text>

        <Card style={{ borderLeftWidth: 3, borderLeftColor: theme.accent }}>
          <Text style={[type.label, { color: theme.accent }]}>
            Beginner summary
          </Text>
          <Body scale={fontScale} muted={false}>
            {article.summary}
          </Body>
        </Card>

        {article.sections.map((section) => (
          <View key={section.id} style={styles.section}>
            <View style={styles.sectionRule}>
              <View style={[styles.rule, { backgroundColor: theme.hairline }]} />
              <Text style={[type.label, { color: theme.accent }]}>
                {section.kind}
              </Text>
              <View style={[styles.rule, { backgroundColor: theme.hairline }]} />
            </View>
            <Text style={[type.title, { color: theme.foreground, fontSize: 18 }]}>
              {section.title}
            </Text>
            <Body scale={fontScale}>{section.body}</Body>
            {section.citationIds.length > 0 ? (
              <Text style={[type.caption, { color: theme.mutedForeground, fontStyle: "italic" }]}>
                Sources to verify: {section.citationIds.join(", ")}
              </Text>
            ) : null}
          </View>
        ))}

        <SectionHeader>Sources</SectionHeader>
        <View style={styles.list}>
          {citations.map((citation) => (
            <Card key={citation.id} style={{ gap: 6 }}>
              <Row>
                <Pill label={citation.type} />
                <StatusPill status={citation.status} />
              </Row>
              <Text style={[type.cardTitle, { color: theme.foreground, fontSize: 14.5 }]}>
                {citation.title}
              </Text>
              {citation.note ? <Body>{citation.note}</Body> : null}
            </Card>
          ))}
        </View>

        {related.length > 0 ? (
          <>
            <SectionHeader>Related articles</SectionHeader>
            <View style={styles.list}>
              {related.map((item) => (
                <ListRow
                  key={item.slug}
                  href={`/article/${item.slug}`}
                  icon={categoryIcon(item.category)}
                  title={item.title}
                  subtitle={item.summary}
                />
              ))}
            </View>
          </>
        ) : null}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { padding: space.lg, gap: space.sm, paddingBottom: 56 },
  headerActions: { flexDirection: "row", gap: space.sm, paddingRight: 16 },
  headerButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  section: { gap: 6, marginTop: space.md },
  sectionRule: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
    marginBottom: 2,
  },
  rule: { flex: 1, height: StyleSheet.hairlineWidth },
  list: { gap: space.sm },
  missing: { flex: 1, padding: 24, gap: space.sm, alignItems: "center", justifyContent: "center" },
});
