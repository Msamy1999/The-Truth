"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  ANALYTICS_CONSENT_EVENT,
  readAnalyticsConsent,
} from "@/components/analytics/AnalyticsConsent";

type PageState = {
  path: string;
  enteredAt: string;
  entryReferrer?: string;
  activeMs: number;
  activeSince: number | null;
  eventId: number | null;
  startPromise: Promise<void> | null;
  lastReportedDurationMs: number;
  completed: boolean;
};

function identifier(storage: Storage, key: string): string {
  try {
    const existing = storage.getItem(key);
    if (existing && /^[a-z0-9-]{16,80}$/i.test(existing)) return existing;
    const value =
      typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : String(Date.now().toString(36) + "-" + Math.random().toString(36).slice(2));
    storage.setItem(key, value);
    return value;
  } catch {
    return String(Date.now().toString(36) + "-" + Math.random().toString(36).slice(2));
  }
}
function browserCategory(): string {
  const ua = navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) return "ios";
  if (/android/.test(ua)) return "android";
  if (/edg\//.test(ua)) return "edge";
  if (/firefox\//.test(ua)) return "firefox";
  if (/chrome\//.test(ua)) return "chrome";
  if (/safari\//.test(ua)) return "safari";
  return "other";
}
function deviceCategory(): string {
  const ua = navigator.userAgent.toLowerCase();
  if (/ipad|tablet/.test(ua)) return "tablet";
  if (/mobi|iphone|ipod|android/.test(ua)) return "mobile";
  if (window.matchMedia?.("(pointer: coarse)").matches) return "mobile";
  return "desktop";
}

function activeDuration(page: PageState, now: number) {
  return Math.max(
    0,
    Math.round(page.activeMs + (page.activeSince === null ? 0 : now - page.activeSince)),
  );
}

type AnalyticsIds = { visitorId: string; sessionId: string };

function eventBody(
  page: PageState,
  exitReason: "active" | "navigation" | "page-hidden" | "page-closed",
  phase: "start" | "snapshot" | "finish",
  ids: AnalyticsIds,
) {
  return {
    phase,
    eventId: page.eventId ?? undefined,
    visitorId: ids.visitorId,
    sessionId: ids.sessionId,
    path: page.path,
    entryReferrer: page.entryReferrer,
    durationMs: activeDuration(page, performance.now()),
    deviceCategory: deviceCategory(),
    browserCategory: browserCategory(),
    language: document.documentElement.lang || "en",
    enteredAt: page.enteredAt,
    exitReason,
  };
}

async function startPage(page: PageState, ids: AnalyticsIds) {
  try {
    const response = await fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(eventBody(page, "active", "start", ids)),
      keepalive: true,
    });
    if (!response.ok) return;
    const result = (await response.json()) as { id?: unknown };
    if (typeof result.id === "number" && Number.isSafeInteger(result.id)) {
      page.eventId = result.id;
    }
  } catch {
    // Analytics must never affect navigation or reading.
  }
}

async function updatePage(
  page: PageState,
  reason: "navigation" | "page-hidden" | "page-closed",
  beacon: boolean,
  final: boolean,
  ids: AnalyticsIds,
) {
  if (final && page.completed) return;
  if (final) page.completed = true;

  if (page.eventId === null && page.startPromise) await page.startPromise;
  if (page.eventId === null) return;

  const durationMs = activeDuration(page, performance.now());
  const body = JSON.stringify(
    eventBody(page, reason, final ? "finish" : "snapshot", ids),
  );

  if (beacon && typeof navigator.sendBeacon === "function") {
    const queued = navigator.sendBeacon(
      "/api/analytics",
      new Blob([body], { type: "application/json" }),
    );
    if (queued) {
      page.lastReportedDurationMs = durationMs;
      return;
    }
  }

  try {
    await fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    });
    page.lastReportedDurationMs = durationMs;
  } catch {
    // Analytics must never affect navigation or reading.
  }
}

export function AnalyticsTracker() {
  const pathname = usePathname();
  const [enabled, setEnabled] = useState(false);
  const pageRef = useRef<PageState | null>(null);
  const idsRef = useRef<{ visitorId: string; sessionId: string } | null>(null);

  useEffect(() => {
    const update = () => setEnabled(readAnalyticsConsent() === "granted");
    update();
    window.addEventListener(ANALYTICS_CONSENT_EVENT, update);
    return () => window.removeEventListener(ANALYTICS_CONSENT_EVENT, update);
  }, []);

  useEffect(() => {
    if (!enabled || !pathname) {
      pageRef.current = null;
      idsRef.current = null;
      return;
    }

    idsRef.current ??= {
      visitorId: identifier(window.localStorage, "the-straight-path-visitor-id"),
      sessionId: identifier(window.sessionStorage, "the-straight-path-session-id"),
    };

    const previous = pageRef.current;
    if (previous && previous.path !== pathname) {
      void updatePage(previous, "navigation", false, true, idsRef.current);
    }

    const page: PageState = {
      path: pathname,
      enteredAt: new Date().toISOString(),
      entryReferrer: previous
        ? `${window.location.origin}${previous.path}`
        : document.referrer || undefined,
      activeMs: 0,
      activeSince: document.visibilityState === "hidden" ? null : performance.now(),
      eventId: null,
      startPromise: null,
      lastReportedDurationMs: 0,
      completed: false,
    };
    pageRef.current = page;
    page.startPromise = startPage(page, idsRef.current);

    const updateVisibility = () => {
      const page = pageRef.current;
      const ids = idsRef.current;
      if (!page || !ids || page.completed) return;
      const now = performance.now();
      if (document.visibilityState === "hidden") {
        if (page.activeSince !== null) page.activeMs += now - page.activeSince;
        page.activeSince = null;
        if (page.activeMs - page.lastReportedDurationMs >= 1_000) {
          void updatePage(page, "page-hidden", true, false, ids);
        }
      } else if (page.activeSince === null) {
        page.activeSince = now;
      }
    };

    const closePage = (event: PageTransitionEvent) => {
      updateVisibility();
      // A persisted page may return from the browser back-forward cache; keep
      // its in-memory timer alive until it is actually left.
      if (event.persisted) return;
      if (pageRef.current && idsRef.current) {
        void updatePage(pageRef.current, "page-closed", true, true, idsRef.current);
      }
    };

    document.addEventListener("visibilitychange", updateVisibility);
    window.addEventListener("pagehide", closePage);
    return () => {
      document.removeEventListener("visibilitychange", updateVisibility);
      window.removeEventListener("pagehide", closePage);
    };
  }, [enabled, pathname]);

  return null;
}
