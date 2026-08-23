"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  ANALYTICS_CONSENT_EVENT,
  readAnalyticsConsent,
} from "@/components/analytics/AnalyticsConsent";

type PageState = {
  path: string;
  title: string;
  enteredAt: string;
  entryReferrer?: string;
  activeMs: number;
  activeSince: number | null;
  sent: boolean;
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
      return;
    }

    idsRef.current ??= {
      visitorId: identifier(window.localStorage, "the-straight-path-visitor-id"),
      sessionId: identifier(window.sessionStorage, "the-straight-path-session-id"),
    };

    const previous = pageRef.current;
    if (previous && previous.path !== pathname) {
      void sendPage(previous, "navigation");
    }

    pageRef.current = {
      path: pathname,
      title: document.title || "The Straight Path",
      enteredAt: new Date().toISOString(),
      entryReferrer: previous
        ? `${window.location.origin}${previous.path}`
        : document.referrer || undefined,
      activeMs: 0,
      activeSince: document.visibilityState === "hidden" ? null : performance.now(),
      sent: false,
    };

    const updateVisibility = () => {
      const page = pageRef.current;
      if (!page || page.sent) return;
      const now = performance.now();
      if (document.visibilityState === "hidden") {
        if (page.activeSince !== null) page.activeMs += now - page.activeSince;
        page.activeSince = null;
      } else if (page.activeSince === null) {
        page.activeSince = now;
      }
    };

    const closePage = (event: PageTransitionEvent) => {
      updateVisibility();
      // A persisted page may return from the browser back-forward cache; keep
      // its in-memory timer alive until it is actually left.
      if (event.persisted) return;
      if (pageRef.current) void sendPage(pageRef.current, "page-closed", true);
    };

    document.addEventListener("visibilitychange", updateVisibility);
    window.addEventListener("pagehide", closePage);
    return () => {
      document.removeEventListener("visibilitychange", updateVisibility);
      window.removeEventListener("pagehide", closePage);
    };
  }, [enabled, pathname]);

  return null;

  async function sendPage(page: PageState, reason: "navigation" | "page-closed", beacon = false) {
    if (page.sent || !idsRef.current) return;
    page.sent = true;
    const body = JSON.stringify({
      visitorId: idsRef.current.visitorId,
      sessionId: idsRef.current.sessionId,
      path: page.path,
      title: page.title,
      entryReferrer: page.entryReferrer,
      durationMs: activeDuration(page, performance.now()),
      deviceCategory: deviceCategory(),
      browserCategory: browserCategory(),
      language: document.documentElement.lang || "en",
      enteredAt: page.enteredAt,
      exitReason: reason,
    });

    if (beacon && typeof navigator.sendBeacon === "function") {
      navigator.sendBeacon(
        "/api/analytics",
        new Blob([body], { type: "application/json" }),
      );
      return;
    }

    try {
      await fetch("/api/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: true,
      });
    } catch {
      // Analytics must never affect navigation or reading.
    }
  }
}
