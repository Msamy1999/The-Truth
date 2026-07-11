"use client";

import { Check, Copy, Pause, Play, Square, Volume2 } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type ArticleToolsProps = {
  /** Full plain-text of the article (title, sections, Q&A). */
  articleText: string;
  articleTitle: string;
  className?: string;
};

type PlayState = "idle" | "playing" | "paused";

type CopyStatus = { kind: "success" | "error"; message: string } | null;

const MAX_CHUNK_LENGTH = 360;
const KEEP_ALIVE_MS = 10_000;
const COPY_STATUS_MS = 2_500;
const VOICE_RETRY_MS = 400;

/**
 * Rank English voices by expected quality. Higher score wins.
 * Edge "Natural" neural voices > Chrome "Google" cloud voices > other
 * online/remote voices > good Apple local voices > platform default.
 */
function scoreVoice(voice: SpeechSynthesisVoice): number {
  const name = voice.name.toLowerCase();
  let score = 0;
  if (name.includes("natural")) {
    score += 100;
  }
  if (name.includes("google")) {
    score += 80;
  }
  if (name.includes("online")) {
    score += 60;
  }
  if (!voice.localService) {
    score += 40;
  }
  if (name.includes("samantha") || name.includes("daniel")) {
    score += 20;
  }
  if (voice.default) {
    score += 1;
  }
  return score;
}

function pickBestEnglishVoice(
  voices: SpeechSynthesisVoice[],
): SpeechSynthesisVoice | null {
  let best: SpeechSynthesisVoice | null = null;
  let bestScore = -1;
  for (const voice of voices) {
    if (!voice.lang.toLowerCase().startsWith("en")) {
      continue;
    }
    const score = scoreVoice(voice);
    if (score > bestScore) {
      best = voice;
      bestScore = score;
    }
  }
  return best;
}

/**
 * Speech-only cleanup: strip leftover markdown symbols, soften em-dashes
 * into commas for better pacing, and collapse whitespace. The Copy button
 * keeps the untouched articleText for full fidelity.
 */
