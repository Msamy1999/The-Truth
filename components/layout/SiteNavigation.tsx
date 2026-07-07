"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Container } from "@/components/layout/Container";
import { SiteBrand } from "@/components/layout/SiteBrand";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { islamChristianityHrefs, primaryNavItems } from "@/lib/navigation";
import { cn } from "@/lib/utils";

export function SiteNavigation() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  // Close the mobile menu with the Escape key while it is open.
  useEffect(() => {
    if (!isOpen) {
      return;
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  return (
    <>
      <Container className="flex min-h-16 items-center justify-between gap-3 py-3">
        <SiteBrand onClick={() => setIsOpen(false)} />
        <SearchPlaceholder className="hidden max-w-sm flex-1 md:flex" />
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-border bg-card text-foreground transition hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent lg:hidden"
            aria-controls="mobile-navigation"
            aria-expanded={isOpen}
            aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
            onClick={() => setIsOpen((current) => !current)}
          >
            {isOpen ? (
              <X aria-hidden="true" className="h-5 w-5" />
            ) : (
              <Menu aria-hidden="true" className="h-5 w-5" />
            )}
          </button>
        </div>
      </Container>

      <div className="hidden border-t border-border lg:block">
        <Container className="py-2">
          <nav
            aria-label="Primary navigation"
            className="flex flex-wrap gap-1"
          >
            {primaryNavItems.map((item) => (
              <HeaderLink
                key={item.href}
                href={item.href}
                active={isPrimaryNavActive(pathname, item.href)}
              >
                {item.label}
              </HeaderLink>
            ))}
          </nav>
        </Container>
      </div>

      <div
        id="mobile-navigation"
        hidden={!isOpen}
        className="border-t border-border lg:hidden"
      >
        <Container className="py-4">
          <SearchPlaceholder
            className="mb-4 flex md:hidden"
            onClick={() => setIsOpen(false)}
          />
          <nav aria-label="Mobile navigation" className="grid gap-1">
            {primaryNavItems.map((item) => (
              <HeaderLink
                key={item.href}
                href={item.href}
                active={isPrimaryNavActive(pathname, item.href)}
                onClick={() => setIsOpen(false)}
                mobile
              >
                {item.label}
              </HeaderLink>
            ))}
          </nav>
        </Container>
      </div>
    </>
  );
}

function isPrimaryNavActive(pathname: string, href: string) {
  if (pathname === href) {
    return true;
  }

  if (href === "/islam-christianity") {
    return islamChristianityHrefs.includes(pathname);
  }

  return false;
}

type HeaderLinkProps = {
  href: string;
  active?: boolean;
  mobile?: boolean;
  onClick?: () => void;
  children: string;
};

function HeaderLink({
  href,
  active = false,
  mobile = false,
  onClick,
  children,
}: HeaderLinkProps) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      onClick={onClick}
      className={cn(
        "rounded-md px-3 py-2 text-sm font-medium no-underline transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
        "text-muted-foreground hover:bg-muted hover:text-foreground",
        active && "bg-muted text-foreground",
        mobile ? "block py-3" : "shrink-0",
      )}
    >
      {children}
    </Link>
  );
}

function SearchPlaceholder({
  className,
  onClick,
}: {
  className?: string;
  onClick?: () => void;
}) {
  return (
    <Link
      href="/search"
      aria-label="Search the research library"
      onClick={onClick}
      className={cn(
        "items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-muted-foreground no-underline transition hover:bg-muted hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
        className,
      )}
    >
      <Search aria-hidden="true" className="h-4 w-4 shrink-0" />
      <span className="min-w-0 flex-1 text-sm">Search library...</span>
    </Link>
  );
}
