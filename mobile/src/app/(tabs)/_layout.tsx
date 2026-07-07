import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { ThemeToggleButton } from "../../components/ui";
import { useThemeContext } from "../../lib/theme";

function tabIcon(
  outline: keyof typeof Ionicons.glyphMap,
  filled: keyof typeof Ionicons.glyphMap,
) {
  return ({
    color,
    size,
    focused,
  }: {
    color: string;
    size: number;
    focused: boolean;
  }) => <Ionicons name={focused ? filled : outline} size={size} color={color} />;
}

export default function TabsLayout() {
  const { palette } = useThemeContext();

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: palette.background },
        headerTintColor: palette.foreground,
        headerTitleStyle: { fontWeight: "700" },
        headerShadowVisible: false,
        headerRight: () => <ThemeToggleButton />,
        headerRightContainerStyle: { paddingRight: 16 },
        tabBarStyle: {
          backgroundColor: palette.card,
          borderTopColor: palette.hairline,
        },
        tabBarActiveTintColor: palette.accent,
        tabBarInactiveTintColor: palette.mutedForeground,
        tabBarLabelStyle: { fontWeight: "600", fontSize: 10.5 },
        sceneStyle: { backgroundColor: palette.background },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: tabIcon("home-outline", "home"),
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          title: "Library",
          tabBarIcon: tabIcon("library-outline", "library"),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: "Search",
          tabBarIcon: tabIcon("search-outline", "search"),
        }}
      />
      <Tabs.Screen
        name="glossary"
        options={{
          title: "Glossary",
          tabBarIcon: tabIcon("reader-outline", "reader"),
        }}
      />
    </Tabs>
  );
}
