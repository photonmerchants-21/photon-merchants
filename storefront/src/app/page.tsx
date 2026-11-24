import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CampaignBanner } from "../components/CampaignBanner";
import { ProductShelf } from "../components/ProductShelf";
import {
  fetchHomepageConfig,
  getLiveCampaign,
  resolveSectionProducts,
} from "../lib/homepage";
import { getNavCategories } from "../lib/medusa";
import { percentOff } from "../lib/money";
import { mapsHref, site, telHref, whatsappHref } from "../lib/site";

export const metadata: Metadata = {
  title: { absolute: `${site.name} · ${site.tagline}` },
  description:
    "Shop kitchen, appliances, bedding, bathroom, decor, and tech from OTC Wholesale Mall, Nairobi. Pay with M-Pesa. Collect in person or we deliver.",
};

const FALLBACK_HERO = {
  eyebrow: "Photon Merchants · Nairobi",
  title: "Quality and comfort, from OTC to your gate.",
  subtitle:
    "Kitchen, bedroom, bathroom, and tech for the home. Pay with M-Pesa. Collect at the mall or we deliver across Nairobi.",
  image_url:
    "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=1600&q=80",
  cta_label: "Shop bedroom",
  cta_href: "/category/bedroom-bedding",
};

const FALLBACK_TRUST = [
  { title: "Pay on the phone", body: "M-Pesa STK push — no cards at launch" },
  { title: "Nairobi delivery", body: "Fees by area · rider or courier" },
  { title: "Or collect", body: "OTC Mall · Mon–Sat 7am–7pm" },
];

export default async function HomePage() {
  const homepage = await fetchHomepageConfig();
  const hero = homepage?.hero ?? FALLBACK_HERO;
  const trust = homepage?.trust?.length ? homepage.trust : FALLBACK_TRUST;

  const campaign = await getLiveCampaign();
  const dealBadge = campaign?.badge;

  const [offers, featured, newArrivals, bestsellers, deals, categories] =
    await Promise.all([
      resolveSectionProducts(homepage?.offers.product_handles ?? []),
      resolveSectionProducts(homepage?.featured.product_handles ?? []),
      resolveSectionProducts(homepage?.new_arrivals.product_handles ?? []),
      resolveSectionProducts(homepage?.bestsellers.product_handles ?? []),
      resolveSectionProducts(campaign?.product_handles ?? []),
      getNavCategories(),
    ]);
  const topDeals = [...deals]
    .sort((a, b) => percentOff(b) - percentOff(a))
    .slice(0, 4);

  return (
    <div>
      {/* 2.1 Full-bleed hero; a live campaign takes this slot */}
      {campaign ? (
        <CampaignBanner
          campaign={campaign}
          products={topDeals}
          total={deals.length}
        />
      ) : (
        <section className="relative min-h-[64svh] overflow-hidden border-b border-white/10 md:min-h-[78vh]">
          <Image
            src={hero.image_url}
            alt=""
            fill
            priority
            className="object-cover"
            sizes="100vw"
            aria-hidden
          />
          <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/85 to-ink/35" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-transparent to-ink/40" />
          <div className="relative mx-auto flex min-h-[64svh] max-w-6xl flex-col justify-end px-4 pb-10 pt-20 md:min-h-[78vh] md:justify-center md:px-6 md:pb-24 md:pt-24">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-mustard">
              {hero.eyebrow}
            </p>
            <h1 className="max-w-xl font-display text-4xl leading-[1.05] tracking-tight text-cream md:text-6xl">
              {hero.title}
            </h1>
            <p className="mt-4 max-w-lg text-base leading-relaxed text-cream/75 md:mt-5 md:text-lg">
              {hero.subtitle}
            </p>
            <div className="mt-6 flex flex-wrap gap-3 md:mt-8">
              <Link
                href={hero.cta_href || FALLBACK_HERO.cta_href}
                className="rounded-full bg-mustard px-5 py-3 text-sm font-semibold text-ink hover:bg-mustard-bright"
              >
                {hero.cta_label || "Shop now"}
              </Link>
              <a
                href={whatsappHref}
                className="rounded-full border border-cream/25 px-5 py-3 text-sm font-semibold text-cream hover:border-mustard hover:text-mustard"
              >
                WhatsApp {site.whatsappDisplay}
              </a>
            </div>
          </div>
        </section>
      )}

      {/* 2.5 Trust strip */}
      <section className="border-b border-white/10">
        <div className="mx-auto grid max-w-6xl grid-cols-3 divide-x divide-white/10">
          {trust.map((item) => (
            <div key={item.title} className="px-3 py-4 md:px-6 md:py-5">
              <p className="text-[13px] font-semibold leading-snug text-cream md:text-base">
                {item.title}
              </p>
              <p className="mt-1 text-[11px] leading-snug text-cream/60 md:text-sm">
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 2.2 Offers */}
      <ProductShelf
        id="offers"
        title={homepage?.offers.title || "On offer"}
        products={offers}
        dealBadge={dealBadge}
      />

      {/* 2.3 Category tiles */}
      <section className="border-t border-white/10">
        <div className="mx-auto max-w-6xl px-4 py-12 md:px-6">
          <h2 className="font-display text-2xl text-cream md:text-3xl">
            Shop by category
          </h2>
          <p className="mt-2 text-sm text-cream/60">
            Everything for the home, from OTC Wholesale Mall.
          </p>
          <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            {categories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/category/${cat.slug}`}
                className="group relative flex aspect-[4/3] items-end overflow-hidden rounded-2xl border border-white/10 bg-ink-soft transition hover:border-mustard/50"
              >
                {cat.image && (
                  <Image
                    src={cat.image}
                    alt=""
                    fill
                    aria-hidden
                    sizes="(max-width: 768px) 50vw, 280px"
                    className="object-cover transition duration-500 group-hover:scale-[1.04]"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/45 to-transparent" />
                <p className="relative p-3 font-display text-lg leading-tight text-cream group-hover:text-mustard md:p-5 md:text-2xl">
                  {cat.label}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 2.4 Featured / New / Best sellers */}
      <ProductShelf
        title={homepage?.featured.title || "Featured"}
        products={featured}
        dealBadge={dealBadge}
      />
      <ProductShelf
        title={homepage?.new_arrivals.title || "New"}
        products={newArrivals}
        dealBadge={dealBadge}
      />
      <ProductShelf
        title={homepage?.bestsellers.title || "Best sellers"}
        products={bestsellers}
        dealBadge={dealBadge}
      />

      <section className="border-t border-white/10 bg-ink-soft">
        <div className="mx-auto max-w-6xl px-4 py-12 md:px-6">
          <h2 className="font-display text-2xl text-cream">Visit us</h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-cream/70">
            {site.address}
            <br />
            {site.hours}
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <a
              href={mapsHref}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-mustard px-5 py-2.5 text-sm font-semibold text-ink hover:bg-mustard-bright"
            >
              Get directions
            </a>
            <a
              href={telHref(site.phones[0])}
              className="rounded-full border border-cream/25 px-5 py-2.5 text-sm font-semibold text-cream hover:border-mustard hover:text-mustard"
            >
              Call {site.phones[0]}
            </a>
            <a
              href={whatsappHref}
              className="rounded-full border border-cream/25 px-5 py-2.5 text-sm font-semibold text-cream hover:border-mustard hover:text-mustard"
            >
              WhatsApp
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
