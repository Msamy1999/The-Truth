import { Link } from "expo-router";
import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../lib/theme";

export function Card({
  children,
  onPress,
}: {
  children: ReactNode;
  onPress?: () => void;
}) {
  const theme = useTheme();
  const style = [
    styles.card,
    { backgroundColor: theme.card, borderColor: theme.border },
  ];

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [...style, pressed && { opacity: 0.85 }]}
      >
        {children}
      </Pressable>
    );
  }

  return <View style={style}>{children}</View>;
}

export function LinkCard({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  const theme = useTheme();

  return (
    <Link href={href as never} asChild>
      <Pressable
        style={({ pressed }) => [
          styles.card,
          { backgroundColor: theme.card, borderColor: theme.border },
          pressed && { opacity: 0.85 },
        ]}
      >
        {children}
      </Pressable>
    </Link>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  const theme = useTheme();
  return (
    <Text style={[styles.eyebrow, { color: theme.accent }]}>{children}</Text>
  );
}

export function Title({
  children,
  size = 22,
}: {
  children: ReactNode;
  size?: number;
}) {
  const theme = useTheme();
  return (
    <Text
      style={{
        color: theme.foreground,
        fontSize: size,
        fontWeight: "700",
        lineHeight: size * 1.3,
      }}
    >
      {children}
    </Text>
  );
}

export function Body({
  children,
  muted = true,
  scale = 1,
}: {
  children: ReactNode;
  muted?: boolean;
  scale?: number;
}) {
  const theme = useTheme();
  return (
    <Text
      style={{
        color: muted ? theme.mutedForeground : theme.foreground,
        fontSize: 15 * scale,
        lineHeight: 23 * scale,
      }}
    >
      {children}
    </Text>
  );
}

export function Pill({
  label,
  tone = "muted",
}: {
  label: string;
  tone?: "muted" | "gold" | "accent";
}) {
  const theme = useTheme();
  const background =
    tone === "gold"
      ? theme.goldSoft
      : tone === "accent"
        ? theme.accent
        : theme.muted;
  const color =
    tone === "gold"
      ? theme.gold
      : tone === "accent"
        ? theme.accentForeground
        : theme.mutedForeground;

  return (
    <View style={[styles.pill, { backgroundColor: background }]}>
      <Text style={[styles.pillText, { color }]}>{label}</Text>
    </View>
  );
}

export function StatusPill({ status }: { status: string }) {
  const labels: Record<string, string> = {
    draft: "Draft",
    reviewed: "Under review",
    published: "Published",
    pending: "Source pending",
    verified: "Verified",
  };
  return (
    <Pill
      label={labels[status] ?? status}
      tone={status === "published" || status === "verified" ? "accent" : "gold"}
    />
  );
}

export function Row({ children }: { children: ReactNode }) {
  return <View style={styles.row}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    gap: 6,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  pill: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: "flex-start",
  },
  pillText: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    alignItems: "center",
  },
});
