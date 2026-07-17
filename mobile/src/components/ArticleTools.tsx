/** Offline article toolbar: on-device speech and clipboard copy. */
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { useFocusEffect } from "expo-router";
import * as Speech from "expo-speech";
import type { ComponentProps } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Animated, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { space, useTheme } from "../lib/theme";
import type { Article } from "../lib/types";
import { Card } from "./ui";

type IoniconName = ComponentProps<typeof Ionicons>["name"];
type SpeechStatus = "idle" | "loading" | "speaking" | "paused";

const SPEECH_LANGUAGE = "en-US";
const SYSTEM_CAN_PAUSE = Platform.OS === "ios";
const SYSTEM_CHUNK_LIMIT = Math.max(
  500,
  Math.min(Speech.maxSpeechInputLength, 4000) - 200,
);

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

export function buildArticleText(article: Article): string {
  return [
    article.title,
    article.subtitle,
    article.summary,
    ...article.sections.flatMap((section) => [section.title, section.body]),
  ]
    .filter(Boolean)
    .map((part) => stripMarkdown(part).trim())
    .filter(Boolean)
    .join("\n\n");
}

function prepareForSpeech(text: string): string {
  return text
    .replace(/\s*[\u2013\u2014]\s*/g, ", ")
    .replace(/[#*_`>|~]/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/ ?\n ?/g, "\n")
    .trim();
}

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
    const sentences = paragraph.match(/[^.!?\u061f]+[.!?\u061f]+["')\]]*\s*|[^.!?\u061f]+$/g) ?? [paragraph];
    for (const sentence of sentences) {
      if (sentence.length <= limit) {
        append(sentence.trim());
        continue;
      }
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

async function pickBestEnglishVoice(): Promise<string | undefined> {
  try {
    const voices = await Speech.getAvailableVoicesAsync();
    const english = voices.filter((voice) =>
      voice.language?.toLowerCase().startsWith("en"),
    );
    const enUS = english.filter(
      (voice) => voice.language?.toLowerCase().replace("_", "-") === "en-us",
    );
    if (Platform.OS === "ios") {
      const enhanced = english.filter(
        (voice) => voice.quality === Speech.VoiceQuality.Enhanced,
      );
      return (
        enhanced.find((voice) => voice.identifier.toLowerCase().includes("siri"))
          ?.identifier ??
        enhanced.find((voice) => enUS.includes(voice))?.identifier ??
        enhanced[0]?.identifier ??
        enUS[0]?.identifier ??
        english[0]?.identifier
      );
    }
    const network = enUS.find(
      (voice) =>
        voice.identifier.toLowerCase().includes("network") ||
        voice.name?.toLowerCase().includes("network"),
    );
    return (network ?? enUS[0] ?? english[0])?.identifier;
  } catch {
    return undefined;
  }
}

let cachedVoicePromise: Promise<string | undefined> | null = null;
function getBestEnglishVoice(): Promise<string | undefined> {
  cachedVoicePromise ??= pickBestEnglishVoice();
  return cachedVoicePromise;
}

function ToolButton({
  icon,
  label,
  accessibilityLabel,
  onPress,
  disabled,
}: {
  icon: IoniconName;
  label: string;
  accessibilityLabel: string;
  onPress?: () => void;
  disabled?: boolean;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={4}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: theme.accentSoft,
          opacity: disabled ? 0.6 : pressed ? 0.7 : 1,
        },
      ]}
    >
      <Ionicons name={icon} size={16} color={theme.accent} />
      <Text style={[styles.buttonLabel, { color: theme.accent }]}>{label}</Text>
    </Pressable>
  );
}

export function ArticleTools({ article }: { article: Article }) {
  const theme = useTheme();
  const fullText = useMemo(() => buildArticleText(article), [article]);
  const speechText = useMemo(() => prepareForSpeech(fullText), [fullText]);
  const [status, setStatus] = useState<SpeechStatus>("idle");
  const [copied, setCopied] = useState(false);
  const sessionRef = useRef(0);
  const chunksRef = useRef<string[]>([]);
  const indexRef = useRef(0);
  const voiceRef = useRef<string | undefined>(undefined);
  const bannerAnim = useRef(new Animated.Value(0)).current;
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const speakChunk = useCallback((session: number) => {
    const chunk = chunksRef.current[indexRef.current];
    if (!chunk) {
      setStatus("idle");
      return;
    }
    Speech.speak(chunk, {
      voice: voiceRef.current,
      language: SPEECH_LANGUAGE,
      rate: 1,
      pitch: 1,
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
    setStatus("loading");
    chunksRef.current = chunkText(speechText, SYSTEM_CHUNK_LIMIT);
    indexRef.current = 0;
    if (chunksRef.current.length === 0) {
      setStatus("idle");
      return;
    }
    voiceRef.current = await getBestEnglishVoice();
    if (sessionRef.current !== session) return;
    setStatus("speaking");
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

  useFocusEffect(
    useCallback(() => {
      return () => {
        sessionRef.current += 1;
        Speech.stop();
        setStatus("idle");
      };
    }, []),
  );

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

  useEffect(
    () => () => {
      sessionRef.current += 1;
      Speech.stop();
      if (copyTimer.current) clearTimeout(copyTimer.current);
    },
    [],
  );

  return (
    <Card style={styles.toolbar}>
      <View style={styles.buttonRow}>
        {status === "idle" ? (
          <ToolButton icon="volume-high-outline" label="Read article" accessibilityLabel="Read article aloud" onPress={startReading} />
        ) : null}
        {status === "loading" ? (
          <ToolButton icon="volume-high-outline" label="Preparing..." accessibilityLabel="Preparing audio" disabled />
        ) : null}
        {status === "speaking" && SYSTEM_CAN_PAUSE ? (
          <ToolButton icon="pause-outline" label="Pause" accessibilityLabel="Pause reading" onPress={pauseReading} />
        ) : null}
        {status === "paused" ? (
          <ToolButton icon="play-outline" label="Resume" accessibilityLabel="Resume reading" onPress={resumeReading} />
        ) : null}
        {status === "speaking" || status === "paused" ? (
          <ToolButton icon="stop-outline" label="Stop" accessibilityLabel="Stop reading" onPress={stopReading} />
        ) : null}
        <ToolButton icon={copied ? "checkmark" : "copy-outline"} label="Copy article" accessibilityLabel="Copy article text to clipboard" onPress={copyArticle} />
      </View>
      {copied ? (
        <Animated.View
          accessibilityLiveRegion="polite"
          style={[
            styles.banner,
            {
              backgroundColor: theme.accentSoft,
              opacity: bannerAnim,
              transform: [{ translateY: bannerAnim.interpolate({ inputRange: [0, 1], outputRange: [-4, 0] }) }],
            },
          ]}
        >
          <Ionicons name="checkmark" size={14} color={theme.accent} />
          <Text style={[styles.bannerText, { color: theme.accent }]}>Article copied successfully.</Text>
        </Animated.View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  toolbar: { padding: space.md, gap: space.sm, marginTop: space.xs },
  buttonRow: { flexDirection: "row", flexWrap: "wrap", gap: space.sm, alignItems: "center" },
  button: { flexDirection: "row", alignItems: "center", gap: 6, minHeight: 44, paddingHorizontal: 14, borderRadius: 999 },
  buttonLabel: { fontSize: 13, fontWeight: "700" },
  banner: { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7, alignSelf: "flex-start" },
  bannerText: { fontSize: 12.5, fontWeight: "600" },
});
