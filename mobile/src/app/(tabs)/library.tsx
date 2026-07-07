import { ScrollView, StyleSheet, View } from "react-native";
import { Body, Eyebrow, LinkCard, Pill, Row, Title } from "../../components/ui";
import { useContent } from "../../lib/content";
import { useTheme } from "../../lib/theme";

export default function LibraryScreen() {
  const theme = useTheme();
  const content = useContent();

  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={styles.container}
    >
      <Eyebrow>Research categories</Eyebrow>
      <View style={styles.list}>
        {content.categories.map((category) => (
          <LinkCard key={category.slug} href={`/category/${category.slug}`}>
            <Row>
              <Title size={16}>{category.title}</Title>
              {category.tags[0] ? <Pill label={category.tags[0]} /> : null}
            </Row>
            <Body>{category.description}</Body>
          </LinkCard>
        ))}
      </View>

      <Eyebrow>Reference</Eyebrow>
      <View style={styles.list}>
        <LinkCard href="/sources">
          <Title size={16}>Source Library</Title>
          <Body>
            Track translations, primary texts, scholarly sources, and citation
            status before claims are published.
          </Body>
        </LinkCard>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 10, paddingBottom: 40 },
  list: { gap: 10, marginBottom: 14 },
});
