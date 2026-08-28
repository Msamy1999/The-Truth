"use client";

import { usePathname } from "next/navigation";
import { Spinner } from "@/components/ui/Spinner";
import { useEffect, useRef, useState } from "react";

const MAX_LOADING_MS = 20_000;

export function NavigationLoadingIndicator() {
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);
  const [isLoading, setIsLoading] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  const stopLoading = () => {
    setIsLoading(false);
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  useEffect(() => {
    pathnameRef.current = pathname;
    stopLoading();
  }, [pathname]);

  useEffect(() => {
    const startLoading = () => {
      setIsLoading(true);
      if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
      timeoutRef.current = window.setTimeout(() => {
        setIsLoading(false);
        timeoutRef.current = null;
      }, MAX_LOADING_MS);
    };

    const handleClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }
      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest<HTMLAnchorElement>("a[href]");
      const rawHref = anchor?.getAttribute("href");
      if (
        !anchor ||
        !rawHref ||
        rawHref.startsWith("#") ||
        anchor.target === "_blank" ||
        anchor.hasAttribute("download") ||
        anchor.dataset.noNavigationLoading !== undefined
      ) {
        return;
      }

      const destination = new URL(anchor.href, window.location.href);
      const currentDocument = `${window.location.pathname}${window.location.search}`;
      const destinationDocument = `${destination.pathname}${destination.search}`;
      if (
        destination.origin !== window.location.origin ||
        destinationDocument === currentDocument
      ) {
        return;
      }
      startLoading();
    };

    const handlePopState = () => {
      // Query-string and hash-only history changes do not fetch a new route.
      // Showing a full-page overlay for them left the UI covered until the
      // 20-second safety timeout because `usePathname()` never changed.
      if (window.location.pathname === pathnameRef.current) {
        stopLoading();
        return;
      }
      startLoading();
    };
    const handlePageShow = stopLoading;
    const handleHashChange = stopLoading;
    document.addEventListener("click", handleClick, true);
    window.addEventListener("popstate", handlePopState);
    window.addEventListener("pageshow", handlePageShow);
    window.addEventListener("hashchange", handleHashChange);
    return () => {
      document.removeEventListener("click", handleClick, true);
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("pageshow", handlePageShow);
      window.removeEventListener("hashchange", handleHashChange);
      if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
    };
  }, []);

  if (!isLoading) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading page"
      translate="no"
      className="notranslate fixed inset-0 z-[60] grid place-items-center bg-background/80 px-6 backdrop-blur-sm"
    >
      <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-5 py-4 font-semibold text-foreground shadow-soft">
        <Spinner className="h-5 w-5 text-accent" />
        <span>Loading page…</span>
      </div>
    </div>
  );
}
