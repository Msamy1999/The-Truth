/**
 * Article toolbar: "Read article" (text-to-speech via expo-speech) and
 * "Copy article" (expo-clipboard). Sits directly under the article header.
 *
 * TTS notes:
 * - expo-speech caps each utterance at Speech.maxSpeechInputLength (~4000
 *   chars), so the article text is chunked by paragraph/sentence and the
 *   chunks are chained through each utterance's onDone callback.
 * - Speech.pause()/resume() are iOS-only (the Android TTS engine cannot
 *   pause mid-utterance), so on Android we only offer Stop while speaking.
 */
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { useFocusEffect } from "expo-router";
import * as Speech from "expo-speech";
import type { ComponentProps } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { space, useTheme } from "../lib/theme";
import type { Article } from "../lib/types";
import { Card } from "./ui";

type IoniconName = ComponentProps<typeof Ionicons>["name"];

// ---------------------------------------------------------------------------
// Text preparation
// ---------------------------------------------------------------------------

/** Remove markdown artifacts (**bold**, *italic*, `code`, links, bullets). */
function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/__(.+?)__/g, "$1")
    .replace(/`([^`]*)`/g, "$1")
    .replace(/\[(.+?)\]\([^)]*\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^\s*[-*]\s+/gm, "");
}

/**
 * Full plain text of the article: title, subtitle, summary, then every
 * section title and body. (The mobile Article type has no FAQ field; if one
 * is added later, append its questions/answers here too.)
 */
export function buildArticleText(article: Article): string {
  const parts = [
    article.title,
    article.subtitle,
    article.summary,
    ...article.sections.flatMap((section) => [section.title, section.body]),
  ];
  return parts
    .filter(Boolean)
    .map((part) => stripMarkdown(part).trim())
    .filter(Boolean)
    .join("\n\n");
}

/**
 * Listening-only cleanup applied on top of `buildArticleText` before the text
 * is chunked for TTS. The Copy button keeps the untouched `buildArticleText`
 * output — this only changes what the speech engine hears:
 * - em/en dashes read badly ("dash"), so they become a comma pause;
 * - stray markdown/formatting symbols are dropped;
 * - runs of spaces/tabs collapse so the engine does not stutter.
 * Paragraph breaks (newlines) are preserved for the chunker.
 */
function prepareForSpeech(text: string): string {
  return text
    .replace(/\s*[—–]\s*/g, ", ")
    .replace(/[#*_`>|~]/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/ ?\n ?/g, "\n")
    .trim();
}

/**
 * Per-chunk target. Kept well under the platform's per-utterance limit
 * (Speech.maxSpeechInputLength, ~4000 chars) so whole sentences are always
 * accumulated into a chunk and inter-chunk pauses stay rare.
 */
const CHUNK_LIMIT = Math.max(
  500,
  Math.min(Speech.maxSpeechInputLength, 4000) - 200,
);

