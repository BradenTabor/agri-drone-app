"use client";

import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";

import {
  coreNavItems,
  secondaryNavItems,
  type NavItem,
} from "@/components/shared/nav/navConfig";
import { Input } from "@/components/ui/input";
import { useIsClient } from "@/lib/useIsClient";

function normalizeQuery(value: string) {
  return value.trim().toLowerCase();
}

function matchesQuery(item: NavItem, query: string) {
  if (!query) {
    return true;
  }

  const haystack = [item.label, item.subtitle ?? "", item.href].join(" ").toLowerCase();
  return haystack.includes(query);
}

export function NavCommandPalette() {
  const router = useRouter();
  const isClient = useIsClient();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const normalizedQuery = normalizeQuery(query);

  const filteredCore = useMemo(
    () => coreNavItems.filter((item) => matchesQuery(item, normalizedQuery)),
    [normalizedQuery],
  );

  const filteredSecondary = useMemo(
    () => secondaryNavItems.filter((item) => matchesQuery(item, normalizedQuery)),
    [normalizedQuery],
  );

  const closePalette = useCallback(() => {
    setOpen(false);
    setQuery("");
  }, []);

  const openPalette = useCallback(() => {
    setOpen(true);
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const isModifier = event.metaKey || event.ctrlKey;

      if (isModifier && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((current) => !current);
        return;
      }

      if (event.key === "Escape" && open) {
        event.preventDefault();
        closePalette();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [closePalette, open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      inputRef.current?.focus();
    });

    document.body.style.overflow = "hidden";

    return () => {
      window.cancelAnimationFrame(frame);
      document.body.style.overflow = "";
    };
  }, [open]);

  function navigateTo(href: string) {
    closePalette();
    router.push(href);
  }

  const palettePanel =
    open && isClient
      ? createPortal(
          <>
            <button
              type="button"
              aria-label="Close command palette"
              tabIndex={-1}
              className="fixed inset-0 z-[55] cursor-default bg-slate-900/35 backdrop-blur-[3px] dark:bg-black/55"
              onPointerDown={closePalette}
            />

            <div
              role="dialog"
              aria-modal="true"
              aria-label="Command palette"
              className="liquid-reactive animate-liquid-rise fixed inset-x-3 top-[12vh] z-[60] mx-auto w-full max-w-lg overflow-hidden rounded-[1.35rem] border border-white/75 bg-white/96 shadow-[inset_0_1px_0_rgba(255,255,255,0.98),0_28px_60px_rgba(15,23,42,0.24)] backdrop-blur-3xl dark:border-white/15 dark:bg-slate-950/96 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_28px_64px_rgba(2,6,23,0.72)] sm:inset-x-auto"
            >
              <div className="glass-noise border-b border-white/55 p-3 dark:border-white/12">
                <div className="relative">
                  <Search
                    className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400"
                    aria-hidden="true"
                  />
                  <Input
                    ref={inputRef}
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search pages and operations..."
                    className="h-10 border-white/70 bg-white/80 pl-9 dark:border-white/15 dark:bg-white/8"
                    aria-label="Search navigation"
                  />
                </div>
                <p className="mt-2 px-1 text-[0.65rem] text-slate-500 dark:text-slate-400">
                  Jump to any workspace page. Full search coming soon.
                </p>
              </div>

              <div className="max-h-[min(50vh,22rem)] overflow-y-auto p-2">
                <CommandSection
                  title="Main"
                  items={filteredCore}
                  onSelect={navigateTo}
                  startIndex={0}
                />
                <CommandSection
                  title="Operations"
                  items={filteredSecondary}
                  onSelect={navigateTo}
                  startIndex={filteredCore.length}
                />

                {filteredCore.length === 0 && filteredSecondary.length === 0 ? (
                  <p className="px-3 py-6 text-center text-sm text-slate-500 dark:text-slate-400">
                    No matches for &ldquo;{query}&rdquo;
                  </p>
                ) : null}
              </div>
            </div>
          </>,
          document.body,
        )
      : null;

  return (
    <>
      <button
        type="button"
        onClick={openPalette}
        className="press-physics liquid-refraction hidden h-9 items-center gap-2 rounded-xl border border-white/50 bg-white/40 px-2.5 text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.82)] transition-colors hover:bg-white/58 md:inline-flex dark:border-white/15 dark:bg-white/8 dark:text-slate-200 dark:hover:bg-white/14"
        aria-label="Open command palette"
        aria-keyshortcuts="Meta+K Control+K"
      >
        <Search className="size-3.5 shrink-0 opacity-80" aria-hidden="true" />
        <span className="hidden text-[12px] font-medium lg:inline">Search</span>
        <kbd className="hidden rounded-md border border-white/70 bg-white/70 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 lg:inline dark:border-white/15 dark:bg-white/10 dark:text-slate-300">
          ⌘K
        </kbd>
      </button>

      {palettePanel}
    </>
  );
}

type CommandSectionProps = {
  title: string;
  items: NavItem[];
  onSelect: (href: string) => void;
  startIndex: number;
};

function CommandSection({ title, items, onSelect, startIndex }: CommandSectionProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <section className="mb-2">
      <p className="px-2 py-1 text-[0.65rem] font-semibold tracking-[0.14em] text-slate-500 uppercase dark:text-slate-400">
        {title}
      </p>
      <ul className="flex flex-col gap-0.5">
        {items.map((item, index) => {
          const ItemIcon = item.icon;

          return (
            <li key={item.href}>
              <button
                type="button"
                onClick={() => onSelect(item.href)}
                style={{ "--item-index": startIndex + index } as CSSProperties}
                className="animate-more-nav-item press-physics flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-[13px] font-medium text-slate-700 transition-colors hover:bg-white/75 hover:text-slate-900 dark:text-slate-200 dark:hover:bg-white/10 dark:hover:text-white"
              >
                {ItemIcon ? (
                  <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-lg border border-white/70 bg-white/80 text-slate-600 dark:border-white/15 dark:bg-white/10 dark:text-slate-300">
                    <ItemIcon className="size-3.5" aria-hidden="true" />
                  </span>
                ) : null}
                <span className="min-w-0 flex-1">
                  <span className="block truncate leading-none">{item.label}</span>
                  {item.subtitle ? (
                    <span className="mt-0.5 block truncate text-[0.68rem] font-normal text-slate-500 dark:text-slate-400">
                      {item.subtitle}
                    </span>
                  ) : null}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
