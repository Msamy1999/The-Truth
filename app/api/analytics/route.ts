import configPromise from "@payload-config";
import { getPayload } from "payload";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const WINDOW_MS = 5 * 60_000;
const MAX_REQUESTS_PER_SESSION = 120;
const MAX_REQUESTS_PER_WINDOW = 2_000;
const MAX_TRACKED_KEYS = 10_000;
const MAX_DURATION_MS = 86_400_000;

type RateLimitEntry = { count: number; resetAt: number };
const requestsBySession = new Map<string, RateLimitEntry>();
let globalRateLimit: RateLimitEntry = { count: 0, resetAt: Date.now() + WINDOW_MS };

type AnalyticsInput = {
  visitorId?: unknown;
  sessionId?: unknown;
  path?: unknown;
  title?: unknown;
  entryReferrer?: unknown;
  durationMs?: unknown;
  deviceCategory?: unknown;
  browserCategory?: unknown;
  language?: unknown;
  enteredAt?: unknown;
  exitReason?: unknown;
};

const ID_PATTERN = /^[a-z0-9-]{16,80}$/i;
const PATH_PATTERN = /^\/(?!\/)[\s\S]{0,511}$/;
const DEVICE_VALUES = new Set(["desktop", "mobile", "tablet", "unknown"]);
const BROWSER_VALUES = new Set([
  "chrome",
  "edge",
  "firefox",
  "safari",
  "ios",
  "android",
  "other",
  "unknown",
]);
const EXIT_REASONS = new Set(["navigation", "page-hidden", "page-closed"]);
type DeviceCategory = "desktop" | "mobile" | "tablet" | "unknown";
type BrowserCategory =
  | "chrome"
  | "edge"
  | "firefox"
  | "safari"
  | "ios"
  | "android"
  | "other"
  | "unknown";
type ExitReason = "navigation" | "page-hidden" | "page-closed";

function text(value: unknown, maxLength: number): string | null {
  if (typeof value !== "string") return null;
  const cleaned = value
    .split("")
    .filter((character) => {
      const code = character.charCodeAt(0);
      return code >= 32 && code !== 127;
    })
    .join("")
    .trim();
  return cleaned.length > 0 && cleaned.length <= maxLength ? cleaned : null;
}

function headerText(request: Request, names: string[], maxLength: number): string | undefined {
  for (const name of names) {
    const value = text(request.headers.get(name), maxLength);
    if (value) return value;
  }
  return undefined;
}

function referrer(value: unknown): string | undefined {
  const raw = text(value, 2_000);
  if (!raw) return undefined;
  try {
    const url = new URL(raw);
    if (url.protocol !== "http:" && url.protocol !== "https:") return undefined;
    // Do not retain query strings, fragments, credentials, or arbitrary text.
    return `${url.origin}${url.pathname}`.slice(0, 512);
  } catch {
    return undefined;
  }
}

function validDate(value: unknown): Date {
  const parsed = typeof value === "string" ? new Date(value) : new Date();
  const now = Date.now();
  if (!Number.isFinite(parsed.getTime()) || parsed.getTime() > now + 5 * 60_000) {
    return new Date(now);
  }
  return parsed;
}

function durationLabel(durationMs: number): string {
  const totalSeconds = Math.round(durationMs / 1_000);
  if (totalSeconds < 60) return `${totalSeconds}s`;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return seconds === 0 ? `${minutes}m` : `${minutes}m ${seconds}s`;
}

function consumeRequest(sessionId: string): boolean {
  const now = Date.now();
  if (globalRateLimit.resetAt <= now) {
    globalRateLimit = { count: 0, resetAt: now + WINDOW_MS };
  }
  if (globalRateLimit.count >= MAX_REQUESTS_PER_WINDOW) return false;
  if (requestsBySession.size >= MAX_TRACKED_KEYS) {
    for (const [key, entry] of requestsBySession) {
      if (entry.resetAt <= now) requestsBySession.delete(key);
    }
    if (requestsBySession.size >= MAX_TRACKED_KEYS) {
      requestsBySession.delete(requestsBySession.keys().next().value!);
    }
  }

  const current = requestsBySession.get(sessionId);
  if (!current || current.resetAt <= now) {
    requestsBySession.set(sessionId, { count: 1, resetAt: now + WINDOW_MS });
    globalRateLimit.count += 1;
    return true;
  }
  if (current.count >= MAX_REQUESTS_PER_SESSION) return false;
  current.count += 1;
  globalRateLimit.count += 1;
  return true;
}

function hasAnalyticsConsent(request: Request): boolean {
  return /(?:^|;\s*)the-straight-path-analytics-consent=granted(?:;|$)/.test(
    request.headers.get("cookie") ?? "",
  );
}

export async function POST(request: Request) {
  if (!hasAnalyticsConsent(request)) {
    return Response.json({ error: "Analytics consent is required" }, { status: 403 });
  }
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 20_000) {
    return Response.json({ error: "Request too large" }, { status: 413 });
  }

  let body: AnalyticsInput;
  try {
    body = (await request.json()) as AnalyticsInput;
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  const visitorId = text(body.visitorId, 80);
  const sessionId = text(body.sessionId, 80);
  const path = text(body.path, 512);
  const title = text(body.title, 200) ?? "Untitled page";
  const durationMs = typeof body.durationMs === "number" ? body.durationMs : NaN;
  const deviceCategory = text(body.deviceCategory, 16) ?? "unknown";
  const browserCategory = text(body.browserCategory, 16) ?? "unknown";
  const exitReason = text(body.exitReason, 16) ?? "page-closed";

  if (
    !visitorId ||
    !ID_PATTERN.test(visitorId) ||
    !sessionId ||
    !ID_PATTERN.test(sessionId) ||
    !path ||
    !PATH_PATTERN.test(path) ||
    !Number.isFinite(durationMs) ||
    durationMs < 0 ||
    durationMs > MAX_DURATION_MS ||
    !DEVICE_VALUES.has(deviceCategory) ||
    !BROWSER_VALUES.has(browserCategory) ||
    !EXIT_REASONS.has(exitReason)
  ) {
    return Response.json({ error: "Invalid analytics event" }, { status: 400 });
  }

  if (!consumeRequest(sessionId)) {
    return Response.json(
      { error: "Too many analytics events" },
      { status: 429, headers: { "Retry-After": String(Math.ceil(WINDOW_MS / 1000)) } },
    );
  }

  const now = new Date();
  try {
    const payload = await getPayload({ config: configPromise });
    await payload.create({
      collection: "analytics-events",
      overrideAccess: true,
      depth: 0,
      data: {
        visitorId,
        sessionId,
        recordedAt: now.toISOString(),
        enteredAt: validDate(body.enteredAt).toISOString(),
        path,
        title,
        entryReferrer: referrer(body.entryReferrer),
        durationMs: Math.round(durationMs),
        durationLabel: durationLabel(durationMs),
        deviceCategory: deviceCategory as DeviceCategory,
        browserCategory: browserCategory as BrowserCategory,
        language: text(body.language, 12) ?? undefined,
        country: headerText(request, ["cf-ipcountry"], 8),
        region: headerText(request, ["cf-region"], 80),
        city: headerText(request, ["cf-ipcity"], 80),
        exitReason: exitReason as ExitReason,
      },
    });
    return Response.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error("Analytics event could not be recorded", error);
    return Response.json({ error: "Analytics unavailable" }, { status: 503 });
  }
}
