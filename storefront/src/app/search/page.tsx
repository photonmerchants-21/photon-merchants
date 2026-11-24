import Link from "next/link";
import { Suspense } from "react";
import { ProductCard } from "../../components/ProductCard";
import { SearchForm } from "../../components/SearchForm";
import { getLiveCampaign } from "../../lib/homepage";
import { getNavCategories, listProducts } from "../../lib/medusa";

type Props = { searchParams: Promise<{ q?: string }> };

export const metadata = { title: "Search" };

export default async function SearchPage({ searchParams }: Props) {
  const { q = "" } = await searchParams;
  const query = q.trim();
  const [categories, campaign] = await Promise.all([
    getNavCategories(),
    getLiveCampaign(),
  ]);

  let products: Awaited<ReturnType<typeof listProducts>>["products"] = [];
  let error: string | null = null;

  if (query) {
    try {
      const result = await listProducts({ q: query, limit: 24 });
      products = result.products;
    } catch {
      error = "Search isn’t responding right now. Please try again in a moment.";
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
      <h1 className="font-display text-4xl text-cream">
        {query ? `Results for “${query}”` : "Search"}
      </h1>

      <div className="mt-5 max-w-md">
        <Suspense fallback={<div className="h-11 rounded-full bg-ink-soft" />}>
          <SearchForm />
        </Suspense>
      </div>

      {!query && (
        <p className="mt-4 text-cream/65">
          Try “duvet”, “blender”, or “mirror” — or browse{" "}
          {categories.map((cat, i) => (
            <span key={cat.slug}>
              {i > 0 ? ", " : ""}
              <Link
                href={`/category/${cat.slug}`}
                className="text-mustard hover:underline"
              >
                {cat.label}
              </Link>
            </span>
          ))}
          .
        </p>
      )}

      {query && error && (
        <p className="mt-4 text-red-300" role="alert">
          {error}
        </p>
      )}

      {query && !error && products.length === 0 && (
        <div className="mt-8 rounded-2xl border border-white/10 bg-ink-soft px-6 py-10 text-center">
          <p className="font-display text-2xl text-cream">No matches</p>
          <p className="mt-2 text-sm text-cream/60">
            Nothing matched “{query}”. Try another word or browse categories.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {categories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/category/${cat.slug}`}
                className="rounded-full border border-white/20 px-4 py-2 text-sm text-cream hover:border-mustard/50"
              >
                {cat.label}
              </Link>
            ))}
          </div>
        </div>
      )}

      {products.length > 0 && (
        <>
          <p className="mt-4 text-cream/65">
            {products.length} result{products.length === 1 ? "" : "s"}
          </p>
          <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                dealBadge={campaign?.badge}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
