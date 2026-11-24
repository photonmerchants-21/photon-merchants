import Image from "next/image";
import Link from "next/link";
import type { HomepageCampaign } from "../lib/homepage";
import type { MedusaProduct } from "../lib/medusa-types";
import { CountdownBoxes } from "./Countdown";
import { ProductCard } from "./ProductCard";

export function formatCampaignEnd(iso: string) {
  return new Date(iso).toLocaleString("en-KE", {
    timeZone: "Africa/Nairobi",
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function CampaignBanner({
  campaign,
  products,
  total,
}: {
  campaign: HomepageCampaign;
  /** Top deals to preview. */
  products: MedusaProduct[];
  /** Number of products in the campaign. */
  total: number;
}) {
  return (
    <section id="deals" className="border-b border-white/10 bg-ink-soft">
      <div className="relative overflow-hidden">
        {campaign.image_url && (
          <Image
            src={campaign.image_url}
            alt=""
            fill
            aria-hidden
            priority
            sizes="100vw"
            className="object-cover opacity-40"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/90 to-ink/40" />
        <div className="relative mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 md:flex-row md:items-end md:justify-between md:min-h-[46vh] md:px-6 md:py-16">
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
            <h1 className="mt-3 font-display text-4xl leading-[1.05] text-cream md:text-6xl">
              {campaign.headline}
            </h1>
            {campaign.subtitle && (
              <p className="mt-3 text-base text-cream/75 md:text-lg">
                {campaign.subtitle}
              </p>
            )}
            <Link
              href="/deals"
              className="mt-6 inline-flex rounded-full bg-mustard px-5 py-3 text-sm font-semibold text-ink hover:bg-mustard-bright"
            >
              {campaign.cta_label || "Shop the deals"}
              {total > 0 && ` (${total})`}
            </Link>
          </div>
          {campaign.ends_at && <CountdownBoxes endsAt={campaign.ends_at} />}
        </div>
      </div>

      {products.length > 0 && (
        <div className="mx-auto max-w-6xl px-4 pb-12 pt-8 md:px-6">
          <div className="flex items-baseline justify-between gap-4">
            <h3 className="font-display text-2xl text-cream">Biggest drops</h3>
            <Link href="/deals" className="text-sm font-semibold text-mustard hover:underline">
              See all deals
            </Link>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} dealBadge={campaign.badge} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
