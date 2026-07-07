import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const tones = {
  default: "bg-background",
  muted: "bg-muted/40",
  subtle: "bg-card",
} as const;

const spacing = {
  sm: "py-6 sm:py-8",
  md: "py-8 sm:py-10 lg:py-12",
  lg: "py-10 sm:py-12 lg:py-16",
} as const;

type SectionProps = HTMLAttributes<HTMLElement> & {
  tone?: keyof typeof tones;
  spacing?: keyof typeof spacing;
};

export function Section({
  className,
  tone = "default",
  spacing: sectionSpacing = "md",
  ...props
}: SectionProps) {
  return (
    <section
      className={cn(tones[tone], spacing[sectionSpacing], className)}
      {...props}
    />
  );
}
