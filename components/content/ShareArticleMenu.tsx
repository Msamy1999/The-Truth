"use client";

import {
  Check,
  Copy,
  Mail,
  Printer,
  Share2,
  Smartphone,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  LANGUAGE_EVENT,
  readSavedLanguage,
  type SupportedLanguage,
} from "@/lib/translation";
import { cn } from "@/lib/utils";

type ShareArticleMenuProps = {
  articleTitle: string;
  articleSubtitle?: string;
  buttonClassName?: string;
};

type ShareStatus = "copied" | "copy-error" | "share-error" | null;

const STATUS_DURATION_MS = 2_500;

const labels = {
  en: {
    button: "Share",
    copiedButton: "Link copied",
    title: "Share the article",
    nativeShare: "Share with apps",
    copyLink: "Copy link",
    email: "Email",
    print: "Print",
    copyError: "The link could not be copied.",
    shareError: "The share window could not be opened.",
  },
  ar: {
    button: "مشاركة",
    copiedButton: "تم نسخ الرابط",
    title: "مشاركة المقال",
    nativeShare: "المشاركة عبر التطبيقات",
    copyLink: "نسخ الرابط",
    email: "البريد الإلكتروني",
    print: "طباعة",
    copyError: "تعذر نسخ الرابط.",
    shareError: "تعذر فتح نافذة المشاركة.",
  },
} satisfies Record<SupportedLanguage, Record<string, string>>;

function getArticleUrl(): string {
  const canonical = document.querySelector<HTMLLinkElement>(
    'link[rel="canonical"]',
  )?.href;
  const url = new URL(canonical || window.location.href);
  url.hash = "";
  return url.toString();
}

function fallbackCopy(text: string): boolean {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  let succeeded = false;
  try {
    succeeded = document.execCommand("copy");
  } finally {
    textarea.remove();
  }
  return succeeded;
}

