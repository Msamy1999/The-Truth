import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import type { ComponentProps, ReactNode } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { radius, space, type, useTheme, useThemeContext } from "../lib/theme";

type IoniconName = ComponentProps<typeof Ionicons>["name"];

// ---------------------------------------------------------------------------
// Icons for the library's category slugs (mirrors the website's icon map)
// ---------------------------------------------------------------------------

const CATEGORY_ICONS: Record<string, IoniconName> = {
  scripture: "book-outline",
  jesus: "heart-outline",
  preservation: "shield-checkmark-outline",
  questions: "help-circle-outline",
  science: "flask-outline",
  history: "time-outline",
  theology: "scale-outline",
  salvation: "compass-outline",
  prophecies: "sparkles-outline",
  glossary: "reader-outline",
  sources: "library-outline",
};

export function categoryIcon(slug: string): IoniconName {
  return CATEGORY_ICONS[slug] ?? "document-text-outline";
}

// ---------------------------------------------------------------------------
// Surfaces
// ---------------------------------------------------------------------------

function surfaceShadow(shadowColor: string): ViewStyle {
  return Platform.select<ViewStyle>({
    ios: {
      shadowColor,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 1,
      shadowRadius: 6,
    },
    android: { elevation: 2 },
    default: {},
  })!;
}

export function Card({
  children,
  onPress,
  style,
}: {
  children: ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();
  const base: StyleProp<ViewStyle> = [
    styles.card,
    {
      backgroundColor: theme.card,
      borderColor: theme.border,
      ...surfaceShadow(theme.shadow),
    },
    style,
  ];

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          base,
          pressed && { backgroundColor: theme.cardPressed },
        ]}
      >
        {children}
      </Pressable>
    );
  }

  return <View style={base}>{children}</View>;
}

export function LinkCard({
  href,
  children,
  style,
}: {
  href: string;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();
  const router = useRouter();

  return (
    <Pressable
      onPress={() => router.push(href as never)}
      accessibilityRole="link"
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: pressed ? theme.cardPressed : theme.card,
          borderColor: theme.border,
          ...surfaceShadow(theme.shadow),
        },
        style,
      ]}
    >
      {children}
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Icon badge + list row (the workhorse of every screen)
// ---------------------------------------------------------------------------

export function IconBadge({
  icon,
  size = 38,
  tone = "accent",
}: {
  icon: IoniconName;
  size?: number;
  tone?: "accent" | "gold";
}) {
  const theme = useTheme();
  const background = tone === "gold" ? theme.goldSoft : theme.accentSoft;
  const color = tone === "gold" ? theme.gold : theme.accent;

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radius.md,
        backgroundColor: background,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Ionicons name={icon} size={size * 0.5} color={color} />
    </View>
  );
}

export function ListRow({
  href,
  icon,
  title,
  subtitle,
  pill,
  onPress,
}: {
  href?: string;
  icon?: IoniconName;
  title: string;
  subtitle?: string;
  pill?: ReactNode;
  onPress?: () => void;
}) {
  const theme = useTheme();
  const router = useRouter();

  const inner = (
    <>
      {icon ? <IconBadge icon={icon} /> : null}
      <View style={styles.rowBody}>
        <View style={styles.rowTitleLine}>
          <Text
            style={[type.cardTitle, { color: theme.foreground, flexShrink: 1 }]}
            numberOfLines={2}
          >
            {title}
          </Text>
          {pill}
        </View>
        {subtitle ? (
          <Text
            style={[type.caption, { color: theme.mutedForeground }]}
            numberOfLines={2}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
      {href || onPress ? (
        <Ionicons
          name="chevron-forward"
          size={17}
          color={theme.mutedForeground}
          style={{ opacity: 0.7 }}
        />
      ) : null}
    </>
  );

  const rowStyle = ({ pressed }: { pressed: boolean }) => [
    styles.row,
    {
      backgroundColor: pressed ? theme.cardPressed : theme.card,
      borderColor: theme.border,
      ...surfaceShadow(theme.shadow),
    },
  ];

  if (href || onPress) {
    return (
      <Pressable
        onPress={onPress ?? (() => router.push(href as never))}
        accessibilityRole="link"
        style={rowStyle}
      >
        {inner}
      </Pressable>
    );
  }

  return (
    <View
      style={[
        styles.row,
        {
          backgroundColor: theme.card,
          borderColor: theme.border,
          ...surfaceShadow(theme.shadow),
        },
      ]}
    >
      {inner}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Typography
// ---------------------------------------------------------------------------

export function SectionHeader({
  children,
  top = true,
}: {
  children: ReactNode;
  top?: boolean;
}) {
  const theme = useTheme();
  return (
    <Text
      style={[
        type.label,
        {
          color: theme.accent,
          marginTop: top ? space.lg : 0,
          marginBottom: space.xs,
        },
      ]}
    >
      {children}
    </Text>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  const theme = useTheme();
  return <Text style={[type.label, { color: theme.accent }]}>{children}</Text>;
}

export function Title({
  children,
  size = 20,
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
        fontSize: type.body.fontSize * scale,
        lineHeight: type.body.lineHeight * scale,
      }}
    >
      {children}
    </Text>
  );
}

// ---------------------------------------------------------------------------
// Pills
// ---------------------------------------------------------------------------

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
        ? theme.accentSoft
        : theme.muted;
  const color =
    tone === "gold"
      ? theme.gold
      : tone === "accent"
        ? theme.accent
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
  return <View style={styles.chipRow}>{children}</View>;
}

// ---------------------------------------------------------------------------
// Theme toggle (header button): sun in dark mode, moon in light mode
// ---------------------------------------------------------------------------

export function ThemeToggleButton() {
  const { scheme, toggle, palette } = useThemeContext();

  return (
    <Pressable
      onPress={toggle}
      hitSlop={10}
      accessibilityLabel={
        scheme === "dark" ? "Switch to light mode" : "Switch to dark mode"
      }
      style={({ pressed }) => [
        styles.toggle,
        {
          backgroundColor: palette.accentSoft,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <Ionicons
        name={scheme === "dark" ? "sunny-outline" : "moon-outline"}
        size={17}
        color={palette.accent}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.lg,
    padding: space.lg,
    gap: space.sm,
  },
  row: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.lg,
    padding: space.md,
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
  },
  rowBody: { flex: 1, gap: 3 },
  rowTitleLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
    flexWrap: "wrap",
  },
  pill: {
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 3,
    alignSelf: "flex-start",
  },
  pillText: {
    fontSize: 10.5,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    alignItems: "center",
  },
  toggle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
});
