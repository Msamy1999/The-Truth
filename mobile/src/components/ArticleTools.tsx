/**
 * Article toolbar: "Read article" (text-to-speech) and "Copy article"
 * (expo-clipboard). Sits directly under the article header.
 *
 * TTS engines, in order of preference:
 * 1. NEURAL (primary): streams MP3 chunks from the site's /api/tts endpoint
 *    (Microsoft Edge neural voices) via expo-av — dramatically more natural
 *    than any on-device engine, and pause/resume works on BOTH platforms.
 *    Requires EXPO_PUBLIC_API_URL to be reachable (same Wi-Fi as the PC in
 *    dev). Chunks are prefetched while the previous one plays.
 * 2. SYSTEM (fallback, offline-safe): expo-speech with the best available
 *    on-device voice. expo-speech caps utterances at maxSpeechInputLength
 *    (~4000 chars) so text is chunked and chained via onDone. Pause/resume
 *    is iOS-only there (Android's engine cannot pause mid-utterance).
 */
import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
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

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "";
const NEURAL_VOICE = "en-US-AndrewMultilingualNeural";
/** Small chunks keep time-to-first-audio low; the next chunk synthesizes on
 * the server while the current one plays. */
const NEURAL_CHUNK_LIMIT = 360;

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
 * output — this only changes what the speech engine hears.
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
 * System-fallback chunk target. Kept well under the platform's per-utterance
 * limit (Speech.maxSpeechInputLength, ~4000 chars) so whole sentences are
 * always accumulated into a chunk and inter-chunk pauses stay rare.
 */
const SYSTEM_CHUNK_LIMIT = Math.max(
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
// System-fallback voice selection
// ---------------------------------------------------------------------------

/** Language passed to every utterance so the engine never guesses. */
const SPEECH_LANGUAGE = "en-US";

const isEnglish = (voice: Speech.Voice) =>
  voice.language?.toLowerCase().startsWith("en") ?? false;

const isEnUS = (voice: Speech.Voice) =>
  (voice.language ?? "").toLowerCase().replace("_", "-") === "en-us";

/**
 * Pick the best-sounding English voice available on this device (used only
 * by the offline fallback). iOS ships "Enhanced" higher-bitrate variants;
 * Android's Google TTS "network" voices are its higher-quality synthesis.
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

/** Configure the audio session once (plays even with the iOS mute switch on). */
let audioModeReady: Promise<void> | null = null;
function ensureAudioMode(): Promise<void> {
  if (!audioModeReady) {
    audioModeReady = Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
    }).catch(() => {
      audioModeReady = null;
    }) as Promise<void>;
  }
  return audioModeReady;
}

function neuralChunkUri(chunk: string): string {
  return `${API_URL}/api/tts?text=${encodeURIComponent(chunk)}&voice=${NEURAL_VOICE}`;
}

// ---------------------------------------------------------------------------
// Toolbar button
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// ArticleTools
// ---------------------------------------------------------------------------

type SpeechStatus = "idle" | "loading" | "speaking" | "paused";
type Engine = "neural" | "system";

/** Pause/resume mid-utterance is only implemented by iOS's speech engine. */
const SYSTEM_CAN_PAUSE = Platform.OS === "ios";