/** Split by paragraph, then sentence, then words — never above `limit`. */
function chunkText(text: string, limit: number): string[] {
  const chunks: string[] = [];
  let current = "";

  const flush = () => {
    if (current.trim()) chunks.push(current.trim());
    current = "";
  };
  const append = (piece: string) => {
    if (!piece.trim()) return;
    if (current.length + piece.length + 1 > limit) flush();
    current = current ? `${current}\n${piece}` : piece;
  };

  for (const paragraph of text.split(/\n+/)) {
    if (paragraph.length <= limit) {
      append(paragraph);
      continue;
    }
    // Paragraph too long: split into sentences (Latin + Arabic punctuation).
    const sentences = paragraph.match(/[^.!?؟]+[.!?؟]+["')\]]*\s*|[^.!?؟]+$/g) ?? [
      paragraph,
    ];
    for (const sentence of sentences) {
      if (sentence.length <= limit) {
        append(sentence.trim());
        continue;
      }
      // Sentence still too long: hard-split on words.
      let buffer = "";
      for (const word of sentence.split(/\s+/)) {
        if (buffer.length + word.length + 1 > limit) {
          append(buffer);
          flush();
          buffer = word;
        } else {
          buffer = buffer ? `${buffer} ${word}` : word;
        }
      }
      append(buffer);
    }
  }
  flush();
  return chunks;
}

// ---------------------------------------------------------------------------
// Voice selection
// ---------------------------------------------------------------------------

/** Language passed to every utterance so the engine never guesses. */
const SPEECH_LANGUAGE = "en-US";

const isEnglish = (voice: Speech.Voice) =>
  voice.language?.toLowerCase().startsWith("en") ?? false;

const isEnUS = (voice: Speech.Voice) =>
  (voice.language ?? "").toLowerCase().replace("_", "-") === "en-us";

/**
 * Pick the best-sounding English voice available on this device.
 *
 * iOS ships "Enhanced" (higher-bitrate) variants of its voices; the Siri
 * voices among them sound the most natural. Android's Google TTS exposes
 * on-device and network voices — the "network" ones are the higher-quality
 * synthesis. Returns `undefined` (system default) when nothing matches.
 */
async function pickBestEnglishVoice(): Promise<string | undefined> {
  try {
    const voices = await Speech.getAvailableVoicesAsync();
    const english = voices.filter(isEnglish);
    const enUS = english.filter(isEnUS);

    if (Platform.OS === "ios") {
      const enhanced = english.filter(
        (voice) => voice.quality === Speech.VoiceQuality.Enhanced,
      );
      const siri = enhanced.find((voice) =>
        voice.identifier.toLowerCase().includes("siri"),
      );
      if (siri) return siri.identifier;
      const enhancedUS = enhanced.find(isEnUS);
      if (enhancedUS) return enhancedUS.identifier;
      if (enhanced[0]) return enhanced[0].identifier;
      return enUS[0]?.identifier;
    }

    // Android (Google TTS): prefer network-quality en-US voices.
    const network = enUS.find(
      (voice) =>
        voice.identifier.toLowerCase().includes("network") ||
        voice.name?.toLowerCase().includes("network"),
    );
    return (network ?? enUS[0] ?? english[0])?.identifier;
  } catch {
    return undefined; // Voice listing failed — let the system default speak.
  }
}

/** Resolve the voice once per app session; every article reuses the result. */
let cachedVoicePromise: Promise<string | undefined> | null = null;
function getBestEnglishVoice(): Promise<string | undefined> {
  if (!cachedVoicePromise) cachedVoicePromise = pickBestEnglishVoice();
  return cachedVoicePromise;
}

// ---------------------------------------------------------------------------
// Toolbar button
// ---------------------------------------------------------------------------

function ToolButton({
  icon,
  label,
  accessibilityLabel,
  onPress,
}: {
  icon: IoniconName;
  label: string;
  accessibilityLabel: string;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={4}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: theme.accentSoft, opacity: pressed ? 0.7 : 1 },
      ]}
    >
      <Ionicons name={icon} size={16} color={theme.accent} />
      <Text style={[styles.buttonLabel, { color: theme.accent }]}>{label}</Text>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// ArticleTools
// ---------------------------------------------------------------------------

type SpeechStatus = "idle" | "speaking" | "paused";

/** Pause/resume mid-utterance is only implemented by iOS's speech engine. */
const CAN_PAUSE = Platform.OS === "ios";

