/**
 * Local reader state: bookmarks and reading font scale. Device-local only —
 * no accounts, no tracking (keeps the store privacy forms trivially clean).
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";

const BOOKMARKS_KEY = "bookmarks-v1";
const FONT_SCALE_KEY = "font-scale-v1";

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<string[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(BOOKMARKS_KEY).then((stored) => {
      if (stored) setBookmarks(JSON.parse(stored));
    });
  }, []);

  const toggle = useCallback((slug: string) => {
    setBookmarks((current) => {
      const next = current.includes(slug)
        ? current.filter((item) => item !== slug)
        : [...current, slug];
      AsyncStorage.setItem(BOOKMARKS_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  return { bookmarks, toggle };
}

export const FONT_SCALES = [1, 1.15, 1.3] as const;

export function useFontScale() {
  const [scaleIndex, setScaleIndex] = useState(0);

  useEffect(() => {
    AsyncStorage.getItem(FONT_SCALE_KEY).then((stored) => {
      if (stored) setScaleIndex(Number(stored) || 0);
    });
  }, []);

  const cycle = useCallback(() => {
    setScaleIndex((current) => {
      const next = (current + 1) % FONT_SCALES.length;
      AsyncStorage.setItem(FONT_SCALE_KEY, String(next)).catch(() => {});
      return next;
    });
  }, []);

  return { fontScale: FONT_SCALES[scaleIndex], cycle };
}