export function ArticleTools({ article }: { article: Article }) {
  const theme = useTheme();
  const fullText = useMemo(() => buildArticleText(article), [article]);
  // What the TTS engine reads: same text with listening-only cleanup applied.
  // The Copy button keeps `fullText` untouched.
  const speechText = useMemo(() => prepareForSpeech(fullText), [fullText]);

  const [status, setStatus] = useState<SpeechStatus>("idle");
  const [engine, setEngine] = useState<Engine>("neural");
  // Invalidates in-flight callbacks after a stop/restart, so a stale chunk
  // finishing can never re-chain or flip the UI state.
  const sessionRef = useRef(0);
  const chunksRef = useRef<string[]>([]);
  const indexRef = useRef(0);
  const voiceRef = useRef<string | undefined>(undefined);
  const soundRef = useRef<Audio.Sound | null>(null);
  const nextSoundRef = useRef<Audio.Sound | null>(null);

  const unloadSounds = useCallback(async () => {
    const current = soundRef.current;
    const next = nextSoundRef.current;
    soundRef.current = null;
    nextSoundRef.current = null;
    try {
      await current?.unloadAsync();
    } catch {}
    try {
      await next?.unloadAsync();
    } catch {}
  }, []);

  // --- Neural engine -------------------------------------------------------

  const playNeuralChunk = useCallback(
    async (session: number): Promise<void> => {
      if (sessionRef.current !== session) return;
      const chunk = chunksRef.current[indexRef.current];
      if (!chunk) {
        await unloadSounds();
        if (sessionRef.current === session) setStatus("idle");
        return;
      }

      // Use the prefetched sound if available, otherwise load now.
      let sound = nextSoundRef.current;
      nextSoundRef.current = null;
      if (!sound) {
        const created = await Audio.Sound.createAsync(
          { uri: neuralChunkUri(chunk) },
          { shouldPlay: false },
        );
        sound = created.sound;
      }
      if (sessionRef.current !== session) {
        try {
          await sound.unloadAsync();
        } catch {}
        return;
      }

      // Release the previous chunk's sound and take ownership of this one.
      const previous = soundRef.current;
      soundRef.current = sound;
      if (previous) {
        try {
          await previous.unloadAsync();
        } catch {}
      }

      // Prefetch the next chunk while this one plays.
      const nextChunk = chunksRef.current[indexRef.current + 1];
      if (nextChunk) {
        Audio.Sound.createAsync({ uri: neuralChunkUri(nextChunk) }, { shouldPlay: false })
          .then(({ sound: prefetched }) => {
            if (sessionRef.current === session && !nextSoundRef.current) {
              nextSoundRef.current = prefetched;
            } else {
              prefetched.unloadAsync().catch(() => {});
            }
          })
          .catch(() => {
            // Prefetch failure is retried when the chunk is actually needed.
          });
      }

      sound.setOnPlaybackStatusUpdate((playback) => {
        if (!playback.isLoaded || sessionRef.current !== session) return;
        if (playback.didJustFinish) {
          indexRef.current += 1;
          void playNeuralChunk(session).catch(() => {
            if (sessionRef.current === session) setStatus("idle");
          });
        }
      });

      await sound.playAsync();
      if (sessionRef.current === session) setStatus("speaking");
    },
    [unloadSounds],
  );

  // --- System fallback engine ----------------------------------------------

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

  const startSystemFallback = useCallback(
    async (session: number) => {
      setEngine("system");
      chunksRef.current = chunkText(speechText, SYSTEM_CHUNK_LIMIT);
      indexRef.current = 0;
      voiceRef.current = await getBestEnglishVoice();
      if (sessionRef.current !== session) return;
      setStatus("speaking");
      speakChunk(session);
    },
    [speechText, speakChunk],
  );

  // --- Controls --------------------------------------------------------------

  const startReading = useCallback(async () => {
    sessionRef.current += 1;
    const session = sessionRef.current;
    setStatus("loading");

    if (API_URL) {
      try {
        setEngine("neural");
        chunksRef.current = chunkText(speechText, NEURAL_CHUNK_LIMIT);
        indexRef.current = 0;
        if (chunksRef.current.length === 0) {
          setStatus("idle");
          return;
        }
        await ensureAudioMode();
        await playNeuralChunk(session);
        return;
      } catch {
        // Server voice unreachable (offline / different network) — fall back.
        if (sessionRef.current !== session) return;
        await unloadSounds();
      }
    }
    await startSystemFallback(session);
  }, [speechText, playNeuralChunk, startSystemFallback, unloadSounds]);

  const stopReading = useCallback(() => {
    sessionRef.current += 1;
    Speech.stop();
    void unloadSounds();
    setStatus("idle");
  }, [unloadSounds]);

  const pauseReading = useCallback(() => {
    if (engine === "neural") {
      soundRef.current?.pauseAsync().catch(() => {});
    } else {
      Speech.pause();
    }
    setStatus("paused");
  }, [engine]);

  const resumeReading = useCallback(() => {
    if (engine === "neural") {
      soundRef.current?.playAsync().catch(() => {});
    } else {
      Speech.resume();
    }
    setStatus("speaking");
  }, [engine]);

  // Stop speech when the screen loses focus (e.g. opening a related article).
  useFocusEffect(
    useCallback(() => {
      return () => {
        sessionRef.current += 1;
        Speech.stop();
        void unloadSounds();
        setStatus("idle");
      };
    }, [unloadSounds]),
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

  // Always release the audio/speech engines and timers on unmount.
  useEffect(() => {
    return () => {
      sessionRef.current += 1;
      Speech.stop();
      void unloadSounds();
      if (copyTimer.current) clearTimeout(copyTimer.current);
    };
  }, [unloadSounds]);

  const canPause = engine === "neural" || SYSTEM_CAN_PAUSE;

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
        {status === "loading" ? (
          <ToolButton
            icon="volume-high-outline"
            label="Preparing…"
            accessibilityLabel="Preparing audio"
            disabled
          />
        ) : null}
        {status === "speaking" && canPause ? (
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
        {status === "speaking" || status === "paused" ? (
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
