"use client";

import { useEffect, useId, useRef, useState } from "react";
import { searchCareers, type SearchEntry, type SearchHit } from "@/lib/search";

let cache: Promise<SearchEntry[]> | null = null;
const load = () => {
  cache ??= fetch("/search-index.json")
    .then((r) => r.json() as Promise<SearchEntry[]>)
    .catch((e) => {
      cache = null;
      throw e;
    });
  return cache;
};

/**
 * "What's your current job?" combobox (WAI-ARIA combobox with listbox popup).
 * Calls onPick with the career slug. Used on Home and in the Career Change Tool.
 */
export function JobPicker({
  onPick,
  buttonLabel = "Show my options",
  placeholder = "e.g. Elementary school teacher",
  initial = "",
  label = "What's your current job?",
}: {
  onPick: (hit: SearchHit) => void;
  buttonLabel?: string;
  placeholder?: string;
  initial?: string;
  label?: string;
}) {
  const [q, setQ] = useState(initial);
  const [index, setIndex] = useState<SearchEntry[] | null>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [hint, setHint] = useState("");
  const id = useId();
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const hits = index && q.trim().length >= 2 ? searchCareers(index, q, 8) : [];

  function ensure() {
    if (!index) load().then(setIndex, () => setHint("Search is not available right now. Please try again."));
  }
  function choose(h: SearchHit | undefined) {
    if (!h) {
      setHint(q.trim().length < 2 ? "Type at least 2 letters of your job title." : "Pick a job from the list.");
      setOpen(true);
      return;
    }
    setQ(h.title);
    setOpen(false);
    setHint("");
    onPick(h);
  }

  return (
    <div ref={wrap} className="relative flex flex-col gap-3">
      <label htmlFor={`${id}-input`} className="font-display text-[22px] font-bold">
        {label}
      </label>
      <div className="flex flex-wrap gap-3">
        <input
          id={`${id}-input`}
          type="text"
          role="combobox"
          autoComplete="off"
          aria-expanded={open && hits.length > 0}
          aria-controls={`${id}-list`}
          aria-autocomplete="list"
          aria-activedescendant={open && hits[active] ? `${id}-opt-${active}` : undefined}
          aria-describedby={hint ? `${id}-hint` : undefined}
          value={q}
          placeholder={placeholder}
          onFocus={() => {
            ensure();
            setOpen(true);
          }}
          onChange={(e) => {
            ensure();
            setQ(e.target.value);
            setActive(0);
            setOpen(true);
            setHint("");
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setOpen(true);
              setActive((a) => Math.min(a + 1, Math.max(hits.length - 1, 0)));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((a) => Math.max(a - 1, 0));
            } else if (e.key === "Enter") {
              e.preventDefault();
              choose(hits[active]);
            } else if (e.key === "Escape") {
              setOpen(false);
            }
          }}
          className="h-[58px] min-w-0 flex-[1_1_280px] rounded-[14px] border-[1.5px] border-field-border bg-white px-[18px] text-body text-ink placeholder:text-muted"
        />
        <button
          type="button"
          onClick={() => choose(hits[active])}
          className="h-[58px] rounded-[14px] bg-primary px-[26px] text-body font-extrabold text-white shadow-sm hover:bg-ink"
        >
          {buttonLabel}
        </button>
      </div>
      {open && hits.length > 0 && (
        <ul
          id={`${id}-list`}
          role="listbox"
          aria-label="Matching jobs"
          className="absolute top-full right-0 left-0 z-30 m-0 mt-2 max-h-[360px] list-none overflow-y-auto rounded-md border-[1.5px] border-mist bg-white p-1.5 shadow-md"
        >
          {hits.map((h, i) => (
            <li
              key={h.slug}
              id={`${id}-opt-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => {
                e.preventDefault();
                choose(h);
              }}
              onMouseEnter={() => setActive(i)}
              className={`cursor-pointer rounded-[10px] px-3.5 py-2.5 ${i === active ? "bg-ice" : ""}`}
            >
              <span className="block font-bold">{h.title}</span>
              {h.matchedAlt && <span className="block text-small text-muted">Also called {h.matchedAlt}</span>}
            </li>
          ))}
        </ul>
      )}
      {hint && (
        <p id={`${id}-hint`} role="alert" className="m-0 text-small font-bold text-loss">
          {hint}
        </p>
      )}
    </div>
  );
}
