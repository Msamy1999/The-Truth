import { Stack, useLocalSearchParams } from "expo-router";
import { ScrollView, StyleSheet, View } from "react-native";
import {
  Body,
  Card,
  Eyebrow,
  LinkCard,
  Pill,
  Row,
  StatusPill,
  Title,
} from "../../components/ui";
import { useContent } from "../../lib/content";
import { useTheme } from "../../lib/theme";

export default function CategoryScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const theme = useTheme();
  const content = useContent();

  const category = content.categories.find((item) => item.slug === slug);

  if (!category) {
    // Section pages that are not categories (e.g. islam-overview) show the
    // closest matching content: nothing found → gentle empty state.
    return (
      <View style={[styles.missing, { backgroundColor: theme.background }]}>
        <Title size={18}>Section not available in the app yet</Title>
        <Body>
          This part of the library is on the website. The app currently covers
          the research categories, articles, glossary, and sources.
        </Body>
      </View>
    );
  }

  const articles = content.articles.filter(
    (article) => article.category === category.slug,
  );

  return (
    <>
      <Stack.Screen options={{ title: category.title }} />
      <ScrollView
        style={{ backgroundColor: theme.background }}
        contentContainerStyle={styles.container}
      >
        <Eyebrow>Research category</Eyebrow>
        <Title size={20}>{category.title}</Title>
        <Body>{category.description}</Body>
        <Row>
          {category.tags.map((tag) => (
            <Pill key={tag} label={tag} />
          ))}
        </Row>

        {articles.length > 0 ? (
          <View style={styles.section}>
            <Eyebrow>Draft articles</Eyebrow>
            <View style={styles.list}>
              {articles.map((article) => (
                <LinkCard key={article.slug} href={`/article/${article.slug}`}>
                  <Row>
                    <Title size={15}>{article.title}</Title>
                    <StatusPill status={article.status} />
                  </Row>
                  <Body>{article.summary}</Body>
                </LinkCard>
              ))}
            </View>
          </View>
        ) : null}

        <View style={styles.section}>
          <Eyebrow>Planned studies</Eyebrow>
          <View style={styles.list}>
            {category.futureTopics.map((topic) => {
              const articleHref = topic.href?.startsWith("/articles/")
                ? topic.href.replace("/articles/", "/article/")
                : undefined;

              if (articleHref) {
                return (
                  <LinkCard key={topic.title} href={articleHref}>
                    <Row>
                      <Title size={15}>{topic.title}</Title>
                      <Pill label="Draft article" tone="gold" />
                    </Row>
                    <Body>{topic.description}</Body>
                  </LinkCard>
                );
              }

              return (
                <Card key={topic.title}>
                  <Row>
                    <Title size={15}>{topic.title}</Title>
                    <Pill label="Planned" />
                  </Row>
                  <Body>{topic.description}</Body>
                </Card>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 8, paddingBottom: 48 },
  section: { gap: 6, marginTop: 12 },
  list: { gap: 10 },
  missing: { flex: 1, padding: 24, gap: 8 },
});
