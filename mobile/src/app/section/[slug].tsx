import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Pill, SectionHeader } from "../../components/ui";
import { getTrees } from "../../lib/content";
import { useTheme, radius, space, type } from "../../lib/theme";
import type { ResearchTreeNode } from "../../lib/types";

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
        <SectionHeader top={false}>Study map</SectionHeader>
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
  const router = useRouter();
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
          style={({ pressed }) => [
            styles.branchHeader,
            pressed && { opacity: 0.7 },
          ]}
        >
          <View
            style={[styles.chevronBadge, { backgroundColor: theme.accentSoft }]}
          >
            <Ionicons
              name={open ? "chevron-down" : "chevron-forward"}
              size={14}
              color={theme.accent}
            />
          </View>
          <Text
            style={[type.cardTitle, { color: theme.foreground, flex: 1 }]}
          >
            {node.title}
          </Text>
          {node.children ? (
            <Text style={[type.caption, { color: theme.mutedForeground }]}>
              {node.children.length}
            </Text>
          ) : null}
        </Pressable>
        {open ? (
          <View style={[styles.children, { borderLeftColor: theme.hairline }]}>
            {node.children!.map((child, index) => (
              <TreeNode
                key={child.id ?? `${child.title}-${index}`}
                node={child}
              />
            ))}
          </View>
        ) : null}
      </View>
    );
  }

  const inner = (
    <>
      <Ionicons
        name="document-text-outline"
        size={15}
        color={route ? theme.accent : theme.mutedForeground}
      />
      <Text
        style={[
          type.body,
          {
            color: theme.foreground,
            flex: 1,
            fontSize: 14.5,
          },
        ]}
      >
        {node.title}
      </Text>
      {node.status ? <Pill label={node.status} tone="gold" /> : null}
      {!node.status && node.tag ? <Pill label={node.tag} /> : null}
      {route ? (
        <Ionicons
          name="chevron-forward"
          size={14}
          color={theme.mutedForeground}
          style={{ opacity: 0.7 }}
        />
      ) : null}
    </>
  );

  if (route) {
    return (
      <Pressable
        onPress={() => router.push(route as never)}
        accessibilityRole="link"
        style={({ pressed }) => [styles.leaf, pressed && { opacity: 0.6 }]}
      >
        {inner}
      </Pressable>
    );
  }

  return <View style={styles.leaf}>{inner}</View>;
}

const styles = StyleSheet.create({
  container: { padding: space.lg, gap: space.sm, paddingBottom: 48 },
  list: { gap: space.sm },
  branch: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.lg,
    padding: space.md,
    gap: space.xs,
  },
  branchHeader: { flexDirection: "row", alignItems: "center", gap: space.md },
  chevronBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  children: {
    borderLeftWidth: 1,
    marginLeft: 12,
    paddingLeft: space.md,
    marginTop: space.xs,
    gap: 2,
  },
  leaf: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
    paddingVertical: 8,
  },
});
