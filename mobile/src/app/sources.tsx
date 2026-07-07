import { ScrollView, StyleSheet, Text, View } from "react-native";
import {
  Body,
  Card,
  Pill,
  Row,
  SectionHeader,
  StatusPill,
} from "../components/ui";
import { useContent } from "../lib/content";
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
          Every source is tracked with a pending/verified status. Nothing is
          cited as verified until it has actually been checked.
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
                  <StatusPill status={item.status} />
                </Row>
                <Text
                  style={[type.cardTitle, { color: theme.foreground, fontSize: 14.5 }]}
                >
                  {item.title}
                </Text>
                <Body>{item.notes}</Body>
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
});