function toSpeechText(text: string): string {
  return text
    .replace(/[*_#`]+/g, "")
    .replace(/\s*[—–]\s*/g, ", ")
    .replace(/[ \t]+/g, " ")
    .replace(/ ?\n ?/g, "\n");
}

/**
 * Split text into sentence-accumulating chunks (~360 chars), never breaking
 * mid-sentence unless a single sentence exceeds the limit. Chrome silently
 * stops long utterances after ~15 seconds, so we queue several short ones.
 */
function chunkText(text: string): string[] {
  const chunks: string[] = [];

  const pushLongSentence = (sentence: string) => {
    let piece = "";
    for (const word of sentence.split(/\s+/)) {
      const candidate = piece ? `${piece} ${word}` : word;
      if (candidate.length > MAX_CHUNK_LENGTH && piece) {
        chunks.push(piece);
        piece = word;
      } else {
        piece = candidate;
      }
    }
    if (piece) {
      chunks.push(piece);
    }
  };

  for (const paragraph of text.split(/\n+/)) {
    const trimmed = paragraph.trim();
    if (!trimmed) {
      continue;
    }

    const sentences =
      trimmed.match(/[^.!?]+[.!?]+["')\]]*|[^.!?]+$/g) ?? [trimmed];
    let current = "";

    for (const raw of sentences) {
      const sentence = raw.trim();
      if (!sentence) {
        continue;
      }
      if (sentence.length > MAX_CHUNK_LENGTH) {
        if (current) {
          chunks.push(current);
          current = "";
        }
        pushLongSentence(sentence);
        continue;
      }
      const candidate = current ? `${current} ${sentence}` : sentence;
      if (candidate.length > MAX_CHUNK_LENGTH && current) {
        chunks.push(current);
        current = sentence;
      } else {
        current = candidate;
      }
    }

    if (current) {
      chunks.push(current);
    }
  }

  return chunks.map((chunk) => chunk.trim()).filter(Boolean);
}

const toolButtonClass =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

const primaryToolClass = "bg-accent text-accent-foreground hover:brightness-110";

const secondaryToolClass =
  "border border-border bg-card text-foreground hover:bg-muted";

export function ArticleTools({
  articleText,
  articleTitle,
  className,
}: ArticleToolsProps) {
  const pathname = usePathname();
  const [speechSupported, setSpeechSupported] = useState(false);
  const [playState, setPlayState] = useState<PlayState>("idle");
  const [copyStatus, setCopyStatus] = useState<CopyStatus>(null);
  const [voiceName, setVoiceName] = useState("");

  const stoppedRef = useRef(false);
  const keepAliveRef = useRef<number | null>(null);
  const copyTimeoutRef = useRef<number | null>(null);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      return;
    }
    setSpeechSupported(true);

    // getVoices() is async-populated: Chrome often returns [] on first call.
    // Listen for voiceschanged AND retry once after a short timeout.
    const pickVoice = () => {
      const best = pickBestEnglishVoice(window.speechSynthesis.getVoices());
      if (best) {
        voiceRef.current = best;
        setVoiceName(best.name);
      }
    };

    pickVoice();
    window.speechSynthesis.addEventListener("voiceschanged", pickVoice);
    const retryTimeout = window.setTimeout(pickVoice, VOICE_RETRY_MS);
    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", pickVoice);
      window.clearTimeout(retryTimeout);
    };
  }, []);

  // Cancel speech and timers on unmount and on route change.
  useEffect(() => {
    return () => {
      stoppedRef.current = true;
      if (keepAliveRef.current !== null) {
        window.clearInterval(keepAliveRef.current);
        keepAliveRef.current = null;
      }
      if (copyTimeoutRef.current !== null) {
        window.clearTimeout(copyTimeoutRef.current);
        copyTimeoutRef.current = null;
      }
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [pathname]);

  function clearKeepAlive() {
    if (keepAliveRef.current !== null) {
      window.clearInterval(keepAliveRef.current);
      keepAliveRef.current = null;
    }
  }

  function startKeepAlive() {
    clearKeepAlive();
    // Chrome workaround: nudge the engine every ~10s or long reads go silent.
    keepAliveRef.current = window.setInterval(() => {
      const synth = window.speechSynthesis;
      if (synth.speaking && !synth.paused) {
        synth.resume();
      }
    }, KEEP_ALIVE_MS);
  }

  function finishPlayback() {
    stoppedRef.current = true;
    clearKeepAlive();
    setPlayState("idle");
  }

  function speakChunk(chunks: string[], index: number) {
    if (stoppedRef.current) {
      return;
    }
    if (index >= chunks.length) {
      finishPlayback();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(chunks[index]);
    if (voiceRef.current) {
      utterance.voice = voiceRef.current;
      utterance.lang = voiceRef.current.lang;
    }
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 1;
    utterance.onend = () => {
      if (!stoppedRef.current) {
        speakChunk(chunks, index + 1);
      }
    };
    utterance.onerror = () => {
      if (!stoppedRef.current) {
        finishPlayback();
        window.speechSynthesis.cancel();
      }
    };
    window.speechSynthesis.speak(utterance);
  }

  function handlePlay() {
    const synth = window.speechSynthesis;
    synth.cancel();
    const chunks = chunkText(toSpeechText(articleText));
    if (chunks.length === 0) {
      return;
    }
    stoppedRef.current = false;
    setPlayState("playing");
    startKeepAlive();
    speakChunk(chunks, 0);
  }

  function handlePause() {
    clearKeepAlive();
    window.speechSynthesis.pause();
    setPlayState("paused");
  }

  function handleResume() {
    window.speechSynthesis.resume();
    startKeepAlive();
    setPlayState("playing");
  }

  function handleStop() {
    stoppedRef.current = true;
    clearKeepAlive();
    window.speechSynthesis.cancel();
    setPlayState("idle");
  }

  function showCopyStatus(status: NonNullable<CopyStatus>) {
    if (copyTimeoutRef.current !== null) {
      window.clearTimeout(copyTimeoutRef.current);
    }
    setCopyStatus(status);
    copyTimeoutRef.current = window.setTimeout(() => {
      setCopyStatus(null);
      copyTimeoutRef.current = null;
    }, COPY_STATUS_MS);
  }

  function fallbackCopy(): boolean {
    const textarea = document.createElement("textarea");
    textarea.value = articleText;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();
    let succeeded = false;
    try {
      succeeded = document.execCommand("copy");
    } finally {
      document.body.removeChild(textarea);
    }
    return succeeded;
  }

  async function handleCopy() {
    let succeeded = false;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(articleText);
        succeeded = true;
      }
    } catch {
      succeeded = false;
    }
    if (!succeeded) {
      try {
        succeeded = fallbackCopy();
      } catch {
        succeeded = false;
      }
    }
    showCopyStatus(
      succeeded
        ? { kind: "success", message: "Article copied successfully." }
        : { kind: "error", message: "Copy failed" },
    );
  }

  return (
    <div
      data-voice={voiceName || undefined}
      className={cn("flex flex-wrap items-center gap-2", className)}
    >
      <div
        role="group"
        aria-label={`Reading tools for ${articleTitle}`}
        className="flex flex-wrap items-center gap-2"
      >
        {speechSupported && playState === "idle" ? (
          <button
            type="button"
            onClick={handlePlay}
            aria-label={`Read article aloud: ${articleTitle}`}
            className={cn(toolButtonClass, primaryToolClass)}
          >
            <Volume2 aria-hidden="true" className="h-4 w-4" />
            Read article
          </button>
        ) : null}
        {speechSupported && playState === "playing" ? (
          <button
            type="button"
            onClick={handlePause}
            aria-label="Pause reading"
            className={cn(toolButtonClass, secondaryToolClass)}
          >
            <Pause aria-hidden="true" className="h-4 w-4" />
            Pause
          </button>
        ) : null}
        {speechSupported && playState === "paused" ? (
          <button
            type="button"
            onClick={handleResume}
            aria-label="Resume reading"
            className={cn(toolButtonClass, secondaryToolClass)}
          >
            <Play aria-hidden="true" className="h-4 w-4" />
            Resume
          </button>
        ) : null}
        {speechSupported && playState !== "idle" ? (
          <button
            type="button"
            onClick={handleStop}
            aria-label="Stop reading"
            className={cn(toolButtonClass, secondaryToolClass)}
          >
            <Square aria-hidden="true" className="h-4 w-4" />
            Stop
          </button>
        ) : null}
        <button
          type="button"
          onClick={handleCopy}
          aria-label={`Copy article: ${articleTitle}`}
          className={cn(toolButtonClass, secondaryToolClass)}
        >
          {copyStatus?.kind === "success" ? (
            <Check aria-hidden="true" className="h-4 w-4 text-accent" />
          ) : (
            <Copy aria-hidden="true" className="h-4 w-4" />
          )}
          Copy article
        </button>
      </div>
      <p
        aria-live="polite"
        className={cn(
          "text-sm font-medium",
          copyStatus?.kind === "error" ? "text-gold" : "text-accent",
          copyStatus ? "" : "sr-only",
        )}
      >
        {copyStatus?.message ?? ""}
      </p>
    </div>
  );
}
