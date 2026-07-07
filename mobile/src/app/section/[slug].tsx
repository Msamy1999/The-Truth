import { Ionicons } from "@expo/vector-icons";
import { Link, Stack, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Body, Eyebrow, Pill, Row, Title } from "../../components/ui";
import { getTrees } from "../../lib/content";
import type { ResearchTreeNode } from "../../lib/types";
import { useTheme } from "../../lib/theme";

const SECTION_TITLES: Record<string, string> = {
  "islam-overview": "Islam Overview",
  "islam-christianity": "Islam & Christianity",
  "atheism-agnosticism": "Atheism & Agnosticism",
  "people-of-palestine": "People of Palestine",
};

function toAppRoute(href: string | undefined): string | undefined {
  if (!href) return undefined;
  if (href.startsWith("/articles/")) {
    return href.replace("/articles/", "/article/");
  }
  // Category hrefs like /jesus or /preservation#future-topics.
  const clean = href.split("#")[0].replace(/^\//, "");
  if (!clean) return undefined;
  return `/category/${clean}`;
}

export default function SectionScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const theme = useTheme();
  const trees = getTrees();
  const nodes: ResearchTreeNode[] = trees[slug ?? ""] ?? [];
  const title = SECTION_TITLES[slug ?? ""] ?? "Section";

  return (
    <>
      <Stack.Screen options={{ title }} />
      <ScrollView
        style={{ backgroundColor: theme.background }}
        contentContainerStyle={styles.container}
      >
        <Eyebrow>Study map</Eyebrow>
        <View style={styles.list}>
          {nodes.map((node, index) => (
            <TreeNode key={node.id ?? `${node.title}-${index}`} node={node} />
          ))}
        </View>
      </ScrollView>
    </>
  );
}

function TreeNode({ node }: { node: ResearchTreeNode }) {
  const theme = useTheme();
  const [open, setOpen] = useState(Boolean(node.defaultOpen));
  const hasChildren = Boolean(node.children?.length);
  const route = toAppRoute(node.href);

  if (hasChildren) {
    return (
      <View
        style={[
          styles.branch,
          { backgroundColor: theme.card, borderColor: theme.border },
        ]}
      >
        <Pressable
          onPress={() => setOpen((current) => !current)}
          accessibilityRole="button"
          accessibilityLabel={`${open ? "Collapse" : "Expand"} ${node.title}`}
          style={styles.branchHeader}
        >
          <Ionicons
            name={open ? "chevron-down" : "chevron-forward"}
            size={16}
            color={theme.accent}
          />
          <View style={{ flex: 1 }}>
            <Title size={15}>{node.title}</Title>
          </View>
        </Pressable>
        {open ? (
          <View style={[styles.children, { borderLeftColor: theme.border }]}>
            {node.children!.map((child, index) => (
              <TreeNode key={child.id ?? `${child.title}-${index}`} node={child} />
            ))}
          </View>
        ) : null}
      </View>
    );
  }

  const inner = (
    <Row>
      <Ionicons
        name="document-text-outline"
        size={14}
        color={theme.mutedForeground}
      />
      <View style={{ flex: 1 }}>
        <Body muted={false}>{node.title}</Body>
      </View>
      {node.tag ? <Pill label={node.tag} /> : null}
      {node.status ? <Pill label={node.status} tone="gold" /> : null}
    </Row>
  );

  if (route) {
    return (
      <Link href={route as never} asChild>
        <Pressable style={styles.leaf}>{inner}</Pressable>
      </Link>
    );
  }

  return <View style={styles.leaf}>{inner}</View>;
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 8, paddingBottom: 48 },
  list: { gap: 10 },
  branch: { borderWidth: 1, borderRadius: 12, padding: 10, gap: 4 },
  branchHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  children: { borderLeftWidth: 1, marginLeft: 7, paddingLeft: 10, gap: 2 },
  leaf: { paddingVertical: 7 },
});
