import configPromise from "@payload-config";
import { getPayload } from "payload";
import { enforceAnalyticsRetention } from "@/lib/analytics-retention";
import { requestClientKey } from "@/lib/request-client";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const WINDOW_MS = 5 * 60_000;
const MAX_REQUESTS_PER_SESSION = 120;
const MAX_REQUESTS_PER_CLIENT = 300;
const MAX_REQUESTS_PER_WINDOW = 2_000;
const MAX_TRACKED_KEYS = 10_000;
const MAX_DURATION_MS = 86_400_000;
const MAX_BODY_BYTES = 20_000;

type RateLimitEntry = { count: number; resetAt: number };
const requestsBySession = new Map<string, RateLimitEntry>();
const requestsByClient = new Map<string, RateLimitEntry>();
let globalRateLimit: RateLimitEntry = { count: 0, resetAt: Date.now() + WINDOW_MS };

type AnalyticsInput = {
  phase?: unknown;
  eventId?: unknown;
  visitorId?: unknown;
  sessionId?: unknown;
  path?: unknown;
  entryReferrer?: unknown;
  durationMs?: unknown;
  deviceCategory?: unknown;
  browserCategory?: unknown;
  language?: unknown;
  enteredAt?: unknown;
  exitReason?: unknown;
};

const ID_PATTERN = /^[a-z0-9-]{16,80}$/i;
// Analytics stores only a pathname. Query strings and fragments can contain
// private search terms or tokens and must never enter the reporting database.
const PATH_PATTERN = /^\/(?!\/)[^?#]{0,511}$/;
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
const PHASES = new Set(["start", "snapshot", "finish", "legacy"]);
const EXIT_REASONS = new Set(["active", "navigation", "page-hidden", "page-closed"]);
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
type ExitReason = "active" | "navigation" | "page-hidden" | "page-closed";

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

function referrer(value: unknown, siteOrigin: string): string | undefined {
  const raw = text(value, 2_000);
  if (!raw) return undefined;
  try {
    const url = new URL(raw);
    if (url.protocol !== "http:" && url.protocol !== "https:") return undefined;
    // Same-site paths help reconstruct reading flows. External referrers are
    // reduced to their origin because their paths may contain personal data.
    return url.origin === siteOrigin
      ? `${url.origin}${url.pathname}`.slice(0, 512)
      : url.origin.slice(0, 512);
  } catch {
    return undefined;
  }
}

const ROUTE_TITLES: Record<string, string> = {
  "/": "Home",
  "/atheism-agnosticism": "Atheism & Agnosticism",
  "/claims-against-islam": "Claims Against Islam",
  "/glossary": "Glossary",
  "/islam-christianity": "Islam & Christianity",
  "/islam-overview": "Islam Overview",
  "/learn-islam": "Learn Islam",
  "/people-of-palestine": "People of Palestine",
  "/privacy": "Privacy",
  "/questions": "Common Questions",
  "/search": "Search",
  "/sources": "Source Library",
};

function titleFromPath(path: string): string {
  const fixed = ROUTE_TITLES[path];
  if (fixed) return fixed;
  const segment = path.split("/").filter(Boolean).at(-1) ?? "Page";
  return segment
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
    .slice(0, 200);
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

function cleanRateLimitMap(map: Map<string, RateLimitEntry>, now: number) {
  if (map.size < MAX_TRACKED_KEYS) return;
  for (const [key, entry] of map) {
    if (entry.resetAt <= now) map.delete(key);
  }
  if (map.size >= MAX_TRACKED_KEYS) {
    map.delete(map.keys().next().value!);
  }
}

function activeEntry(
  map: Map<string, RateLimitEntry>,
  key: string,
  now: number,
): RateLimitEntry {
  const current = map.get(key);
  if (current && current.resetAt > now) return current;
  const next = { count: 0, resetAt: now + WINDOW_MS };
  map.set(key, next);
  return next;
}

function consumeRequest(sessionId: string, client: string): boolean {
  const now = Date.now();
  if (globalRateLimit.resetAt <= now) {
    globalRateLimit = { count: 0, resetAt: now + WINDOW_MS };
  }
  if (globalRateLimit.count >= MAX_REQUESTS_PER_WINDOW) return false;
  cleanRateLimitMap(requestsBySession, now);
  cleanRateLimitMap(requestsByClient, now);
  const sessionEntry = activeEntry(requestsBySession, sessionId, now);
  const clientEntry = activeEntry(requestsByClient, client, now);
  if (
    sessionEntry.count >= MAX_REQUESTS_PER_SESSION ||
    clientEntry.count >= MAX_REQUESTS_PER_CLIENT
  ) {
    return false;
  }
  sessionEntry.count += 1;
  clientEntry.count += 1;
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
  if (contentLength > MAX_BODY_BYTES) {
    return Response.json({ error: "Request too large" }, { status: 413 });
  }

  let body: AnalyticsInput;
  try {
    const rawBody = await request.text();
    if (new TextEncoder().encode(rawBody).byteLength > MAX_BODY_BYTES) {
      return Response.json({ error: "Request too large" }, { status: 413 });
    }
    body = JSON.parse(rawBody) as AnalyticsInput;
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  const visitorId = text(body.visitorId, 80);
  const sessionId = text(body.sessionId, 80);
  const path = text(body.path, 512);
  const durationMs = typeof body.durationMs === "number" ? body.durationMs : NaN;
  const deviceCategory = text(body.deviceCategory, 16) ?? "unknown";
  const browserCategory = text(body.browserCategory, 16) ?? "unknown";
  const exitReason = text(body.exitReason, 16) ?? "page-closed";
  const phase = text(body.phase, 16) ?? "legacy";
  const eventId =
    typeof body.eventId === "number" && Number.isSafeInteger(body.eventId) && body.eventId > 0
      ? body.eventId
      : null;

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
    !EXIT_REASONS.has(exitReason) ||
    !PHASES.has(phase) ||
    ((phase === "snapshot" || phase === "finish") && eventId === null) ||
    (phase === "start" && exitReason !== "active") ||
    (phase !== "start" && exitReason === "active")
  ) {
    return Response.json({ error: "Invalid analytics event" }, { status: 400 });
  }

  if (!consumeRequest(sessionId, requestClientKey(request))) {
    return Response.json(
      { error: "Too many analytics events" },
      { status: 429, headers: { "Retry-After": String(Math.ceil(WINDOW_MS / 1000)) } },
    );
  }

  const now = new Date();
  try {
    const payload = await getPayload({ config: configPromise });
    await enforceAnalyticsRetention(payload);

    if (phase === "snapshot" || phase === "finish") {
      const existing = await payload.findByID({
        collection: "analytics-events",
        id: eventId!,
        overrideAccess: true,
        depth: 0,
      });
      if (
        existing.visitorId !== visitorId ||
        existing.sessionId !== sessionId ||
        existing.path !== path
      ) {
        return Response.json({ error: "Analytics event not found" }, { status: 404 });
      }
      await payload.update({
        collection: "analytics-events",
        id: eventId!,
        overrideAccess: true,
        depth: 0,
        data: {
          durationMs: Math.round(durationMs),
          durationLabel: durationLabel(durationMs),
          exitReason: exitReason as ExitReason,
        },
      });
      return Response.json({ ok: true, id: eventId }, { status: 200 });
    }

    const record = await payload.create({
      collection: "analytics-events",
      overrideAccess: true,
      depth: 0,
      data: {
        visitorId,
        sessionId,
        recordedAt: now.toISOString(),
        enteredAt: validDate(body.enteredAt).toISOString(),
        path,
        title: titleFromPath(path),
        entryReferrer: referrer(body.entryReferrer, new URL(request.url).origin),
        durationMs: Math.round(durationMs),
        durationLabel: durationLabel(durationMs),
        deviceCategory: deviceCategory as DeviceCategory,
        browserCategory: browserCategory as BrowserCategory,
        language: text(body.language, 12) ?? undefined,
        country: headerText(request, ["cf-ipcountry"], 8),
        region: headerText(request, ["cf-region"], 80),
        city: headerText(request, ["cf-ipcity"], 80),
        exitReason: (phase === "start" ? "active" : exitReason) as ExitReason,
      },
    });
    return Response.json({ ok: true, id: record.id }, { status: 201 });
  } catch (error) {
    console.error("Analytics event could not be recorded", error);
    return Response.json({ error: "Analytics unavailable" }, { status: 503 });
  }
}
