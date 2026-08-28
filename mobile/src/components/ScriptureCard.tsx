import { StyleSheet, Text, View } from "react-native";
import type { BibleVerse, QuranVerse } from "../lib/types";
import { radius, space, type, useTheme } from "../lib/theme";
import { Card } from "./ui";

export function ScriptureCard({
  verse,
  scale = 1,
}: {
  verse: QuranVerse | BibleVerse;
  scale?: number;
}) {
  const theme = useTheme();
  const isQuran = verse.scripture === "quran";
  const passage = isQuran ? verse.translation : verse.text;
  const attribution = isQuran ? verse.translator : verse.version;

  return (
    <Card style={[styles.card, { borderColor: theme.border }]}>
      <Text style={[type.label, { color: theme.accent }]}>
        {isQuran ? "Quran" : "Bible"}
      </Text>
      {isQuran ? (
        <Text
          selectable
          accessibilityLanguage="ar"
          style={[
            styles.arabic,
            {
              color: theme.accent,
              fontSize: 18 * scale,
              lineHeight: 31 * scale,
            },
          ]}
        >
          {verse.arabic}
        </Text>
      ) : null}
      <Text
        selectable
        style={[
          styles.passage,
          {
            color: theme.foreground,
            fontSize: type.body.fontSize * scale,
            lineHeight: type.body.lineHeight * scale,
          },
        ]}
      >
        {passage}
      </Text>
      <View style={[styles.rule, { backgroundColor: theme.hairline }]} />
      <Text style={[styles.reference, { color: theme.foreground }]}>
        {verse.reference}
      </Text>
      <Text style={[styles.attribution, { color: theme.mutedForeground }]}>
        {isQuran ? "Translation" : "Version"}: {attribution}
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: space.sm,
    borderRadius: radius.md,
    padding: space.md,
    shadowOpacity: 0,
    elevation: 0,
  },
  arabic: {
    writingDirection: "rtl",
    textAlign: "right",
    fontWeight: "500",
  },
  passage: { fontWeight: "400" },
  rule: { height: StyleSheet.hairlineWidth, marginTop: 2 },
  reference: { fontSize: 12.5, lineHeight: 17, fontWeight: "800" },
  attribution: { fontSize: 11.5, lineHeight: 16 },
});
