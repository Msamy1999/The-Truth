/**
 * Theme system. Starts in the phone's mode ("system"); a header toggle sets
 * an explicit light/dark override, persisted to AsyncStorage.
 *
 * Palette is tuned per scheme (not naively inverted): dark surfaces are
 * lifted well above the background so cards read as cards, and the accent
 * is brighter on dark for contrast.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useColorScheme } from "react-native";

export type Palette = {
  background: string;
  card: string;
  cardPressed: string;
  foreground: string;
  muted: string;
  mutedForeground: string;
  border: string;
  hairline: string;
  accent: string;
  accentSoft: string;
  onAccent: string;
  gold: string;
  goldSoft: string;
  shadow: string;
};

export const palettes: { light: Palette; dark: Palette } = {
  light: {
    background: "#f4f8f6",
    card: "#ffffff",
    cardPressed: "#eef4f1",
    foreground: "#16211d",
    muted: "#e7efeb",
    mutedForeground: "#5b6a64",
    border: "#dbe5e0",
    hairline: "#e7eeea",
    accent: "#0e7568",
    accentSoft: "rgba(14, 117, 104, 0.10)",
    onAccent: "#ffffff",
    gold: "#9a6a10",
    goldSoft: "rgba(200, 148, 31, 0.14)",
    shadow: "rgba(22, 33, 29, 0.08)",
  },
  dark: {
    background: "#0e1613",
    card: "#1a2621",
    cardPressed: "#20302a",
    foreground: "#e9f2ee",
    muted: "#243129",
    mutedForeground: "#9fb3ab",
    border: "#2d3d36",
    hairline: "#22322b",
    accent: "#4dd0bd",
    accentSoft: "rgba(77, 208, 189, 0.13)",
    onAccent: "#08211c",
    gold: "#e8c25a",
    goldSoft: "rgba(232, 194, 90, 0.13)",
    shadow: "rgba(0, 0, 0, 0.45)",
  },
};

/** Spacing scale (4pt rhythm). */
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28 } as const;

/** Corner radii. */
export const radius = { sm: 8, md: 12, lg: 16 } as const;

/** Type scale: [fontSize, lineHeight, fontWeight]. */
export const type = {
  display: { fontSize: 28, lineHeight: 34, fontWeight: "800" },
  title: { fontSize: 20, lineHeight: 26, fontWeight: "700" },
  cardTitle: { fontSize: 16, lineHeight: 22, fontWeight: "600" },
  body: { fontSize: 15, lineHeight: 23, fontWeight: "400" },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: "400" },
  label: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
} as const;

export const siteName = "The Straight Path";
export const siteNameArabic = "الصراط المستقيم";

type ThemeMode = "system" | "light" | "dark";

type ThemeContextValue = {
  palette: Palette;
  scheme: "light" | "dark";
  mode: ThemeMode;
  toggle: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

const MODE_KEY = "theme-mode-v1";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme() ?? "light";
  const [mode, setMode] = useState<ThemeMode>("system");

  useEffect(() => {
    AsyncStorage.getItem(MODE_KEY).then((stored) => {
      if (stored === "light" || stored === "dark" || stored === "system") {
        setMode(stored);
      }
    });
  }, []);

  const value = useMemo<ThemeContextValue>(() => {
    const scheme = mode === "system" ? systemScheme : mode;

    return {
      palette: palettes[scheme],
      scheme,
      mode,
      toggle: () => {
        setMode(() => {
          // Toggle relative to what the user currently sees.
          const next = scheme === "dark" ? "light" : "dark";
          AsyncStorage.setItem(MODE_KEY, next).catch(() => {});
          return next;
        });
      },
    };
  }, [mode, systemScheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemeContext(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useThemeContext must be used inside ThemeProvider");
  }
  return context;
}

/** The palette for the active scheme (most components only need this). */
export function useTheme(): Palette {
  return useThemeContext().palette;
}
