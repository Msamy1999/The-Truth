import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type PageHeaderProps = {
  title: ReactNode;
  subtitle?: ReactNode;
  eyebrow?: ReactNode;
  align?: "left" | "center";
  titleAs?: "h1" | "h2";
  className?: string;
  titleClassName?: string;
};

export function PageHeader({
  title,
  subtitle,
  eyebrow,
  align = "left",
  titleAs = "h1",
  className,
  titleClassName,
}: PageHeaderProps) {
  const Title = titleAs;

  return (
    <div
      className={cn(
        "max-w-3xl",
        align === "center" && "mx-auto text-center",
        className,
      )}
    >
      {eyebrow ? (
        <p className="text-xs font-semibold uppercase tracking-wide text-accent sm:text-sm">
          {eyebrow}
        </p>
      ) : null}
      <Title
        className={cn(
          "mt-2 select-text leading-tight sm:mt-3",
          titleAs === "h1"
            ? "text-2xl sm:text-3xl lg:text-4xl"
            : "text-xl sm:text-2xl lg:text-3xl",
          titleClassName,
        )}
      >
        {title}
      </Title>
      {subtitle ? (
        <p className="mt-2.5 select-text text-sm leading-6 text-muted-foreground sm:mt-4 sm:text-base sm:leading-7 lg:text-lg">
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}
