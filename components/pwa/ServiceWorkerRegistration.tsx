"use client";

import { useEffect } from "react";

/**
 * Registers the service worker (production only — a SW in dev serves stale
 * chunks and fights hot reload). Renders nothing.
 */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    if (process.env.NODE_ENV !== "production") {
      const removeDevelopmentOfflineState = async () => {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(
          registrations
            .filter((registration) => {
              const scriptUrl =
                registration.active?.scriptURL ??
                registration.waiting?.scriptURL ??
                registration.installing?.scriptURL;
              return scriptUrl ? new URL(scriptUrl).pathname === "/sw.js" : false;
            })
            .map((registration) => registration.unregister()),
        );

        if ("caches" in window) {
          const cacheNames = await window.caches.keys();
          await Promise.all(
            cacheNames
              .filter((name) => name.startsWith("straight-path-"))
              .map((name) => window.caches.delete(name)),
          );
        }
      };

      void removeDevelopmentOfflineState().catch(() => {
        // A stale worker may survive one more reload when browser storage is
        // unavailable, but development must remain usable without storage.
      });
      return;
    }

    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Registration failing (private mode, unsupported) is non-fatal.
    });
  }, []);

  return null;
}
