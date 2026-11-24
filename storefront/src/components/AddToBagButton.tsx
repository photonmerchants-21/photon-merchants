"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useBag } from "../lib/bag";
import type { MedusaProduct } from "../lib/medusa-types";
import { formatKes, offerCompareAt, percentOff, stockLabel } from "../lib/money";
import { QtyStepper } from "./QtyStepper";

export function AddToBagButton({ product }: { product: MedusaProduct }) {
  const { addItem, setQuantity, removeItem, lines, ready } = useBag();
  const variants = useMemo(() => product.variants ?? [], [product.variants]);
  const [variantId, setVariantId] = useState(variants[0]?.id ?? "");
  const [justAdded, setJustAdded] = useState(false);

  const variant = useMemo(
    () => variants.find((v) => v.id === variantId) ?? variants[0],
    [variants, variantId]
  );
  const stock = stockLabel(variant);
  const price = variant?.calculated_price;
  const compare = offerCompareAt(product, variant);
  const pct = percentOff(product, variant);
  const onSale = pct > 0;

  const qtyInBag = useMemo(() => {
    if (!variant) return 0;
    return lines.find((l) => l.variantId === variant.id)?.quantity ?? 0;
  }, [lines, variant]);

  const actionsRef = useRef<HTMLDivElement>(null);
  const [actionsVisible, setActionsVisible] = useState(true);
  useEffect(() => {
    const el = actionsRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      ([entry]) => setActionsVisible(entry.isIntersecting),
      { rootMargin: "0px 0px -80px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ready]);

  if (!variant) {
    return (
      <p className="text-sm text-cream/60">This product has no variants yet.</p>
    );
  }

  const add = () => {
    addItem({
      productId: product.id,
      productHandle: product.handle,
      title: product.title,
      variantId: variant.id,
      variantTitle: variant.title,
      thumbnail: product.thumbnail,
      unitPrice: price?.calculated_amount ?? 0,
      currency: price?.currency_code ?? "kes",
    });
    setJustAdded(true);
  };

  const priceText = formatKes(
    price?.calculated_amount,
    price?.currency_code ?? "kes"
  );

  return (
    <div className="space-y-4">
      {variants.length > 1 && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-mustard">
            Option
          </p>
          <div className="flex flex-wrap gap-2">
            {variants.map((v) => {
              const inBag =
                lines.find((l) => l.variantId === v.id)?.quantity ?? 0;
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setVariantId(v.id)}
                  className={`rounded-full border px-4 py-2 text-sm transition ${
                    v.id === variant.id
                      ? "border-mustard bg-mustard text-ink"
                      : "border-white/20 text-cream hover:border-mustard/60"
                  }`}
                >
                  {v.title}
                  {inBag > 0 ? (
                    <span
                      className={`ml-1.5 text-xs ${
                        v.id === variant.id ? "text-ink/70" : "text-mustard"
                      }`}
                    >
                      · {inBag}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-baseline gap-3">
        <p className="font-display text-3xl text-cream">{priceText}</p>
        {onSale && (
          <>
            <p className="text-lg text-cream/45 line-through">
              {formatKes(compare, price?.currency_code ?? "kes")}
            </p>
            <p className="rounded-full bg-mustard px-2 py-0.5 text-xs font-bold text-ink">
              Save {formatKes((compare ?? 0) - (price?.calculated_amount ?? 0), price?.currency_code ?? "kes")}
            </p>
          </>
        )}
        <p
          className={`text-sm ${stock.inStock ? "text-cream/60" : "text-red-300"}`}
        >
          {stock.label}
        </p>
      </div>

      <div ref={actionsRef}>
      {!ready ? (
        <div className="h-12 w-40 animate-pulse rounded-full bg-white/10" />
      ) : qtyInBag > 0 ? (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-4">
            <QtyStepper
              size="lg"
              value={qtyInBag}
              onChange={(next) => setQuantity(variant.id, next)}
              onRemove={() => removeItem(variant.id)}
              aria-label={`${product.title} quantity`}
            />
            <Link
              href="/cart"
              className="rounded-full border border-mustard/50 px-4 py-2.5 text-sm font-semibold text-mustard hover:bg-mustard/10"
            >
              View bag
            </Link>
          </div>
          <p className="sr-only" aria-live="polite">
            {justAdded
              ? `${product.title} added to bag. ${qtyInBag} in bag.`
              : `${qtyInBag} in bag.`}
          </p>
        </div>
      ) : (
        <button
          type="button"
          disabled={!stock.inStock}
          onClick={add}
          className="w-full rounded-full bg-mustard px-5 py-3 text-sm font-semibold text-ink transition hover:bg-mustard-bright disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
        >
          {stock.inStock ? "Add to bag" : "Out of stock"}
        </button>
      )}
      </div>

      {ready && !actionsVisible && (
        <div className="fixed inset-x-0 bottom-[calc(3.875rem+env(safe-area-inset-bottom))] z-30 border-t border-white/10 bg-ink/95 px-4 py-2.5 backdrop-blur md:hidden">
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs text-cream/60">{product.title}</p>
              <p className="font-semibold text-mustard">{priceText}</p>
            </div>
            {qtyInBag > 0 ? (
              <Link
                href="/cart"
                className="shrink-0 rounded-full bg-mustard px-5 py-2.5 text-sm font-semibold text-ink"
              >
                View bag ({qtyInBag})
              </Link>
            ) : (
              <button
                type="button"
                disabled={!stock.inStock}
                onClick={add}
                className="shrink-0 rounded-full bg-mustard px-5 py-2.5 text-sm font-semibold text-ink disabled:opacity-40"
              >
                {stock.inStock ? "Add to bag" : "Out of stock"}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
