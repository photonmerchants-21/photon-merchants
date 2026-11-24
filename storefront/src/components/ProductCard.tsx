import Image from "next/image";
import Link from "next/link";
import type { MedusaProduct } from "../lib/medusa-types";
import {
  formatKes,
  isPriceListSale,
  offerCompareAt,
  percentOff,
  productPrice,
} from "../lib/money";

export function ProductCard({
  product,
  badge,
  dealBadge,
}: {
  product: MedusaProduct;
  badge?: string;
  /** Campaign label (e.g. "Black Friday") shown on price-list deals. */
  dealBadge?: string | null;
}) {
  const price = productPrice(product);
  const compare = offerCompareAt(product);
  const pct = percentOff(product);
  const onSale = pct > 0;
  const isDeal = onSale && isPriceListSale(product.variants?.[0]);
  const label = badge || (isDeal && dealBadge) || (onSale ? "Sale" : null);
  const image = product.thumbnail || product.images?.[0]?.url;

  return (
    <Link
      href={`/product/${product.handle}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-ink-soft transition hover:border-mustard/45"
    >
      <div className="relative aspect-[4/3] bg-ink">
        {image ? (
          <Image
            src={image}
            alt={product.title}
            fill
            className="object-cover transition duration-300 group-hover:scale-[1.03]"
            sizes="(max-width: 768px) 50vw, 25vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-cream/40">
            No image
          </div>
        )}
        {label && (
          <span
            className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
              isDeal && !badge
                ? "bg-ink text-mustard ring-1 ring-mustard/60"
                : "bg-mustard text-ink"
            }`}
          >
            {label}
          </span>
        )}
        {onSale && (
          <span className="absolute right-3 top-3 rounded-full bg-mustard px-2 py-1 text-[11px] font-bold tabular-nums text-ink">
            −{pct}%
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <p className="line-clamp-2 font-medium leading-snug text-cream group-hover:text-mustard">
          {product.title}
        </p>
        <div className="mt-auto flex flex-wrap items-baseline gap-x-2">
          <p className="text-sm font-semibold text-mustard">{price.label}</p>
          {onSale && (
            <p className="text-xs text-cream/45 line-through">
              {formatKes(compare, price.currency)}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
