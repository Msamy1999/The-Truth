import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
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
  StatusPill,
  categoryIcon,
} from "../../components/ui";
import { useContent } from "../../lib/content";
import { radius, space, useTheme } from "../../lib/theme";

export default function SearchScreen() {
  const theme = useTheme();
  const content = useContent();
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return content.articles;

    return content.articles.filter((article) =>
      [
        article.title,
        article.subtitle,
        article.summary,
        article.category,
        ...article.tags,
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalized),
    );
  }, [content.articles, query]);

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
        {results.length} article{results.length === 1 ? "" : "s"}
      </SectionHeader>
      <View style={styles.list}>
        {results.map((article) => (
          <ListRow
            key={article.slug}
            href={`/article/${article.slug}`}
            icon={categoryIcon(article.category)}
            title={article.title}
            subtitle={article.summary}
            pill={<StatusPill status={article.status} />}
          />
        ))}
        {results.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons
              name="search-outline"
              size={32}
              color={theme.mutedForeground}
            />
            <Body>No articles match “{query.trim()}”. Try a broader search.</Body>
          </View>
        ) : null}
      </View>
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
