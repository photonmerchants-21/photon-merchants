import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductCard } from "../../../components/ProductCard";
import { getLiveCampaign } from "../../../lib/homepage";
import {
  getCategoryByHandle,
  getNavCategories,
  listProducts,
} from "../../../lib/medusa";
import type { MedusaProduct } from "../../../lib/medusa-types";
import { percentOff, productPrice } from "../../../lib/money";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ sort?: string }>;
};

const SORTS = [
  { id: "featured", label: "Featured" },
  { id: "price-asc", label: "Price: low to high" },
  { id: "price-desc", label: "Price: high to low" },
  { id: "sale", label: "On sale" },
] as const;
type SortId = (typeof SORTS)[number]["id"];

function sortProducts(products: MedusaProduct[], sort: SortId) {
  const amount = (p: MedusaProduct) => productPrice(p).amount ?? 0;
  if (sort === "price-asc") return [...products].sort((a, b) => amount(a) - amount(b));
  if (sort === "price-desc") return [...products].sort((a, b) => amount(b) - amount(a));
  if (sort === "sale") {
    return products
      .filter((p) => percentOff(p) > 0)
      .sort((a, b) => percentOff(b) - percentOff(a));
  }
  return products;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const categories = await getNavCategories();
  const category = categories.find((c) => c.slug === slug);
  const label = category?.label ?? "Category";
  return {
    title: label,
    description:
      category?.description ||
      `Shop ${label.toLowerCase()} at Photon Merchants — OTC Wholesale Mall, Nairobi. M-Pesa, delivery, or collect.`,
  };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { sort: sortParam } = await searchParams;
  const sort: SortId =
    SORTS.find((s) => s.id === sortParam)?.id ?? "featured";
  const [categories, campaign] = await Promise.all([
    getNavCategories(),
    getLiveCampaign(),
  ]);
  const local = categories.find((c) => c.slug === slug);
  if (!local) notFound();

  let products: Awaited<ReturnType<typeof listProducts>>["products"] = [];
  let error: string | null = null;
  let allCount = 0;

  try {
    const category = await getCategoryByHandle(slug);
    if (!category) {
      error = "This category isn’t available right now. Please check back soon.";
    } else {
      const result = await listProducts({ categoryId: category.id, limit: 48 });
      allCount = result.products.length;
      products = sortProducts(result.products, sort);
    }
  } catch {
    error = "We couldn’t load this category just now. Please refresh in a moment.";
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
      <p className="text-sm text-cream/50">
        <Link href="/" className="hover:text-mustard">
          Home
        </Link>{" "}
        / {local.label}
      </p>
      <h1 className="mt-3 font-display text-4xl text-cream">{local.label}</h1>
      <p className="mt-3 max-w-xl text-cream/65">
        {error
          ? error
          : allCount
            ? `${local.description ? `${local.description}. ` : ""}${allCount} product${allCount === 1 ? "" : "s"}.`
            : "No products in this category yet."}
      </p>

      {!error && allCount > 1 && (
        <nav
          aria-label="Sort products"
          className="no-scrollbar -mx-4 mt-6 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0"
        >
          {SORTS.map((s) => {
            const active = s.id === sort;
            return (
              <Link
                key={s.id}
                href={
                  s.id === "featured"
                    ? `/category/${slug}`
                    : `/category/${slug}?sort=${s.id}`
                }
                scroll={false}
                aria-current={active ? "true" : undefined}
                className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm transition ${
                  active
                    ? "border-mustard bg-mustard text-ink font-semibold"
                    : "border-white/15 text-cream/80 hover:border-mustard/50"
                }`}
              >
                {s.label}
              </Link>
            );
          })}
        </nav>
      )}

      {!error && allCount > 0 && products.length === 0 && (
        <p className="mt-8 text-cream/65">
          Nothing on sale here right now.{" "}
          <Link href={`/category/${slug}`} className="text-mustard hover:underline">
            See all {local.label.toLowerCase()}
          </Link>
        </p>
      )}

      {!error && products.length > 0 && (
        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              dealBadge={campaign?.badge}
            />
          ))}
        </div>
      )}

      {!error && allCount === 0 && (
        <div className="mt-8 rounded-2xl border border-white/10 bg-ink-soft px-6 py-10">
          <p className="text-cream/70">
            Nothing listed here yet. Try another category or search.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            {categories
              .filter((c) => c.slug !== slug)
              .map((cat) => (
                <Link
                  key={cat.slug}
                  href={`/category/${cat.slug}`}
                  className="rounded-full border border-white/20 px-4 py-2 text-sm text-cream hover:border-mustard/50"
                >
                  {cat.label}
                </Link>
              ))}
            <Link
              href="/search"
              className="rounded-full bg-mustard px-4 py-2 text-sm font-semibold text-ink"
            >
              Search
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
