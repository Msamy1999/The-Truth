import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { ArticleBody } from "../components/ArticleBody";
import { Body, Card, Pill, SectionHeader } from "../components/ui";
import { useContent } from "../lib/content";
import { openExternalReference } from "../lib/links";
import { radius, space, type, useTheme } from "../lib/theme";

export default function ClaimsAgainstIslamScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { claimsAgainstIslam } = useContent();
  const [openId, setOpenId] = useState<string | null>(null);

  const openLink = (href: string) => {
    if (href.startsWith("/articles/")) {
      router.push(href.replace("/articles/", "/article/") as never);
      return;
    }
    void openExternalReference(href);
  };

  return (
    <>
      <Stack.Screen options={{ title: "Claims Against Islam" }} />
      <ScrollView
        style={{ backgroundColor: theme.background }}
        contentContainerStyle={styles.container}
      >
        <SectionHeader top={false}>Questions and responses</SectionHeader>
        <Text style={[type.display, styles.title, { color: theme.foreground }]}>
          Common claims against Islam
        </Text>
        <Body>
          Open a claim to read a concise response and the primary Islamic texts
          that support it.
        </Body>

        <View style={styles.list}>
          {claimsAgainstIslam.map((item, index) => {
            const open = item.id === openId;
            return (
              <Card key={item.id} style={styles.claimCard}>
                <Pressable
                  onPress={() => setOpenId(open ? null : item.id)}
                  accessibilityRole="button"
                  accessibilityState={{ expanded: open }}
                  accessibilityLabel={`${open ? "Close" : "Open"} ${item.title}`}
                  style={({ pressed }) => [
                    styles.claimHeader,
                    { opacity: pressed ? 0.7 : 1 },
                  ]}
                >
                  <View style={styles.claimTitleRow}>
                    <View
                      style={[
                        styles.number,
                        { backgroundColor: theme.accentSoft },
                      ]}
                    >
                      <Text style={[styles.numberText, { color: theme.accent }]}>
                        {index + 1}
                      </Text>
                    </View>
                    <Text style={[type.cardTitle, styles.claimTitle, { color: theme.foreground }]}>
                      {item.title}
                    </Text>
                  </View>
                  <Ionicons
                    name={open ? "chevron-up" : "chevron-down"}
                    size={18}
                    color={theme.accent}
                  />
                </Pressable>

                {open ? (
                  <View
                    style={[
                      styles.claimBody,
                      { borderTopColor: theme.hairline },
                    ]}
                  >
                    <Text style={[styles.label, { color: theme.accent }]}>Claim</Text>
                    <ArticleBody>{item.claim}</ArticleBody>
                    <Text style={[styles.label, { color: theme.accent }]}>Response</Text>
                    {item.response.map((paragraph) => (
                      <ArticleBody key={paragraph}>{paragraph}</ArticleBody>
                    ))}
                    <Text style={[styles.label, { color: theme.accent }]}>Evidence</Text>
                    <View style={styles.evidenceList}>
                      {item.evidence.map((source) => (
                        <Pressable
                          key={`${source.kind}-${source.reference}`}
                          onPress={() => openLink(source.href)}
                          accessibilityRole="link"
                          accessibilityLabel={`Open ${source.reference}`}
                          style={({ pressed }) => [
                            styles.evidence,
                            {
                              backgroundColor: theme.accentSoft,
                              opacity: pressed ? 0.7 : 1,
                            },
                          ]}
                        >
                          <Pill label={source.kind} tone="accent" />
                          <View style={styles.evidenceText}>
                            <Text style={[styles.reference, { color: theme.foreground }]}>
                              {source.reference}
                            </Text>
                            <Text style={[type.caption, { color: theme.mutedForeground }]}>
                              {source.summary}
                            </Text>
                          </View>
                          <Ionicons name="open-outline" size={15} color={theme.accent} />
                        </Pressable>
                      ))}
                    </View>
                    {item.links?.length ? (
                      <View style={styles.relatedLinks}>
                        {item.links.map((link) => (
                          <Pressable
                            key={link.href}
                            onPress={() => openLink(link.href)}
                            accessibilityRole="link"
                            style={({ pressed }) => [
                              styles.relatedLink,
                              {
                                borderColor: theme.border,
                                opacity: pressed ? 0.7 : 1,
                              },
                            ]}
                          >
                            <Text style={[styles.relatedLinkText, { color: theme.accent }]}>
                              {link.label}
                            </Text>
                          </Pressable>
                        ))}
                      </View>
                    ) : null}
                  </View>
                ) : null}
              </Card>
            );
          })}
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { padding: space.lg, gap: space.sm, paddingBottom: 64 },
  title: { fontSize: 25, lineHeight: 32 },
  list: { gap: space.sm, marginTop: space.md },
  claimCard: { padding: 0, gap: 0, overflow: "hidden" },
  claimHeader: {
    minHeight: 58,
    padding: space.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: space.sm,
  },
  claimTitleRow: { flex: 1, flexDirection: "row", alignItems: "center", gap: space.sm },
  claimTitle: { flex: 1, fontSize: 15, lineHeight: 21 },
  number: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  numberText: { fontSize: 12, fontWeight: "800" },
  claimBody: { borderTopWidth: StyleSheet.hairlineWidth, padding: space.md, gap: space.md },
  label: { fontSize: 11, lineHeight: 15, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.7 },
  evidenceList: { gap: space.sm },
  evidence: {
    minHeight: 54,
    borderRadius: radius.md,
    padding: space.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
  },
  evidenceText: { flex: 1, gap: 2 },
  reference: { fontSize: 13, lineHeight: 18, fontWeight: "700" },
  relatedLinks: { flexDirection: "row", flexWrap: "wrap", gap: space.sm },
  relatedLink: { minHeight: 44, borderWidth: StyleSheet.hairlineWidth, borderRadius: 999, paddingHorizontal: 13, justifyContent: "center" },
  relatedLinkText: { fontSize: 12.5, fontWeight: "700" },
});
