"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavCategory } from "../lib/site";

const linkBase =
  "relative whitespace-nowrap py-1 transition hover:text-mustard focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mustard";

const activeLine =
  "after:absolute after:inset-x-0 after:-bottom-[9px] after:h-0.5 after:rounded-full after:bg-mustard md:after:-bottom-[11px]";

export function CategoryNav({
  categories,
  dealsLabel,
}: {
  categories: NavCategory[];
  /** Campaign name while a sale is live; replaces the generic Offers link. */
  dealsLabel?: string | null;
}) {
  const pathname = usePathname();
  const dealsActive = pathname === "/deals";

  return (
    <nav aria-label="Categories" className="border-t border-white/10">
      <div className="no-scrollbar mx-auto flex max-w-6xl gap-5 overflow-x-auto px-4 py-2 text-sm md:px-6 md:py-2.5">
        {dealsLabel && (
          <Link
            href="/deals"
            aria-current={dealsActive ? "page" : undefined}
            className={`${linkBase} font-semibold text-mustard ${dealsActive ? activeLine : ""}`}
          >
            {dealsLabel}
          </Link>
        )}
        {categories.map((cat) => {
          const href = `/category/${cat.slug}`;
          const active = pathname === href;
          return (
            <Link
              key={cat.slug}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`${linkBase} ${
                active ? `font-semibold text-mustard ${activeLine}` : "text-cream/75"
              }`}
            >
              {cat.label}
            </Link>
          );
        })}
        {!dealsLabel && (
          <Link href="/#offers" className={`${linkBase} text-cream/75`}>
            Offers
          </Link>
        )}
      </div>
    </nav>
  );
}
