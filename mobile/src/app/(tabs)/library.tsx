import { ScrollView, StyleSheet, View } from "react-native";
import { ListRow, SectionHeader, categoryIcon } from "../../components/ui";
import { useContent } from "../../lib/content";
import { space, useTheme } from "../../lib/theme";

export default function LibraryScreen() {
  const theme = useTheme();
  const content = useContent();

  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={styles.container}
    >
      <SectionHeader top={false}>Research categories</SectionHeader>
      <View style={styles.list}>
        {content.categories.map((category) => (
          <ListRow
            key={category.slug}
            href={`/category/${category.slug}`}
            icon={categoryIcon(category.icon)}
            title={category.title}
            subtitle={category.description}
          />
        ))}
      </View>

      <SectionHeader>Study sections</SectionHeader>
      <View style={styles.list}>
        <ListRow
          href="/section/islam-overview"
          icon="school-outline"
          title="Islam Overview"
          subtitle="Foundations, worship, and the question every path leads to."
        />
        <ListRow
          href="/section/islam-christianity"
          icon="git-compare-outline"
          title="Islam & Christianity"
          subtitle="The full comparison tree: nine branches, every study question."
        />
        <ListRow
          href="/section/atheism-agnosticism"
          icon="help-circle-outline"
          title="Atheism & Agnosticism"
          subtitle="Planned answers for skeptics and honest doubt."
        />
        <ListRow
          href="/section/people-of-palestine"
          icon="people-outline"
          title="People of Palestine"
          subtitle="A careful, human-centered study outline."
        />
      </View>

      <SectionHeader>Reference</SectionHeader>
      <View style={styles.list}>
        <ListRow
          href="/sources"
          icon="library-outline"
          title="Source Library"
          subtitle="Translations, primary texts, and citation status."
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: space.lg, gap: space.sm, paddingBottom: 48 },
  list: { gap: space.sm },
});
