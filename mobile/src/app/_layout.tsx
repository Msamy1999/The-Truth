import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useColorScheme } from "react-native";
import { palettes } from "../lib/theme";

export default function RootLayout() {
  const scheme = useColorScheme();
  const theme = scheme === "dark" ? palettes.dark : palettes.light;

  return (
    <>
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: theme.background },
          headerTintColor: theme.foreground,
          headerTitleStyle: { fontWeight: "700" },
          contentStyle: { backgroundColor: theme.background },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="article/[slug]" options={{ title: "Article" }} />
        <Stack.Screen name="category/[slug]" options={{ title: "Category" }} />
        <Stack.Screen name="section/[slug]" options={{ title: "Section" }} />
        <Stack.Screen name="sources" options={{ title: "Source Library" }} />
      </Stack>
    </>
  );
}
