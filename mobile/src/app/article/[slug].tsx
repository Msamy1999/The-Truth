import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams } from "expo-router";
import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { ArticleTools } from "../../components/ArticleTools";
import {
  Body,
  Card,
  ListRow,
  Pill,
  Row,
  SectionHeader,
  SelectableText,
  StatusPill,
  categoryIcon,
} from "../../components/ui";
import { useContent } from "../../lib/content";
import { useBookmarks, useFontScale } from "../../lib/store";
import { space, type, useTheme } from "../../lib/theme";
import type { Article } from "../../lib/types";

/**
 * The title, subtitle, beginner summary, and every section (title + body)
 * as ONE continuous string, so the whole article renders in a single
 * TextInput and a drag-selection can span across section boundaries —
 * a real iOS/Android limitation is that a native text selection can never
 * cross between two separate text views, so anything meant to be
 * selectable together has to live in the same one. The trade-off: within
 * this flow every line shares one plain style (no bold/larger heading
 * text), so section titles are set off with a plain-text marker instead.
 */
function buildSelectableFlow(article: Article): string {
  const parts = [article.title, article.subtitle, `BEGINNER SUMMARY\n${article.summary}`];
  for (const section of article.sections) {
    parts.push(`${section.kind.toUpperCase()}\n${section.title}\n\n${section.body}`);
  }
  return parts.filter(Boolean).join("\n\n\n");
}

export default function ArticleScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const theme = useTheme();
  const content = useContent();
  const { bookmarks, toggle } = useBookmarks();
  const { fontScale, cycle } = useFontScale();

  const article = content.articles.find((item) => item.slug === slug);
  const selectableFlow = useMemo(
    () => (article ? buildSelectableFlow(article) : ""),
    [article],
  );

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
        <Row>
          <StatusPill status={article.status} />
          {article.tags.map((tag) => (
            <Pill key={tag} label={tag} />
          ))}
        </Row>
        <Text style={[type.caption, { color: theme.mutedForeground }]}>
          Last updated {article.lastUpdated}
        </Text>

        <ArticleTools article={article} />

        <Card style={{ borderLeftWidth: 3, borderLeftColor: theme.accent }}>
          <Text style={[type.label, { color: theme.accent }]}>
            Tip: select any range below to copy it — selection can now span
            across sections
          </Text>
        </Card>

        <SelectableText
          style={[
            type.body,
            {
              color: theme.foreground,
              fontSize: type.body.fontSize * fontScale,
              lineHeight: type.body.lineHeight * fontScale,
            },
          ]}
        >
          {selectableFlow}
        </SelectableText>

        {article.sections.some((section) => section.citationIds.length > 0) ? (
          <View style={{ gap: 4 }}>
            {article.sections
              .filter((section) => section.citationIds.length > 0)
              .map((section) => (
                <Text
                  key={section.id}
                  style={[type.caption, { color: theme.mutedForeground, fontStyle: "italic" }]}
                >
                  {section.title} — sources to verify: {section.citationIds.join(", ")}
                </Text>
              ))}
          </View>
        ) : null}

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
  list: { gap: space.sm },
  missing: { flex: 1, padding: 24, gap: space.sm, alignItems: "center", justifyContent: "center" },
});
