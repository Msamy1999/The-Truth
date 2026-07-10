import Link from "next/link";
import { LogoMark } from "@/components/layout/LogoMark";
import { siteName, siteNameArabic } from "@/lib/site-config";
import { cn } from "@/lib/utils";

type SiteBrandProps = {
  as?: "link" | "text";
  className?: string;
  onClick?: () => void;
};

export function SiteBrand({ as = "link", className, onClick }: SiteBrandProps) {
  const content = (
    <span className={cn("flex min-w-0 items-center gap-2.5", className)}>
      <LogoMark className="h-8 w-8 shrink-0 text-accent" />
      <span className="flex min-w-0 flex-col leading-tight">
        <span className="text-base font-semibold text-foreground">{siteName}</span>
        <span lang="ar" dir="rtl" className="text-right text-xs text-muted-foreground">
          {siteNameArabic}
        </span>
      </span>
    </span>
  );

  if (as === "text") {
    return content;
  }

  return (
    <Link
      href="/"
      aria-label={`${siteName} home`}
      onClick={onClick}
      className="shrink-0 no-underline"
    >
      {content}
    </Link>
  );
}
