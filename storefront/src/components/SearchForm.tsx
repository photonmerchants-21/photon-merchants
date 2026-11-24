"use client";

import { useSearchParams } from "next/navigation";

export function SearchForm({
  compact = false,
  className = "",
}: {
  compact?: boolean;
  className?: string;
}) {
  const params = useSearchParams();
  const q = params.get("q") || "";

  return (
    <form
      action="/search"
      className={`flex min-w-0 items-center overflow-hidden rounded-full border border-white/15 bg-ink-soft ${className}`}
    >
      <input
        name="q"
        type="search"
        defaultValue={q}
        key={q}
        placeholder="Search duvets, blenders, mirrors…"
        className="min-w-0 flex-1 bg-transparent px-4 py-2.5 text-sm text-cream outline-none placeholder:text-cream/40 focus-visible:ring-0"
        aria-label="Search"
      />
      <button
        type="submit"
        className="m-1 rounded-full bg-mustard px-3 py-1.5 text-sm font-semibold text-ink hover:bg-mustard-bright focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mustard sm:px-4"
        aria-label="Search"
      >
        {compact ? (
          <span className="sm:hidden" aria-hidden>
            <SearchIcon />
          </span>
        ) : null}
        <span className={compact ? "hidden sm:inline" : undefined}>Search</span>
      </button>
    </form>
  );
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M10.5 10.5 13.5 13.5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}
