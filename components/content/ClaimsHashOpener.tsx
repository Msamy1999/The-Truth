"use client";

import { useEffect } from "react";

function openClaimFromHash() {
  const id = decodeURIComponent(window.location.hash.slice(1));
  if (!id) return false;

  const element = document.getElementById(id);
  if (!element || element.tagName !== "DETAILS") return false;

  element.setAttribute("open", "");
  requestAnimationFrame(() => element.scrollIntoView({ block: "start" }));
  return true;
}

export function ClaimsHashOpener() {
  useEffect(() => {
    let retryTimer = 0;
    let attempts = 0;
    let stopped = false;

    const ensureOpen = () => {
      if (stopped || !window.location.hash) return;

      openClaimFromHash();

      // Hydration can remove an `open` attribute that was applied to the
      // server-rendered element too early. Re-apply it briefly until the
      // client tree is stable so tree and copied deep links stay open.
      if (attempts >= 12) return;
      attempts += 1;
      retryTimer = window.setTimeout(ensureOpen, Math.min(75 + attempts * 25, 250));
    };

    const openAfterNavigation = () => {
      window.clearTimeout(retryTimer);
      attempts = 0;
      ensureOpen();
    };

    openAfterNavigation();
    window.addEventListener("hashchange", openAfterNavigation);
    window.addEventListener("popstate", openAfterNavigation);

    return () => {
      stopped = true;
      window.clearTimeout(retryTimer);
      window.removeEventListener("hashchange", openAfterNavigation);
      window.removeEventListener("popstate", openAfterNavigation);
    };
  }, []);

  return null;
}
