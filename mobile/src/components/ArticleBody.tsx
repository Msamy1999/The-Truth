import { Fragment } from "react";
import { StyleSheet, Text, View } from "react-native";
import { space, type, useTheme } from "../lib/theme";

type ArticleBodyProps = {
  children: string;
  scale?: number;
  muted?: boolean;
};

const listLine = /^\s*([-*]|\d+[.)])\s+(.+)$/;
const boldOnly = /^\*\*(.+?)\*\*[:.]?$/;

/**
 * Render the small Markdown subset used by imported article prose. Payload
 * stores plain text, so this keeps editorial **emphasis** and simple lists
 * readable in the offline app without accepting HTML or arbitrary markup.
 */
export function ArticleBody({
  children,
  scale = 1,
  muted = true,
}: ArticleBodyProps) {
  const theme = useTheme();
  const color = muted ? theme.mutedForeground : theme.foreground;
  const textStyle = {
    color,
    fontSize: type.body.fontSize * scale,
    lineHeight: type.body.lineHeight * scale,
  };
  const blocks = children
    .replace(/\r\n?/g, "\n")
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  return (
    <View style={styles.body}>
      {blocks.map((block, blockIndex) => {
        const heading = block.match(boldOnly);
        if (heading) {
          return (
            <Text
              key={`${blockIndex}-${heading[1]}`}
              selectable
              style={[
                textStyle,
                styles.subheading,
                { color: theme.foreground },
              ]}
            >
              {heading[1]}
            </Text>
          );
        }

        const lines = block.split("\n").map((line) => line.trim());
        const isList = lines.length > 0 && lines.every((line) => listLine.test(line));
        if (isList) {
          return (
            <View key={`list-${blockIndex}`} style={styles.list}>
              {lines.map((line, lineIndex) => {
                const match = line.match(listLine)!;
                const marker = /^\d/.test(match[1]) ? match[1] : "•";
                return (
                  <View key={`${blockIndex}-${lineIndex}`} style={styles.listRow}>
                    <Text
                      selectable
                      style={[textStyle, styles.marker, { color: theme.accent }]}
                    >
                      {marker}
                    </Text>
                    <Text selectable style={[textStyle, styles.listText]}>
                      {renderInline(match[2], `${blockIndex}-${lineIndex}`)}
                    </Text>
                  </View>
                );
              })}
            </View>
          );
        }

        return (
          <Text key={`paragraph-${blockIndex}`} selectable style={textStyle}>
            {renderInline(lines.join("\n"), String(blockIndex))}
          </Text>
        );
      })}
    </View>
  );
}

function renderInline(value: string, keyPrefix: string) {
  return value.split(/(\*\*[^*]+\*\*)/g).map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <Text key={`${keyPrefix}-bold-${index}`} style={styles.bold}>
          {part.slice(2, -2)}
        </Text>
      );
    }
    return <Fragment key={`${keyPrefix}-text-${index}`}>{part}</Fragment>;
  });
}

const styles = StyleSheet.create({
  body: { gap: space.md },
  subheading: { fontWeight: "700", marginTop: space.xs },
  bold: { fontWeight: "700" },
  list: { gap: space.sm },
  listRow: { flexDirection: "row", alignItems: "flex-start", gap: space.sm },
  marker: { width: 24, fontWeight: "700", textAlign: "right" },
  listText: { flex: 1 },
});
