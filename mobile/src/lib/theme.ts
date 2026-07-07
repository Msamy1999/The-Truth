import { useColorScheme } from "react-native";

/**
 * Palette mirroring the website's CSS variables (app/(frontend)/globals.css)
 * so the app and site feel like one product.
 */
export type Palette = {
  background: string;
  foreground: string;
  card: string;
  muted: string;
  mutedForeground: string;
  border: string;
  accent: string;
  accentForeground: string;
  gold: string;
  goldSoft: string;
};

export const palettes: { light: Palette; dark: Palette } = {
  light: {
    background: "#f7faf9",
    foreground: "#18241f",
    card: "#ffffff",
    muted: "#eef2f6",
    mutedForeground: "#515f6c",
    border: "#d3ded9",
    accent: "#17786a",
    accentForeground: "#ffffff",
    gold: "#c8941f",
    goldSoft: "#f7edd8",
  },
  dark: {
    background: "#101a17",
    foreground: "#e6f0ec",
    card: "#171f1c",
    muted: "#232e2a",
    mutedForeground: "#aab8b2",
    border: "#3a4642",
    accent: "#3bc2af",
    accentForeground: "#0b1613",
    gold: "#e6b83d",
    goldSoft: "#332b16",
  },
};

export function useTheme(): Palette {
  const scheme = useColorScheme();
  return scheme === "dark" ? palettes.dark : palettes.light;
}

export const siteName = "The Straight Path";
export const siteNameArabic = "الصراط المستقيم";
