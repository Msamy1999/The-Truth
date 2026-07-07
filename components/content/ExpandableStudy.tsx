import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type ExpandableStudyProps = {
  title: ReactNode;
  summary?: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
};

export function ExpandableStudy({
  title,
  summary,
  children,
  defaultOpen = false,
  className,
}: ExpandableStudyProps) {
  return (
    <details
      open={defaultOpen}
      className={cn(
        "group rounded-lg border border-border bg-card p-4 text-card-foreground shadow-soft",
        className,
      )}
    >
      <summary className="flex cursor-pointer list-none items-start justify-between gap-4 rounded-md text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
        <span>
          <span className="block text-base font-semibold">{title}</span>
          {summary ? (
            <span className="mt-1 block text-sm leading-6 text-muted-foreground">
              {summary}
            </span>
          ) : null}
        </span>
        <ChevronDown
          aria-hidden="true"
          className="mt-1 h-5 w-5 shrink-0 text-muted-foreground transition group-open:rotate-180"
        />
      </summary>
      <div className="mt-4 border-t border-border pt-4 text-sm leading-7 text-muted-foreground">
        {children}
      </div>
    </details>
  );
}
