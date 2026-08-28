import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { ArticleTools } from "../../components/ArticleTools";
import { ArticleBody } from "../../components/ArticleBody";
import { ScriptureCard } from "../../components/ScriptureCard";
import {
  Body,
  Card,
  ListRow,
  Pill,
  Row,
  SectionHeader,
  SelectableText,
  categoryIcon,
} from "../../components/ui";
import { useContent } from "../../lib/content";
import { openExternalReference } from "../../lib/links";
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

  const citationIds = new Set([
    ...article.citations,
    ...article.sections.flatMap((section) => section.citationIds),
  ]);
  const citations = content.citations.filter((citation) =>
    citationIds.has(citation.id),
  );
  const related = content.articles.filter((item) =>
    article.relatedArticles.includes(item.slug),
  );
  const bookmarked = bookmarks.includes(article.slug);
  const keyScripture = content.keyScriptureByArticle[article.slug] ?? {
    quranVerses: [],
    bibleVerses: [],
  };
  const keyPassages = [
    ...keyScripture.quranVerses,
    ...keyScripture.bibleVerses,
  ];

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
        <SelectableText
          style={[type.display, { color: theme.foreground, fontSize: 24, lineHeight: 31 }]}
        >
          {article.title}
        </SelectableText>
        <Body scale={fontScale} selectable>{article.subtitle}</Body>
        <Row>
          {article.tags.map((tag) => (
            <Pill key={tag} label={tag} />
          ))}
        </Row>
        <Text style={[type.caption, { color: theme.mutedForeground }]}>
          Last updated {article.lastUpdated}
        </Text>

        <ArticleTools article={article} keyScripture={keyScripture} />

        <Card style={{ borderLeftWidth: 3, borderLeftColor: theme.accent }}>
          <Text style={[type.label, { color: theme.accent }]}>
            Overview
          </Text>
          <Body scale={fontScale} muted={false} selectable>
            {article.summary}
          </Body>
        </Card>

        {keyPassages.length > 0 ? (
          <View style={styles.scriptureGroup}>
            <SectionHeader>
              Key passage{keyPassages.length === 1 ? "" : "s"}
            </SectionHeader>
            {keyPassages.map((verse) => (
              <ScriptureCard
                key={`${verse.scripture}-${verse.reference}`}
                verse={verse}
                scale={fontScale}
              />
            ))}
          </View>
        ) : null}

        {article.sections.map((section) => (
          <View key={section.id} style={styles.section}>
            <View style={styles.sectionRule}>
              <View style={[styles.rule, { backgroundColor: theme.hairline }]} />
              <Text style={[type.label, { color: theme.accent }]}>
                {section.kind}
              </Text>
              <View style={[styles.rule, { backgroundColor: theme.hairline }]} />
            </View>
            <SelectableText
              style={[type.title, { color: theme.foreground, fontSize: 18 }]}
            >
              {section.title}
            </SelectableText>
            <ArticleBody scale={fontScale}>{section.body}</ArticleBody>
          </View>
        ))}

        <SectionHeader>Sources</SectionHeader>
        <View style={styles.list}>
          {citations.map((citation) => (
            <Card key={citation.id} style={{ gap: 6 }}>
              <Row>
                <Pill label={citation.type} />
              </Row>
              <Text style={[type.cardTitle, { color: theme.foreground, fontSize: 14.5 }]}>
                {citation.title}
              </Text>
              {citation.note ? <Body>{citation.note}</Body> : null}
              {citation.url ? (
                <Pressable
                  onPress={() => void openExternalReference(citation.url!)}
                  accessibilityRole="link"
                  accessibilityLabel={`Open source: ${citation.title}`}
                  hitSlop={6}
                  style={({ pressed }) => [
                    styles.sourceLink,
                    {
                      backgroundColor: theme.accentSoft,
                      opacity: pressed ? 0.7 : 1,
                    },
                  ]}
                >
                  <Ionicons name="open-outline" size={14} color={theme.accent} />
                  <Text style={[styles.sourceLinkText, { color: theme.accent }]}>Open source</Text>
                </Pressable>
              ) : null}
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
  scriptureGroup: { gap: space.sm },
  sourceLink: {
    alignSelf: "flex-start",
    minHeight: 44,
    borderRadius: 999,
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  sourceLinkText: { fontSize: 12.5, fontWeight: "700" },
  missing: { flex: 1, padding: 24, gap: space.sm, alignItems: "center", justifyContent: "center" },
});
