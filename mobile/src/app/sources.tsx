import { Ionicons } from "@expo/vector-icons";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import {
  Body,
  Card,
  Pill,
  Row,
  SectionHeader,
} from "../components/ui";
import { useContent } from "../lib/content";
import { openExternalReference } from "../lib/links";
import { space, type, useTheme } from "../lib/theme";

export default function SourcesScreen() {
  const theme = useTheme();
  const content = useContent();

  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={styles.container}
    >
      <Card style={{ borderLeftWidth: 3, borderLeftColor: theme.accent }}>
        <Body muted={false}>
          Primary texts and further reading are listed inside each article,
          beside the claims they support. This index gathers additional
          reference works when they are available.
        </Body>
      </Card>

      {content.sources.map((category) => (
        <View key={category.title} style={styles.section}>
          <SectionHeader>{category.title}</SectionHeader>
          <Body>{category.description}</Body>
          <View style={styles.list}>
            {category.items.map((item) => (
              <Card key={item.id} style={{ gap: 6 }}>
                <Row>
                  <Pill label={item.type} />
                </Row>
                <Text
                  style={[type.cardTitle, { color: theme.foreground, fontSize: 14.5 }]}
                >
                  {item.title}
                </Text>
                <Body>{item.notes}</Body>
                {item.url ? (
                  <Pressable
                    onPress={() => void openExternalReference(item.url!)}
                    accessibilityRole="link"
                    accessibilityLabel={`Open source: ${item.title}`}
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
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: space.lg, gap: space.sm, paddingBottom: 48 },
  section: { gap: space.xs },
  list: { gap: space.sm, marginTop: space.xs },
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
});
