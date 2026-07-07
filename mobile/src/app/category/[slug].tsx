import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import {
  Body,
  Card,
  IconBadge,
  ListRow,
  Pill,
  Row,
  SectionHeader,
  StatusPill,
  categoryIcon,
} from "../../components/ui";
import { useContent } from "../../lib/content";
import { space, type, useTheme } from "../../lib/theme";

export default function CategoryScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const theme = useTheme();
  const content = useContent();

  const category = content.categories.find((item) => item.slug === slug);

  if (!category) {
    return (
      <View style={[styles.missing, { backgroundColor: theme.background }]}>
        <Ionicons name="albums-outline" size={32} color={theme.mutedForeground} />
        <Text style={[type.title, { color: theme.foreground }]}>
          Section not in the app yet
        </Text>
        <Body>
          This part of the library lives on the website for now. The app covers
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
      <Stack.Screen options={{ title: "" }} />
      <ScrollView
        style={{ backgroundColor: theme.background }}
        contentContainerStyle={styles.container}
      >
        <View style={styles.header}>
          <IconBadge icon={categoryIcon(category.icon)} size={46} />
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={[type.display, { color: theme.foreground, fontSize: 22, lineHeight: 28 }]}>
              {category.title}
            </Text>
            <Row>
              {category.tags.map((tag) => (
                <Pill key={tag} label={tag} />
              ))}
            </Row>
          </View>
        </View>
        <Body>{category.description}</Body>

        {articles.length > 0 ? (
          <>
            <SectionHeader>Draft articles</SectionHeader>
            <View style={styles.list}>
              {articles.map((article) => (
                <ListRow
                  key={article.slug}
                  href={`/article/${article.slug}`}
                  icon="document-text-outline"
                  title={article.title}
                  subtitle={article.summary}
                  pill={<StatusPill status={article.status} />}
                />
              ))}
            </View>
          </>
        ) : null}

        <SectionHeader>Planned studies</SectionHeader>
        <View style={styles.list}>
          {category.futureTopics.map((topic) => {
            const articleHref = topic.href?.startsWith("/articles/")
              ? topic.href.replace("/articles/", "/article/")
              : undefined;

            if (articleHref) {
              return (
                <ListRow
                  key={topic.title}
                  href={articleHref}
                  icon="document-text-outline"
                  title={topic.title}
                  subtitle={topic.description}
                  pill={<Pill label="Draft" tone="gold" />}
                />
              );
            }

            return (
              <Card key={topic.title} style={{ gap: 4 }}>
                <View style={styles.plannedLine}>
                  <Text
                    style={[type.cardTitle, { color: theme.foreground, flex: 1 }]}
                  >
                    {topic.title}
                  </Text>
                  <Pill label="Planned" />
                </View>
                <Body>{topic.description}</Body>
              </Card>
            );
          })}
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { padding: space.lg, gap: space.sm, paddingBottom: 48 },
  header: { flexDirection: "row", gap: space.md, alignItems: "center" },
  list: { gap: space.sm },
  plannedLine: { flexDirection: "row", alignItems: "center", gap: space.sm },
  missing: {
    flex: 1,
    padding: 24,
    gap: space.sm,
    alignItems: "center",
    justifyContent: "center",
  },
});
