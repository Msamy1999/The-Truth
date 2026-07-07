import { useMemo, useState } from "react";
import { ScrollView, StyleSheet, TextInput, View } from "react-native";
import { Body, Eyebrow, LinkCard, Pill, Row, StatusPill, Title } from "../../components/ui";
import { useContent } from "../../lib/content";
import { useTheme } from "../../lib/theme";

export default function SearchScreen() {
  const theme = useTheme();
  const content = useContent();
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return content.articles;
    }

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
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Search articles by title, tag, or topic"
        placeholderTextColor={theme.mutedForeground}
        accessibilityLabel="Search articles"
        style={[
          styles.input,
          {
            backgroundColor: theme.card,
            borderColor: theme.border,
            color: theme.foreground,
          },
        ]}
      />

      <Eyebrow>
        {results.length} article{results.length === 1 ? "" : "s"}
      </Eyebrow>
      <View style={styles.list}>
        {results.map((article) => (
          <LinkCard key={article.slug} href={`/article/${article.slug}`}>
            <Row>
              <Title size={16}>{article.title}</Title>
              <StatusPill status={article.status} />
            </Row>
            <Body>{article.summary}</Body>
            <Row>
              {article.tags.map((tag) => (
                <Pill key={tag} label={tag} />
              ))}
            </Row>
          </LinkCard>
        ))}
        {results.length === 0 ? (
          <Body>No articles found. Try a broader search.</Body>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 10, paddingBottom: 40 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: 6,
  },
  list: { gap: 10 },
});
