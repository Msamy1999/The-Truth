import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Body, Card, Pill, Row, SectionHeader } from "../../components/ui";
import { useContent } from "../../lib/content";
import { radius, space, type, useTheme } from "../../lib/theme";

export default function GlossaryScreen() {
  const theme = useTheme();
  const content = useContent();
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return content.glossary;

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
          placeholder="Search glossary terms"
          placeholderTextColor={theme.mutedForeground}
          accessibilityLabel="Search glossary terms"
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
        {results.length} term{results.length === 1 ? "" : "s"}
      </SectionHeader>
      <View style={styles.list}>
        {results.map((entry) => (
          <Card key={entry.term}>
            <View style={styles.termLine}>
              <Text style={[type.cardTitle, { color: theme.foreground, flex: 1 }]}>
                {entry.term}
              </Text>
              <Pill label={entry.category} tone="accent" />
            </View>
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
          <View style={styles.empty}>
            <Ionicons
              name="book-outline"
              size={32}
              color={theme.mutedForeground}
            />
            <Body>No terms match “{query.trim()}”.</Body>
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
  termLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
  },
  empty: { alignItems: "center", gap: space.sm, paddingVertical: space.xxl },
});
