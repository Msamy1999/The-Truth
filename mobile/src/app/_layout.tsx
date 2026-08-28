import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider as NavigationThemeProvider,
} from "@react-navigation/native";
import { type ErrorBoundaryProps, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Pressable, StyleSheet, Text, useColorScheme, View } from "react-native";
import { ThemeToggleButton } from "../components/ui";
import { ThemeProvider, useThemeContext } from "../lib/theme";

function ThemedStack() {
  const { palette, scheme } = useThemeContext();

  // Feed the palette into React Navigation's theme so headers, tab bars,
  // and transitions recolor reliably on theme change (on every platform).
  const navigationTheme = {
    ...(scheme === "dark" ? DarkTheme : DefaultTheme),
    colors: {
      ...(scheme === "dark" ? DarkTheme.colors : DefaultTheme.colors),
      primary: palette.accent,
      background: palette.background,
      card: palette.background,
      text: palette.foreground,
      border: palette.hairline,
    },
  };

  return (
    <NavigationThemeProvider value={navigationTheme}>
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: palette.background },
          headerTintColor: palette.foreground,
          headerTitleStyle: { fontWeight: "700" },
          headerShadowVisible: false,
          headerRight: () => <ThemeToggleButton />,
          contentStyle: { backgroundColor: palette.background },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="article/[slug]" options={{ title: "" }} />
        <Stack.Screen name="category/[slug]" options={{ title: "" }} />
        <Stack.Screen name="section/[slug]" options={{ title: "" }} />
        <Stack.Screen name="sources" options={{ title: "Source Library" }} />
        <Stack.Screen name="claims" options={{ title: "Claims Against Islam" }} />
      </Stack>
    </NavigationThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <ThemedStack />
    </ThemeProvider>
  );
}

export function ErrorBoundary({ retry }: ErrorBoundaryProps) {
  const dark = useColorScheme() === "dark";
  const background = dark ? "#101a17" : "#f7faf8";
  const foreground = dark ? "#f1f7f4" : "#10201c";
  const muted = dark ? "#b3c2bd" : "#51625d";

  return (
    <View style={[errorStyles.container, { backgroundColor: background }]}>
      <Text style={[errorStyles.title, { color: foreground }]}>Something went wrong</Text>
      <Text style={[errorStyles.body, { color: muted }]}>The reader could not open this screen. Your bookmarks and reading settings are safe.</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Try loading this screen again"
        onPress={() => void retry()}
        style={({ pressed }) => [
          errorStyles.retry,
          { backgroundColor: "#2fb6aa", opacity: pressed ? 0.75 : 1 },
        ]}
      >
        <Text style={errorStyles.retryText}>Try again</Text>
      </Pressable>
    </View>
  );
}

const errorStyles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 28,
    gap: 14,
  },
  title: { fontSize: 22, lineHeight: 29, fontWeight: "800", textAlign: "center" },
  body: { fontSize: 15, lineHeight: 22, textAlign: "center", maxWidth: 420 },
  retry: {
    minHeight: 48,
    minWidth: 132,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  retryText: { color: "#061d1a", fontSize: 15, fontWeight: "800" },
});