export function ShareArticleMenu({
  articleTitle,
  articleSubtitle,
  buttonClassName,
}: ShareArticleMenuProps) {
  const [language, setLanguage] = useState<SupportedLanguage>("en");
  const [isOpen, setIsOpen] = useState(false);
  const [supportsNativeShare, setSupportsNativeShare] = useState(false);
  const [status, setStatus] = useState<ShareStatus>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const firstActionRef = useRef<HTMLButtonElement>(null);
  const statusTimeoutRef = useRef<number | null>(null);
  const copy = labels[language];

  useEffect(() => {
    setLanguage(readSavedLanguage());
    setSupportsNativeShare(typeof navigator.share === "function");

    const handleLanguageChange = (event: Event) => {
      const next = (event as CustomEvent<SupportedLanguage>).detail;
      if (next === "en" || next === "ar") setLanguage(next);
    };
    window.addEventListener(LANGUAGE_EVENT, handleLanguageChange);
    return () => window.removeEventListener(LANGUAGE_EVENT, handleLanguageChange);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setIsOpen(false);
      triggerRef.current?.focus();
    };
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    const focusFrame = window.requestAnimationFrame(() => {
      firstActionRef.current?.focus();
    });
    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  useEffect(
    () => () => {
      if (statusTimeoutRef.current !== null) {
        window.clearTimeout(statusTimeoutRef.current);
      }
    },
    [],
  );

  const showStatus = (nextStatus: Exclude<ShareStatus, null>) => {
    if (statusTimeoutRef.current !== null) {
      window.clearTimeout(statusTimeoutRef.current);
    }
    setStatus(nextStatus);
    statusTimeoutRef.current = window.setTimeout(() => {
      setStatus(null);
      statusTimeoutRef.current = null;
    }, STATUS_DURATION_MS);
  };

  const handleNativeShare = async () => {
    if (typeof navigator.share !== "function") {
      showStatus("share-error");
      return;
    }
    try {
      await navigator.share({
        title: articleTitle,
        text: articleSubtitle,
        url: getArticleUrl(),
      });
      setIsOpen(false);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      showStatus("share-error");
    }
  };

  const handleCopyLink = async () => {
    const url = getArticleUrl();
    let succeeded = false;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        succeeded = true;
      }
    } catch {
      succeeded = false;
    }
    if (!succeeded) {
      try {
        succeeded = fallbackCopy(url);
      } catch {
        succeeded = false;
      }
    }
    setIsOpen(false);
    showStatus(succeeded ? "copied" : "copy-error");
    triggerRef.current?.focus();
  };

  const handleEmail = () => {
    const emailBody =
      language === "ar"
        ? `اقرأ «${articleTitle}» على موقع الصراط المستقيم:\n\n${articleSubtitle ? `${articleSubtitle}\n\n` : ""}${getArticleUrl()}`
        : `Read “${articleTitle}” on The Straight Path:\n\n${articleSubtitle ? `${articleSubtitle}\n\n` : ""}${getArticleUrl()}`;
    setIsOpen(false);
    window.location.href = `mailto:?subject=${encodeURIComponent(articleTitle)}&body=${encodeURIComponent(emailBody)}`;
  };

  return (
    <div
      ref={rootRef}
      translate="no"
      dir={language === "ar" ? "rtl" : "ltr"}
      className="notranslate relative"
    >
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-controls="article-share-menu"
        aria-label={`${copy.title}: ${articleTitle}`}
        onClick={() => setIsOpen((open) => !open)}
        className={buttonClassName}
      >
        {status === "copied" ? (
          <Check aria-hidden="true" className="h-4 w-4 text-accent" />
        ) : (
          <Share2 aria-hidden="true" className="h-4 w-4" />
        )}
        {status === "copied" ? copy.copiedButton : copy.button}
      </button>

      {isOpen ? (
        <>
          <div
            aria-hidden="true"
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 z-[80] bg-background/40 backdrop-blur-[1px] sm:hidden"
          />
          <div
            id="article-share-menu"
            role="dialog"
            aria-label={copy.title}
            className={cn(
              "fixed inset-x-4 bottom-4 z-[90] w-auto rounded-xl border border-border bg-card p-2 shadow-xl ring-1 ring-foreground/5 sm:absolute sm:inset-x-auto sm:bottom-auto sm:top-full sm:z-50 sm:mt-2 sm:w-72 sm:max-w-[calc(100vw-2rem)]",
              language === "ar" ? "sm:right-0" : "sm:left-0",
            )}
          >
            <p className="px-2 pb-2 pt-1 text-sm font-semibold text-foreground">
              {copy.title}
            </p>
            <div className="grid gap-1">
              {supportsNativeShare ? (
                <button
                  ref={firstActionRef}
                  type="button"
                  onClick={handleNativeShare}
                  className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-2 text-start text-sm font-medium text-foreground transition hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent"
                >
                  <Smartphone aria-hidden="true" className="h-4 w-4 shrink-0 text-accent" />
                  {copy.nativeShare}
                </button>
              ) : null}
              <button
                ref={supportsNativeShare ? undefined : firstActionRef}
                type="button"
                onClick={handleCopyLink}
                className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-2 text-start text-sm font-medium text-foreground transition hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent"
              >
                <Copy aria-hidden="true" className="h-4 w-4 shrink-0 text-accent" />
                {copy.copyLink}
              </button>
              <button
                type="button"
                onClick={handleEmail}
                className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-2 text-start text-sm font-medium text-foreground transition hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent"
              >
                <Mail aria-hidden="true" className="h-4 w-4 shrink-0 text-accent" />
                {copy.email}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  window.print();
                }}
                className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-2 text-start text-sm font-medium text-foreground transition hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent"
              >
                <Printer aria-hidden="true" className="h-4 w-4 shrink-0 text-accent" />
                {copy.print}
              </button>
            </div>
          </div>
        </>
      ) : null}

      <p aria-live="polite" className="sr-only">
        {status === "copied"
          ? copy.copiedButton
          : status === "copy-error"
            ? copy.copyError
            : status === "share-error"
              ? copy.shareError
              : ""}
      </p>
    </div>
  );
}
