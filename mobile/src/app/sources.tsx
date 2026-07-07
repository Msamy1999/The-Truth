import { ScrollView, StyleSheet, View } from "react-native";
import {
  Body,
  Card,
  Eyebrow,
  Pill,
  Row,
  StatusPill,
  Title,
} from "../components/ui";
import { useContent } from "../lib/content";
import { useTheme } from "../lib/theme";

export default function SourcesScreen() {
  const theme = useTheme();
  const content = useContent();

  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={styles.container}
    >
      <Body>
        Every source is tracked with a pending/verified status. Nothing is
        cited as verified until it has actually been checked.
      </Body>

      {content.sources.map((category) => (
        <View key={category.title} style={styles.section}>
          <Eyebrow>{category.title}</Eyebrow>
          <Body>{category.description}</Body>
          <View style={styles.list}>
            {category.items.map((item) => (
              <Card key={item.id}>
                <Row>
                  <Pill label={item.type} />
                  <StatusPill status={item.status} />
                </Row>
                <Title size={14}>{item.title}</Title>
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
  container: { padding: 16, gap: 8, paddingBottom: 48 },
  section: { gap: 6, marginTop: 12 },
  list: { gap: 10, marginTop: 4 },
});
