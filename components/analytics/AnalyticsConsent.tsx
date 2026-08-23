"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export const ANALYTICS_CONSENT_KEY = "the-straight-path-analytics-consent";
export const ANALYTICS_CONSENT_COOKIE = "the-straight-path-analytics-consent";
export type AnalyticsConsent = "unknown" | "granted" | "denied";
export const ANALYTICS_CONSENT_EVENT = "the-straight-path-analytics-consent-change";

export function readAnalyticsConsent(): AnalyticsConsent {
  try {
    const value = window.localStorage.getItem(ANALYTICS_CONSENT_KEY);
    if (value === "granted" || value === "denied") return value;
  } catch {
    // Fall back to the preference cookie below when storage is unavailable.
  }

  const cookieValue = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${ANALYTICS_CONSENT_COOKIE}=`))
    ?.split("=")[1];
  return cookieValue === "granted" || cookieValue === "denied"
    ? cookieValue
    : "unknown";
}

export function setAnalyticsConsent(value: Exclude<AnalyticsConsent, "unknown">) {
  try {
    window.localStorage.setItem(ANALYTICS_CONSENT_KEY, value);
  } catch {
    // If storage is unavailable, the tracker remains effectively disabled.
  }
  document.cookie = `${ANALYTICS_CONSENT_COOKIE}=${value}; Path=/; Max-Age=31536000; SameSite=Lax`;
  window.dispatchEvent(
    new CustomEvent(ANALYTICS_CONSENT_EVENT, { detail: value }),
  );
}

export function AnalyticsConsentBanner() {
  const [consent, setConsent] = useState<AnalyticsConsent>("unknown");

  useEffect(() => {
    const update = () => setConsent(readAnalyticsConsent());
    update();
    window.addEventListener(ANALYTICS_CONSENT_EVENT, update);
    return () => window.removeEventListener(ANALYTICS_CONSENT_EVENT, update);
  }, []);

  if (consent !== "unknown") return null;

  return (
    <aside
      aria-label="Analytics consent"
      className="fixed inset-x-3 bottom-3 z-[70] mx-auto max-w-2xl rounded-lg border border-border bg-card p-3 text-sm text-card-foreground shadow-soft sm:inset-x-6 sm:flex sm:items-center sm:gap-4"
    >
      <p className="flex-1 leading-6">
        May we collect anonymous page visits and reading time to improve this site?
        No names, emails, or IP addresses are stored.{" "}
        <a href="/privacy" className="font-medium text-accent underline">
          Privacy details
        </a>
      </p>
      <div className="mt-2 flex shrink-0 gap-2 sm:mt-0">
        <button
          type="button"
          onClick={() => {
            setAnalyticsConsent("denied");
            setConsent("denied");
          }}
          className="rounded-md border border-border px-3 py-2 font-medium hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
        >
          No thanks
        </button>
        <button
          type="button"
          onClick={() => {
            setAnalyticsConsent("granted");
            setConsent("granted");
          }}
          className="rounded-md bg-accent px-3 py-2 font-semibold text-accent-foreground hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
        >
          Allow anonymous analytics
        </button>
      </div>
    </aside>
  );
}

export function AnalyticsPreferences({ className }: { className?: string }) {
  const [consent, setConsent] = useState<AnalyticsConsent>("unknown");

  useEffect(() => {
    const update = () => setConsent(readAnalyticsConsent());
    update();
    window.addEventListener(ANALYTICS_CONSENT_EVENT, update);
    return () => window.removeEventListener(ANALYTICS_CONSENT_EVENT, update);
  }, []);

  return (
    <button
      type="button"
      className={cn(
        "inline-flex rounded-sm text-left no-underline hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
        className,
      )}
      onClick={() =>
        setAnalyticsConsent(
          consent === "granted"
            ? "denied"
            : consent === "denied"
              ? "granted"
              : "denied",
        )
      }
    >
      {consent === "granted"
        ? "Turn off anonymous analytics"
        : consent === "denied"
          ? "Allow anonymous analytics"
          : "Decline anonymous analytics"}
    </button>
  );
}
