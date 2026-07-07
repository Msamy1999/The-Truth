import { useMemo, useState } from "react";
import { ScrollView, StyleSheet, TextInput, View } from "react-native";
import { Body, Card, Eyebrow, Pill, Row, Title } from "../../components/ui";
import { useContent } from "../../lib/content";
import { useTheme } from "../../lib/theme";

export default function GlossaryScreen() {
  const theme = useTheme();
  const content = useContent();
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return content.glossary;
    }

    return content.glossary.filter((entry) =>
      [entry.term, entry.definition, entry.category, ...entry.relatedTerms]
        .join(" ")
        .toLowerCase()
        .includes(normalized),
    );
  }, [content.glossary, query]);

  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Search glossary terms"
        placeholderTextColor={theme.mutedForeground}
        accessibilityLabel="Search glossary terms"
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
        {results.length} term{results.length === 1 ? "" : "s"}
      </Eyebrow>
      <View style={styles.list}>
        {results.map((entry) => (
          <Card key={entry.term}>
            <Row>
              <Title size={16}>{entry.term}</Title>
              <Pill label={entry.category} />
            </Row>
            <Body>{entry.definition}</Body>
            {entry.relatedTerms.length > 0 ? (
              <Row>
                {entry.relatedTerms.map((related) => (
                  <Pill key={related} label={related} />
                ))}
              </Row>
            ) : null}
          </Card>
        ))}
        {results.length === 0 ? (
          <Body>No terms found. Try a broader search.</Body>
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
