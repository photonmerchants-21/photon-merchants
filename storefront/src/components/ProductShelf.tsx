import Link from "next/link";
import { ProductCard } from "./ProductCard";
import type { MedusaProduct } from "../lib/medusa-types";
import { site } from "../lib/site";

export function ProductShelf({
  id,
  title,
  products,
  badge,
  dealBadge,
}: {
  id?: string;
  title: string;
  products: MedusaProduct[];
  badge?: string;
  dealBadge?: string | null;
}) {
  return (
    <section id={id} className="border-t border-white/10">
      <div className="mx-auto max-w-6xl px-4 py-12 md:px-6">
        <h2 className="font-display text-2xl text-cream md:text-3xl">{title}</h2>
        {products.length ? (
          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                badge={badge}
                dealBadge={dealBadge}
              />
            ))}
          </div>
        ) : (
          <div className="mt-6 rounded-2xl border border-dashed border-white/15 bg-ink-soft px-5 py-8">
            <p className="text-sm text-cream/65">
              Nothing in this shelf yet. Browse categories or ask us on WhatsApp.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              {site.categories.map((cat) => (
                <Link
                  key={cat.slug}
                  href={`/category/${cat.slug}`}
                  className="text-sm text-mustard hover:underline"
                >
                  {cat.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
