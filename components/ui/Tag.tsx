import Link from "next/link";
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type TagProps = HTMLAttributes<HTMLSpanElement> & {
  href?: string;
};

const tagClasses =
  "inline-flex min-h-7 items-center rounded-md border border-border bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground no-underline";

export function Tag({ className, href, ...props }: TagProps) {
  if (href) {
    return (
      <Link
        href={href}
        className={cn(
          tagClasses,
          "transition hover:border-accent hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
          className,
        )}
      >
        {props.children}
      </Link>
    );
  }

  return <span className={cn(tagClasses, className)} {...props} />;
}
