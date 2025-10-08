"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavSection, NavItem } from "@/lib/docs-nav";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

type Props = { sections: NavSection[] };

const normalize = (p: string) =>
  p && p !== "/" && p.endsWith("/") ? p.slice(0, -1) : p;

function isActive(pathname: string, href?: string) {
  if (!href) return false;
  const a = normalize(pathname);
  const b = normalize(href);
  return a === b;
}

function isAncestor(pathname: string, href?: string) {
  if (!href) return false;
  const a = normalize(pathname);
  const b = normalize(href);
  return a.startsWith(b + "/");
}

function NavTree({
  items,
  pathname,
  level = 0,
}: {
  items: NavItem[];
  pathname: string;
  level?: number;
}) {
  return (
    <ul className={level > 0 ? "ml-6 space-y-0.5" : "space-y-0.5"}>
      {items.map((item) => {
        const active = isActive(pathname, item.href);
        const ancestor =
          isAncestor(pathname, item.href) ||
          (item.subItems ?? []).some((it) => isActive(pathname, it.href));

        const base = "block rounded-md transition-colors px-2 py-1.5 text-xs";
        const idle =
          "text-muted-foreground hover:bg-accent hover:text-accent-foreground";
        const on = "bg-accent text-accent-foreground font-medium";
        const groupOn = "bg-muted text-foreground";

        const content = (
          <div className="flex items-center gap-2">
            <div
              className={`w-1 h-3 rounded-full transition-colors ${
                active
                  ? "bg-primary"
                  : ancestor
                    ? "bg-muted-foreground/50"
                    : "bg-transparent"
              }`}
            />
            <span>{item.label}</span>
          </div>
        );

        return (
          <li key={`${item.label}-${item.href ?? "group"}`}>
            {item.href ? (
              <Link
                href={item.href}
                className={`${base} ${active ? on : ancestor ? groupOn : idle}`}
                aria-current={active ? "page" : undefined}
              >
                {content}
              </Link>
            ) : (
              <div
                className={`${base} ${ancestor ? groupOn : "text-muted-foreground"}`}
              >
                {content}
              </div>
            )}

            {item.subItems?.length ? (
              <NavTree
                items={item.subItems}
                pathname={pathname}
                level={level + 1}
              />
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

export function DocSidebarClient({ sections }: Props) {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-background min-h-screen text-xs border-r">
      <div className="sticky top-0 h-screen pt-14">
        <ScrollArea className="h-[calc(100vh-3.5rem)]">
          <div className="px-4 py-6">
            {/* Search (placeholder) */}
            <div className="mb-6">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-between text-muted-foreground"
              >
                <span className="flex items-center gap-2">
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  Quick search...
                </span>
                <kbd className="pointer-events-none select-none inline-flex items-center gap-1 rounded border bg-muted px-1.5 text-[10px] font-mono font-medium text-muted-foreground">
                  ⌘K
                </kbd>
              </Button>
            </div>

            {/* Navigation */}
            <nav className="space-y-4">
              {sections.map((section) => (
                <div key={section.title}>
                  <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    {section.title}
                  </h3>
                  <NavTree items={section.items} pathname={pathname} />
                </div>
              ))}
            </nav>

            {/* Footer */}
            <div className="mt-8 pt-6">
              <Separator className="mb-4" />
              <div className="space-y-2.5">
                <Link
                  href="/support"
                  className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                  Support
                </Link>
                <Link
                  href="/changelogs"
                  className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                  Changelog
                </Link>
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>
    </aside>
  );
}