export function ArticleTools({ article }: { article: Article }) {
  const theme = useTheme();
  const fullText = useMemo(() => buildArticleText(article), [article]);
  // What the TTS engine reads: same text with listening-only cleanup applied.
  // The Copy button keeps `fullText` untouched.
  const speechText = useMemo(() => prepareForSpeech(fullText), [fullText]);

  const [status, setStatus] = useState<SpeechStatus>("idle");
  // Invalidates in-flight onDone callbacks after a stop/restart, so a stale
  // utterance finishing can never re-chain or flip the UI state.
  const sessionRef = useRef(0);
  const chunksRef = useRef<string[]>([]);
  const indexRef = useRef(0);
  const voiceRef = useRef<string | undefined>(undefined);

  const speakChunk = useCallback((session: number) => {
    const chunk = chunksRef.current[indexRef.current];
    if (!chunk) {
      setStatus("idle");
      return;
    }
    Speech.speak(chunk, {
      voice: voiceRef.current,
      language: SPEECH_LANGUAGE,
      rate: 1.0,
      pitch: 1.0,
      onDone: () => {
        if (sessionRef.current !== session) return;
        indexRef.current += 1;
        speakChunk(session);
      },
      onError: () => {
        if (sessionRef.current === session) setStatus("idle");
      },
    });
  }, []);

  const startReading = useCallback(async () => {
    sessionRef.current += 1;
    const session = sessionRef.current;
    chunksRef.current = chunkText(speechText, CHUNK_LIMIT);
    indexRef.current = 0;
    if (chunksRef.current.length === 0) return;
    setStatus("speaking");
    // Lazily resolve the best voice on first play (cached for the session).
    voiceRef.current = await getBestEnglishVoice();
    // The user may have stopped or left the screen while we awaited.
    if (sessionRef.current !== session) return;
    speakChunk(session);
  }, [speechText, speakChunk]);

  const stopReading = useCallback(() => {
    sessionRef.current += 1;
    Speech.stop();
    setStatus("idle");
  }, []);

  const pauseReading = useCallback(() => {
    Speech.pause();
    setStatus("paused");
  }, []);

  const resumeReading = useCallback(() => {
    Speech.resume();
    setStatus("speaking");
  }, []);

  // Stop speech when the screen loses focus (e.g. opening a related article).
  useFocusEffect(
    useCallback(() => {
      return () => {
        sessionRef.current += 1;
        Speech.stop();
        setStatus("idle");
      };
    }, []),
  );

  // Copy + confirmation banner ------------------------------------------------

  const [copied, setCopied] = useState(false);
  const bannerAnim = useRef(new Animated.Value(0)).current;
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const copyArticle = useCallback(async () => {
    await Clipboard.setStringAsync(fullText);
    setCopied(true);
    Animated.timing(bannerAnim, {
      toValue: 1,
      duration: 180,
      useNativeDriver: true,
    }).start();
    if (copyTimer.current) clearTimeout(copyTimer.current);
    copyTimer.current = setTimeout(() => {
      Animated.timing(bannerAnim, {
        toValue: 0,
        duration: 240,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) setCopied(false);
      });
    }, 2500);
  }, [bannerAnim, fullText]);

  // Always release the speech engine and timers on unmount.
  useEffect(() => {
    return () => {
      sessionRef.current += 1;
      Speech.stop();
      if (copyTimer.current) clearTimeout(copyTimer.current);
    };
  }, []);

  return (
    <Card style={styles.toolbar}>
      <View style={styles.buttonRow}>
        {status === "idle" ? (
          <ToolButton
            icon="volume-high-outline"
            label="Read article"
            accessibilityLabel="Read article aloud"
            onPress={startReading}
          />
        ) : null}
        {status === "speaking" && CAN_PAUSE ? (
          <ToolButton
            icon="pause-outline"
            label="Pause"
            accessibilityLabel="Pause reading"
            onPress={pauseReading}
          />
        ) : null}
        {status === "paused" ? (
          <ToolButton
            icon="play-outline"
            label="Resume"
            accessibilityLabel="Resume reading"
            onPress={resumeReading}
          />
        ) : null}
        {status !== "idle" ? (
          <ToolButton
            icon="stop-outline"
            label="Stop"
            accessibilityLabel="Stop reading"
            onPress={stopReading}
          />
        ) : null}
        <ToolButton
          icon={copied ? "checkmark" : "copy-outline"}
          label="Copy article"
          accessibilityLabel="Copy article text to clipboard"
          onPress={copyArticle}
        />
      </View>
      {copied ? (
        <Animated.View
          accessibilityLiveRegion="polite"
          style={[
            styles.banner,
            {
              backgroundColor: theme.accentSoft,
              opacity: bannerAnim,
              transform: [
                {
                  translateY: bannerAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-4, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <Ionicons name="checkmark" size={14} color={theme.accent} />
          <Text style={[styles.bannerText, { color: theme.accent }]}>
            Article copied successfully.
          </Text>
        </Animated.View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  toolbar: { padding: space.md, gap: space.sm, marginTop: space.xs },
  buttonRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: space.sm,
    alignItems: "center",
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: 999,
  },
  buttonLabel: { fontSize: 13, fontWeight: "700" },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    alignSelf: "flex-start",
  },
  bannerText: { fontSize: 12.5, fontWeight: "600" },
});
