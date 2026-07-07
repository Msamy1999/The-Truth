"use client";

import { useEffect } from "react";

/**
 * Registers the service worker (production only — a SW in dev serves stale
 * chunks and fights hot reload). Renders nothing.
 */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (
      process.env.NODE_ENV !== "production" ||
      !("serviceWorker" in navigator)
    ) {
      return;
    }

    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Registration failing (private mode, unsupported) is non-fatal.
    });
  }, []);

  return null;
}
