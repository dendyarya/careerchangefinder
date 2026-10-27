"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import type { NavLink } from "@/lib/nav";
import { formatPay, matchHub, searchCareers, type HubEntry, type SearchEntry } from "@/lib/search";
import { SearchIcon } from "./icons";
import { useFocusTrap } from "./useFocusTrap";

let cache: Promise<[SearchEntry[], HubEntry[]]> | null = null;
function loadIndex() {
  cache ??= Promise.all([
    fetch("/search-index.json").then((r) => r.json() as Promise<SearchEntry[]>),
    fetch("/hubs.json").then((r) => r.json() as Promise<HubEntry[]>),
  ]).catch((e) => {
    cache = null;
    throw e;
  });
  return cache;
}

interface Item {
  href: string;
  label: string;
  meta: string;
  strong?: boolean;
}

export function SearchPanel({
  onClose,
  careerCount,
  popular,
}: {
  onClose: () => void;
  careerCount: number;
  popular: NavLink[];
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState("");
  const [data, setData] = useState<[SearchEntry[], HubEntry[]] | null>(null);
  const [error, setError] = useState(false);
  const [active, setActive] = useState(-1);
  const listId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef, true);

  useEffect(() => {
    inputRef.current?.focus();
    loadIndex().then(setData, () => setError(true));
  }, []);

  const items: Item[] = [];
  if (data && q.trim().length >= 2) {
    for (const h of searchCareers(data[0], q)) {
      items.push({
        href: `/careers/${h.slug}`,
        label: h.title,
        meta: `${h.pay ? `${formatPay(h.pay)} · ` : ""}${h.matchedAlt ? `Also called ${h.matchedAlt}` : "Career profile"}`,
      });
    }
    const hub = matchHub(data[1], q);
    if (hub)
      items.push({
        href: `/career-change/from-${hub.slug}`,
        label: `Jobs for former ${hub.plural.toLowerCase()}`,
        meta: "Career change →",
        strong: true,
      });
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    } else if (e.key === "ArrowDown" && items.length) {
      e.preventDefault();
      setActive((a) => (a + 1) % items.length);
    } else if (e.key === "ArrowUp" && items.length) {
      e.preventDefault();
      setActive((a) => (a <= 0 ? items.length - 1 : a - 1));
    } else if (e.key === "Enter") {
      const target = items[active >= 0 ? active : 0];
      if (target) {
        e.preventDefault();
        onClose();
        router.push(target.href);
      }
    }
  }

  const showResults = q.trim().length >= 2;

  return (
    <div
      ref={dialogRef}
      className="fixed inset-0 z-50"
      role="dialog"
      aria-modal="true"
      aria-label="Search careers"
      onKeyDown={onKeyDown}
    >
      <button
        type="button"
        aria-label="Close search"
        tabIndex={-1}
        className="absolute inset-0 cursor-default bg-ink/35"
        onClick={onClose}
      />
      <div className="relative border-b-[1.5px] border-mist bg-white">
        <div className="mx-auto flex max-w-[1312px] items-center gap-3 px-4 py-3.5 md:gap-6 md:px-8">
          <form
            role="search"
            className="flex h-[52px] min-w-0 flex-1 items-center gap-3 rounded-full border-2 border-primary bg-white pr-2 pl-[18px] shadow-[0_0_0_4px_var(--color-sky)]"
            onSubmit={(e) => e.preventDefault()}
          >
            <span className="text-ink">
              <SearchIcon />
            </span>
            <label htmlFor="site-search" className="sr-only">
              Search careers
            </label>
            <input
              ref={inputRef}
              id="site-search"
              type="search"
              autoComplete="off"
              role="combobox"
              aria-expanded={showResults && items.length > 0}
              aria-controls={listId}
              aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setActive(-1);
              }}
              placeholder={`Search ${careerCount.toLocaleString("en-US")} careers, e.g. teacher, nurse, data`}
              className="min-w-0 flex-1 border-0 bg-transparent text-body text-ink outline-none placeholder:text-muted focus-visible:shadow-none focus-visible:outline-none"
            />
            <kbd className="hidden rounded-sm border-[1.5px] border-mist bg-ice px-2.5 py-0.5 font-sans text-small font-bold text-muted md:inline">
              Esc
            </kbd>
          </form>
          <button
            type="button"
            onClick={onClose}
            className="h-12 shrink-0 rounded-full px-3 text-ui font-extrabold text-ink md:px-5"
          >
            Close
          </button>
        </div>
      </div>
      <div className="relative mx-auto max-w-[1312px] px-4 md:px-8">
        <div className="flex max-w-[860px] flex-col gap-5 rounded-b-[28px] border-[1.5px] border-t-0 border-mist bg-white p-5 shadow-panel md:ml-[214px] md:p-6">
          {showResults && (
            <div className="flex flex-col gap-1.5">
              <p className="m-0 text-small font-extrabold text-muted">Careers</p>
              {error && <p className="m-0 text-muted">Search is not available right now. Please try again.</p>}
              {!error && !data && <p className="m-0 text-muted">Loading…</p>}
              {data && items.length === 0 && (
                <p className="m-0 text-muted">No careers match “{q}”. Try a shorter word.</p>
              )}
              <ul
                id={listId}
                role="listbox"
                aria-label="Search results"
                className="m-0 flex list-none flex-col gap-1 p-0"
              >
                {items.map((it, i) => (
                  <li key={it.href} id={`${listId}-${i}`} role="option" aria-selected={i === active}>
                    <Link
                      href={it.href}
                      onClick={onClose}
                      onMouseEnter={() => setActive(i)}
                      className={`flex items-center justify-between gap-4 rounded-md px-3.5 py-3 text-ink no-underline ${i === active || it.strong ? "bg-ice" : ""}`}
                    >
                      <span className={it.strong ? "font-extrabold" : "font-bold"}>{it.label}</span>
                      <span
                        className={`shrink-0 text-right text-[16px] ${it.strong ? "font-extrabold text-primary" : "text-muted"}`}
                      >
                        {it.meta}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="flex flex-col gap-2.5">
            <p className="m-0 text-small font-extrabold text-muted">Popular searches</p>
            <div className="flex flex-wrap gap-2">
              {popular.map((p) => (
                <Link
                  key={p.href}
                  href={p.href}
                  onClick={onClose}
                  className="rounded-full border-[1.5px] border-mist bg-ice px-3.5 py-1.5 text-[16px] font-bold text-ink no-underline"
                >
                  {p.label}
                </Link>
              ))}
            </div>
          </div>
          <p className="m-0 hidden border-t-[1.5px] border-mist pt-3.5 text-small text-muted md:block">
            Press <strong>/</strong> anywhere to search · <strong>↑ ↓</strong> to move · <strong>Enter</strong> to open
          </p>
        </div>
      </div>
    </div>
  );
}
