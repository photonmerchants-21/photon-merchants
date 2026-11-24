import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { getLiveCampaign } from "../lib/homepage";
import { getNavCategories } from "../lib/medusa";
import { site } from "../lib/site";
import { AccountLink } from "./AccountLink";
import { BagLink } from "./BagLink";
import { CategoryNav } from "./CategoryNav";
import { SearchForm } from "./SearchForm";

export async function SiteHeader() {
  const [categories, campaign] = await Promise.all([
    getNavCategories(),
    getLiveCampaign(),
  ]);

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-ink/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 md:gap-4 md:px-6">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mustard"
        >
          <Image
            src="/logo.png"
            alt={site.name}
            width={52}
            height={52}
            className="h-10 w-10 rounded-full object-cover ring-1 ring-mustard/40 md:h-11 md:w-11"
            priority
          />
          <span className="hidden leading-tight sm:block">
            <span className="block font-display text-lg tracking-wide text-mustard">
              {site.name}
            </span>
            <span className="block text-[10px] uppercase tracking-[0.22em] text-cream/55">
              {site.tagline}
            </span>
          </span>
        </Link>

        <Suspense
          fallback={
            <div className="ml-auto h-10 min-w-0 flex-1 rounded-full bg-ink-soft md:ml-6 md:max-w-md" />
          }
        >
          <SearchForm
            compact
            className="ml-auto min-w-0 flex-1 md:ml-6 md:max-w-md"
          />
        </Suspense>

        <nav className="hidden items-center gap-4 text-sm text-cream/80 lg:flex">
          <AccountLink />
          <Link
            href="/orders"
            className="hover:text-mustard focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mustard"
          >
            Orders
          </Link>
          <BagLink className="hover:text-mustard" />
        </nav>
      </div>

      <CategoryNav categories={categories} dealsLabel={campaign?.name} />
    </header>
  );
}
