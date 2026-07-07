import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider as NavigationThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
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
