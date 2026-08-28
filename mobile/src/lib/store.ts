/**
 * Local reader state: bookmarks and reading font scale. Device-local only —
 * no accounts, no tracking (keeps the store privacy forms trivially clean).
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useSyncExternalStore } from "react";

const BOOKMARKS_KEY = "bookmarks-v1";
const FONT_SCALE_KEY = "font-scale-v1";

type Listener = () => void;

let bookmarkSnapshot: string[] = [];
let bookmarkHydration: Promise<void> | null = null;
let bookmarksChangedLocally = false;
const bookmarkListeners = new Set<Listener>();

function emitBookmarks() {
  for (const listener of bookmarkListeners) listener();
}

function subscribeBookmarks(listener: Listener) {
  bookmarkListeners.add(listener);
  return () => bookmarkListeners.delete(listener);
}

function getBookmarkSnapshot() {
  return bookmarkSnapshot;
}

function hydrateBookmarks() {
  bookmarkHydration ??= AsyncStorage.getItem(BOOKMARKS_KEY)
    .then((stored) => {
      if (!stored || bookmarksChangedLocally) return;
      const parsed: unknown = JSON.parse(stored);
      if (!Array.isArray(parsed)) return;
      bookmarkSnapshot = [
        ...new Set(
          parsed.filter(
            (item): item is string =>
              typeof item === "string" && item.trim().length > 0,
          ),
        ),
      ].slice(0, 1_000);
      emitBookmarks();
    })
    .catch(() => {
      // A malformed or unavailable preference must never break the reader.
    });
  return bookmarkHydration;
}

export function useBookmarks() {
  const bookmarks = useSyncExternalStore(
    subscribeBookmarks,
    getBookmarkSnapshot,
    getBookmarkSnapshot,
  );

  useEffect(() => {
    void hydrateBookmarks();
  }, []);

  const toggle = useCallback((slug: string) => {
    bookmarksChangedLocally = true;
    bookmarkSnapshot = bookmarkSnapshot.includes(slug)
      ? bookmarkSnapshot.filter((item) => item !== slug)
      : [...bookmarkSnapshot, slug];
    emitBookmarks();
    void AsyncStorage.setItem(
      BOOKMARKS_KEY,
      JSON.stringify(bookmarkSnapshot),
    ).catch(() => {
      // The in-memory preference still works for this session.
    });
  }, []);

  return { bookmarks, toggle };
}

export const FONT_SCALES = [1, 1.15, 1.3] as const;

let fontScaleIndex = 0;
let fontScaleHydration: Promise<void> | null = null;
let fontScaleChangedLocally = false;
const fontScaleListeners = new Set<Listener>();

function emitFontScale() {
  for (const listener of fontScaleListeners) listener();
}

function subscribeFontScale(listener: Listener) {
  fontScaleListeners.add(listener);
  return () => fontScaleListeners.delete(listener);
}

function getFontScaleSnapshot() {
  return fontScaleIndex;
}

function hydrateFontScale() {
  fontScaleHydration ??= AsyncStorage.getItem(FONT_SCALE_KEY)
    .then((stored) => {
      if (stored === null || fontScaleChangedLocally) return;
      const parsed = Number(stored);
      if (!Number.isInteger(parsed) || parsed < 0 || parsed >= FONT_SCALES.length) {
        return;
      }
      fontScaleIndex = parsed;
      emitFontScale();
    })
    .catch(() => {
      // Keep the safe default when storage is unavailable or malformed.
    });
  return fontScaleHydration;
}

export function useFontScale() {
  const scaleIndex = useSyncExternalStore(
    subscribeFontScale,
    getFontScaleSnapshot,
    getFontScaleSnapshot,
  );

  useEffect(() => {
    void hydrateFontScale();
  }, []);

  const cycle = useCallback(() => {
    fontScaleChangedLocally = true;
    fontScaleIndex = (fontScaleIndex + 1) % FONT_SCALES.length;
    emitFontScale();
    void AsyncStorage.setItem(FONT_SCALE_KEY, String(fontScaleIndex)).catch(
      () => {
        // The in-memory preference still works for this session.
      },
    );
  }, []);

  return { fontScale: FONT_SCALES[scaleIndex], cycle };
}
