import { Ionicons } from "@expo/vector-icons";
import { useDeferredValue, useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import {
  Body,
  ListRow,
  SectionHeader,
  categoryIcon,
} from "../../components/ui";
import { useContent } from "../../lib/content";
import { radius, space, useTheme } from "../../lib/theme";

export default function SearchScreen() {
  const theme = useTheme();
  const content = useContent();
  const articles = content.articles;
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);

  const search = useMemo(() => {
    const words = deferredQuery.trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      return {
        titleMatches: articles.map((article) => ({ article })),
        contentMatches: [] as {
          article: (typeof articles)[number];
          subtitle: string;
        }[],
      };
    }

    const titleMatches = articles
      .filter((article) => includesAllWords(article.title, words))
      .map((article) => ({ article }));
    const titleSlugs = new Set(titleMatches.map(({ article }) => article.slug));
    const contentMatches = articles.flatMap((article) => {
      if (titleSlugs.has(article.slug)) return [];
      const searchable = [
        article.subtitle,
        article.summary,
        article.category,
        ...article.tags,
        ...article.sections.flatMap((section) => [section.title, section.body]),
      ].join(" ");
      if (!includesAllWords(searchable, words)) return [];
      const section = article.sections.find((item) =>
        words.some((word) =>
          `${item.title} ${item.body}`.toLowerCase().includes(word),
        ),
      );
      return [{
        article,
        subtitle: section
          ? `Found in ${section.title}: ${excerpt(section.body, words)}`
          : article.summary,
      }];
    });
    return { titleMatches, contentMatches };
  }, [articles, deferredQuery]);
  const resultCount = search.titleMatches.length + search.contentMatches.length;

  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <View
        style={[
          styles.inputWrap,
          { backgroundColor: theme.card, borderColor: theme.border },
        ]}
      >
        <Ionicons name="search" size={17} color={theme.mutedForeground} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search by title, tag, or topic"
          placeholderTextColor={theme.mutedForeground}
          accessibilityLabel="Search articles"
          style={[styles.input, { color: theme.foreground }]}
        />
        {query.length > 0 ? (
          <Pressable
            onPress={() => setQuery("")}
            hitSlop={10}
            accessibilityLabel="Clear search"
          >
            <Ionicons
              name="close-circle"
              size={18}
              color={theme.mutedForeground}
            />
          </Pressable>
        ) : null}
      </View>

      <SectionHeader>
        {resultCount} article{resultCount === 1 ? "" : "s"}
      </SectionHeader>
      <View style={styles.list}>
        {search.titleMatches.map(({ article }) => (
          <ListRow
            key={article.slug}
            href={`/article/${article.slug}`}
            icon={categoryIcon(article.category)}
            title={article.title}
            subtitle={article.summary}
          />
        ))}
      </View>

      {search.contentMatches.length > 0 ? (
        <>
          <SectionHeader>Mentioned in article text</SectionHeader>
          <View style={styles.list}>
            {search.contentMatches.map(({ article, subtitle }) => (
              <ListRow
                key={article.slug}
                href={`/article/${article.slug}`}
                icon={categoryIcon(article.category)}
                title={article.title}
                subtitle={subtitle}
              />
            ))}
          </View>
        </>
      ) : null}

      {resultCount === 0 ? (
        <View style={styles.list}>
          <View style={styles.empty}>
            <Ionicons
              name="search-outline"
              size={32}
              color={theme.mutedForeground}
            />
            <Body>No articles match “{query.trim()}”. Try a broader search.</Body>
          </View>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: space.lg, gap: space.sm, paddingBottom: 48 },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
  },
  input: { flex: 1, fontSize: 15, paddingVertical: 12 },
  list: { gap: space.sm },
  empty: { alignItems: "center", gap: space.sm, paddingVertical: space.xxl },
});

function includesAllWords(value: string, words: string[]) {
  const normalized = value.toLowerCase();
  return words.every((word) => normalized.includes(word));
}

function excerpt(value: string, words: string[]) {
  const normalized = value.toLowerCase();
  const index = words
    .map((word) => normalized.indexOf(word))
    .filter((position) => position >= 0)
    .sort((first, second) => first - second)[0] ?? 0;
  const start = Math.max(0, index - 42);
  const end = Math.min(value.length, index + 150);
  return `${start > 0 ? "…" : ""}${value
    .slice(start, end)
    .replace(/\s+/g, " ")
    .trim()}${end < value.length ? "…" : ""}`;
}
