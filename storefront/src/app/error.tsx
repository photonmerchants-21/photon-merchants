"use client";

import Link from "next/link";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-start px-4 py-16 md:px-6">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-mustard">
        Something went wrong
      </p>
      <h1 className="mt-3 font-display text-4xl text-cream">Couldn’t load this page</h1>
      <p className="mt-3 text-cream/65">
        The shop hit a temporary error. Try again, or go home and browse.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-full bg-mustard px-5 py-3 text-sm font-semibold text-ink hover:bg-mustard-bright"
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded-full border border-white/20 px-5 py-3 text-sm text-cream hover:border-mustard/50"
        >
          Home
        </Link>
      </div>
    </div>
  );
}
