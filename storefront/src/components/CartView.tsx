"use client";

import Image from "next/image";
import Link from "next/link";
import { useBag } from "../lib/bag";
import { formatKes } from "../lib/money";
import { site } from "../lib/site";
import { QtyStepper } from "./QtyStepper";

export function CartView() {
  const { lines, setQuantity, removeItem, count, subtotal, currency, ready } =
    useBag();

  if (!ready) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
        <h1 className="font-display text-4xl text-cream">Your bag</h1>
        <p className="mt-3 text-cream/60">Loading…</p>
      </div>
    );
  }

  return (
    <div
      className={`mx-auto max-w-6xl px-4 py-10 md:px-6 ${
        lines.length ? "pb-28 lg:pb-10" : ""
      }`}
    >
      <h1 className="font-display text-4xl text-cream">Your bag</h1>
      <p className="mt-2 text-sm text-cream/60">
        {count === 0
          ? "Empty for now."
          : `${count} item${count === 1 ? "" : "s"}`}
      </p>

      {lines.length === 0 ? (
        <div className="mt-8">
          <Link
            href="/"
            className="inline-block rounded-full bg-mustard px-5 py-3 text-sm font-semibold text-ink hover:bg-mustard-bright"
          >
            Continue shopping
          </Link>
          <div className="mt-4 flex flex-wrap gap-3 text-sm">
            {site.categories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/category/${cat.slug}`}
                className="text-mustard hover:underline"
              >
                {cat.label}
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_300px]">
          <ul className="space-y-4">
            {lines.map((line) => (
              <li
                key={line.variantId}
                className="flex gap-4 rounded-2xl border border-white/10 bg-ink-soft p-4"
              >
                <Link
                  href={`/product/${line.productHandle}`}
                  className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-ink"
                >
                  {line.thumbnail ? (
                    <Image
                      src={line.thumbnail}
                      alt={line.title}
                      fill
                      className="object-cover"
                      sizes="96px"
                    />
                  ) : null}
                </Link>
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/product/${line.productHandle}`}
                    className="font-medium text-cream hover:text-mustard"
                  >
                    {line.title}
                  </Link>
                  {line.variantTitle !== "Default" && (
                    <p className="text-sm text-cream/55">{line.variantTitle}</p>
                  )}
                  <p className="mt-1 text-sm font-semibold text-mustard">
                    {formatKes(line.unitPrice, line.currency)}
                  </p>
                  <div className="mt-3">
                    <QtyStepper
                      value={line.quantity}
                      onChange={(next) => setQuantity(line.variantId, next)}
                      onRemove={() => removeItem(line.variantId)}
                      aria-label={`${line.title} quantity`}
                    />
                  </div>
                </div>
                <p className="shrink-0 text-sm font-semibold text-cream">
                  {formatKes(line.unitPrice * line.quantity, line.currency)}
                </p>
              </li>
            ))}
          </ul>

          <aside className="h-fit rounded-2xl border border-white/10 bg-ink-soft p-5 lg:sticky lg:top-28">
            <p className="text-sm text-cream/60">Subtotal</p>
            <p className="mt-1 font-display text-3xl text-cream">
              {formatKes(subtotal, currency)}
            </p>
            <p className="mt-3 text-xs text-cream/45">
              Delivery fee is calculated at checkout.
            </p>
            <Link
              href="/checkout"
              className="mt-5 block rounded-full bg-mustard px-5 py-3 text-center text-sm font-semibold text-ink hover:bg-mustard-bright"
            >
              Checkout
            </Link>
            <Link
              href="/"
              className="mt-3 block text-center text-sm text-mustard hover:underline"
            >
              Continue shopping
            </Link>
          </aside>

          {/* Mobile sticky checkout */}
          <div className="fixed inset-x-0 bottom-[calc(3.875rem+env(safe-area-inset-bottom))] z-30 border-t border-white/10 bg-ink/95 px-4 py-3 backdrop-blur lg:hidden">
            <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
              <div>
                <p className="text-xs text-cream/55">Subtotal</p>
                <p className="font-semibold text-mustard">
                  {formatKes(subtotal, currency)}
                </p>
              </div>
              <Link
                href="/checkout"
                className="rounded-full bg-mustard px-5 py-2.5 text-sm font-semibold text-ink"
              >
                Checkout
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
