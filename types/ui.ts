/**
 * UI component prop types — these may depend on React and are only for the
 * web app. Domain content types live in types/domain.ts.
 */
import type { ReactNode } from "react";
import type { DisplayVerse } from "./domain";

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

export type CitationSource = {
  label: string;
  href?: string;
  note?: string;
  status?: "verified" | "pending";
};

export type VerseCardProps = {
  verse: DisplayVerse;
  className?: string;
};

export type ComparisonSide = {
  label: string;
  title?: ReactNode;
  children: ReactNode;
};

export type CalloutType =
  | "note"
  | "warning"
  | "insight"
  | "respectful-reminder";
