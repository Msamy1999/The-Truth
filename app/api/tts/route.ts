import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";

/**
 * Neural text-to-speech proxy used by the website and the mobile app's
 * "Read article" feature. Synthesizes short text chunks (the clients split
 * articles into sentences) through the Microsoft Edge Read Aloud neural
 * voices — dramatically more natural than on-device speechSynthesis /
 * expo-speech defaults. GET so <audio> elements and expo-av can stream the
 * result directly by URL.
 *
 * Note: this uses the same public endpoint the Edge browser's own Read
 * Aloud feature calls. If it ever breaks, both clients fall back to their
 * on-device speech engines automatically.
 */

const DEFAULT_VOICE = "en-US-AndrewMultilingualNeural";
const MAX_CHARS = 2000;

// Only allow well-formed Edge voice names, e.g. "en-US-AriaNeural".
const VOICE_PATTERN = /^[a-z]{2,3}-[A-Za-z]{2,4}-[A-Za-z0-9]+Neural$/;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const text = url.searchParams.get("text")?.trim();
  const voiceParam = url.searchParams.get("voice") ?? DEFAULT_VOICE;

  if (!text) {
    return Response.json({ error: "Missing text" }, { status: 400 });
  }
  if (text.length > MAX_CHARS) {
    return Response.json(
      { error: `Text too long (max ${MAX_CHARS} characters per request)` },
      { status: 400 },
    );
  }
  const voice = VOICE_PATTERN.test(voiceParam) ? voiceParam : DEFAULT_VOICE;

  try {
    const tts = new MsEdgeTTS();
    await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
    const { audioStream } = await tts.toStream(text);

    const chunks: Buffer[] = [];
    await new Promise<void>((resolve, reject) => {
      audioStream.on("data", (chunk: Buffer) => chunks.push(chunk));
      audioStream.on("end", () => resolve());
      audioStream.on("error", (error: Error) => reject(error));
    });
    const audio = Buffer.concat(chunks);

    if (audio.length === 0) {
      return Response.json({ error: "Empty synthesis result" }, { status: 502 });
    }

    return new Response(new Uint8Array(audio), {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": String(audio.length),
        // Same text+voice always yields the same audio — cache aggressively.
        "Cache-Control": "public, max-age=604800, immutable",
      },
    });
  } catch (error) {
    console.error("TTS synthesis failed:", error);
    return Response.json({ error: "Speech synthesis failed" }, { status: 502 });
  }
}
