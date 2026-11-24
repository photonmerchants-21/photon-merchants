import type { Metadata } from "next";
import Link from "next/link";
import { formatCampaignEnd } from "../../components/CampaignBanner";
import { CountdownBoxes } from "../../components/Countdown";
import { ProductCard } from "../../components/ProductCard";
import {
  fetchHomepageConfig,
  getLiveCampaign,
  resolveSectionProducts,
} from "../../lib/homepage";
import { getNavCategories } from "../../lib/medusa";
import type { MedusaProduct } from "../../lib/medusa-types";
import { percentOff, productPrice } from "../../lib/money";

type Props = { searchParams: Promise<{ cat?: string; sort?: string }> };

const SORTS = [
  { id: "discount", label: "Biggest discount" },
  { id: "price-asc", label: "Price: low to high" },
  { id: "price-desc", label: "Price: high to low" },
] as const;
type SortId = (typeof SORTS)[number]["id"];

export async function generateMetadata(): Promise<Metadata> {
  const campaign = await getLiveCampaign();
  return {
    title: campaign ? `${campaign.name} deals` : "Deals",
    description:
      campaign?.subtitle ||
      "Current deals at Photon Merchants, OTC Wholesale Mall, Nairobi.",
  };
}

function sortDeals(products: MedusaProduct[], sort: SortId) {
  const amount = (p: MedusaProduct) => productPrice(p).amount ?? 0;
  const sorted = [...products];
  if (sort === "price-asc") return sorted.sort((a, b) => amount(a) - amount(b));
  if (sort === "price-desc") return sorted.sort((a, b) => amount(b) - amount(a));
  return sorted.sort((a, b) => percentOff(b) - percentOff(a));
}

function dealsHref(cat: string | null, sort: SortId) {
  const params = new URLSearchParams();
  if (cat) params.set("cat", cat);
  if (sort !== "discount") params.set("sort", sort);
  const qs = params.toString();
  return qs ? `/deals?${qs}` : "/deals";
}

const chip = (active: boolean) =>
  `whitespace-nowrap rounded-full border px-4 py-2 text-sm transition ${
    active
      ? "border-mustard bg-mustard font-semibold text-ink"
      : "border-white/15 text-cream/80 hover:border-mustard/50"
  }`;

export default async function DealsPage({ searchParams }: Props) {
  const { cat = null, sort: sortParam } = await searchParams;
  const sort: SortId = SORTS.find((s) => s.id === sortParam)?.id ?? "discount";
  const campaign = await getLiveCampaign();

  if (!campaign) {
    const homepage = await fetchHomepageConfig();
    const offers = await resolveSectionProducts(
      homepage?.offers.product_handles ?? []
    );
    return (
      <div className="mx-auto max-w-6xl px-4 py-12 md:px-6">
        <h1 className="font-display text-4xl text-cream">Deals</h1>
        <p className="mt-3 max-w-xl text-cream/65">
          There’s no sale running right now. Here’s what’s on offer today, or
          follow us on WhatsApp to hear about the next one first.
        </p>
        {offers.length > 0 && (
          <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {offers.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    );
  }

  const all = await resolveSectionProducts(campaign.product_handles);
  const deals = all.filter((p) => percentOff(p) > 0);

  const dealHandles = new Set(
    deals.flatMap((p) => p.categories?.map((c) => c.handle) ?? [])
  );
  const categories = new Map(
    (await getNavCategories())
      .filter((c) => dealHandles.has(c.slug))
      .map((c) => [c.slug, c.label])
  );
  const activeCat = cat && categories.has(cat) ? cat : null;
  const shown = sortDeals(
    activeCat
      ? deals.filter((p) => p.categories?.some((c) => c.handle === activeCat))
      : deals,
    sort
  );
  const maxPct = deals.reduce((m, p) => Math.max(m, percentOff(p)), 0);

  return (
    <div>
      <section className="border-b border-white/10 bg-ink-soft">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 md:flex-row md:items-end md:justify-between md:px-6 md:py-12">
          <div className="max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-mustard">
              {campaign.name}
              {campaign.ends_at && (
                <span className="mt-1 block text-cream/60 sm:mt-0 sm:inline">
                  <span className="hidden sm:inline"> · </span>
                  Ends {formatCampaignEnd(campaign.ends_at)}
                </span>
              )}
            </p>
            <h1 className="mt-3 font-display text-4xl leading-[1.05] text-cream md:text-5xl">
              {campaign.headline}
            </h1>
            <p className="mt-3 text-cream/70">
              {deals.length} deal{deals.length === 1 ? "" : "s"}
              {maxPct > 0 && `, up to ${maxPct}% off`}. Prices shown already
              include the discount and apply at checkout.
            </p>
          </div>
          {campaign.ends_at && <CountdownBoxes endsAt={campaign.ends_at} />}
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-8 md:px-6">
        {categories.size > 1 && (
          <nav
            aria-label="Filter deals by category"
            className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0"
          >
            <Link
              href={dealsHref(null, sort)}
              scroll={false}
              aria-current={!activeCat ? "true" : undefined}
              className={chip(!activeCat)}
            >
              All deals
            </Link>
            {[...categories].map(([handle, name]) => (
              <Link
                key={handle}
                href={dealsHref(handle, sort)}
                scroll={false}
                aria-current={activeCat === handle ? "true" : undefined}
                className={chip(activeCat === handle)}
              >
                {name}
              </Link>
            ))}
          </nav>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
          <span className="text-cream/50">Sort</span>
          {SORTS.map((s) => (
            <Link
              key={s.id}
              href={dealsHref(activeCat, s.id)}
              scroll={false}
              aria-current={s.id === sort ? "true" : undefined}
              className={
                s.id === sort
                  ? "font-semibold text-mustard underline underline-offset-4"
                  : "text-cream/70 hover:text-mustard"
              }
            >
              {s.label}
            </Link>
          ))}
        </div>

        {shown.length > 0 ? (
          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {shown.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                dealBadge={campaign.badge}
              />
            ))}
          </div>
        ) : (
          <p className="mt-8 text-cream/65">
            These deals have sold out.{" "}
            <Link href="/" className="text-mustard hover:underline">
              Back to the shop
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
