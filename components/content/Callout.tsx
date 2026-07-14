import {
  AlertTriangle,
  HandHeart,
  Info,
  Lightbulb,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { CalloutType } from "@/types/content";

const calloutStyles = {
  note: {
    icon: Info,
    className: "border-secondary/30 bg-secondary/10 text-foreground",
  },
  warning: {
    icon: AlertTriangle,
    className: "border-gold/40 bg-gold/10 text-foreground",
  },
  insight: {
    icon: Lightbulb,
    className: "border-accent/30 bg-accent/10 text-foreground",
  },
  "respectful-reminder": {
    icon: HandHeart,
    className: "border-border bg-card text-foreground",
  },
} satisfies Record<CalloutType, { icon: LucideIcon; className: string }>;

type CalloutProps = {
  type?: CalloutType;
  title?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function Callout({
  type = "note",
  title,
  children,
  className,
}: CalloutProps) {
  const Icon = calloutStyles[type].icon;

  return (
    <aside
      className={cn(
        "select-text rounded-lg border p-4 text-sm leading-7",
        calloutStyles[type].className,
        className,
      )}
    >
      <div className="flex gap-3">
        <Icon aria-hidden="true" className="mt-1 h-5 w-5 shrink-0 text-accent" />
        <div>
          {title ? <p className="font-semibold text-foreground">{title}</p> : null}
          <div className={cn(title ? "mt-1" : undefined, "text-muted-foreground")}>
            {children}
          </div>
        </div>
      </div>
    </aside>
  );
}
