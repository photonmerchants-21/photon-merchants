import type { MedusaProduct, MedusaVariant } from "./medusa-types";

export function formatKes(amount: number | null | undefined, currency = "kes") {
  if (amount == null || Number.isNaN(amount)) return "—";
  try {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: currency.toUpperCase(),
      currencyDisplay: "code",
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `KES ${Math.round(amount).toLocaleString("en-KE")}`;
  }
}

export function productPrice(product: MedusaProduct) {
  const variant = product.variants?.[0];
  const price = variant?.calculated_price;
  return {
    amount: price?.calculated_amount ?? null,
    currency: price?.currency_code ?? "kes",
    label: formatKes(price?.calculated_amount, price?.currency_code ?? "kes"),
  };
}

export function stockLabel(variant?: MedusaVariant | null) {
  if (!variant) return { inStock: false, label: "Unavailable" };
  if (variant.manage_inventory === false) {
    return { inStock: true, label: "In stock" };
  }
  const qty = variant.inventory_quantity;
  if (qty == null) return { inStock: true, label: "In stock" };
  if (qty <= 0) return { inStock: false, label: "Out of stock" };
  if (qty <= 5) return { inStock: true, label: `Only ${qty} left` };
  return { inStock: true, label: "In stock" };
}

/** True when the variant's price comes from an active Medusa sale price list. */
export function isPriceListSale(variant?: MedusaVariant | null) {
  return variant?.calculated_price?.calculated_price?.price_list_type === "sale";
}

/**
 * Strike-through price: the regular price while a sale price list applies,
 * otherwise the manual `compare_at_price` set on the product.
 */
export function offerCompareAt(
  product: MedusaProduct,
  variant: MedusaVariant | null | undefined = product.variants?.[0]
): number | null {
  const price = variant?.calculated_price;
  if (
    isPriceListSale(variant) &&
    price?.original_amount != null &&
    price.calculated_amount != null &&
    price.original_amount > price.calculated_amount
  ) {
    return price.original_amount;
  }
  const raw = product.metadata?.compare_at_price;
  if (typeof raw === "number") return raw;
  if (typeof raw === "string" && raw.trim() && !Number.isNaN(Number(raw))) {
    return Number(raw);
  }
  return null;
}

/** Whole-number percent off, or 0 when the product isn't discounted. */
export function percentOff(
  product: MedusaProduct,
  variant: MedusaVariant | null | undefined = product.variants?.[0]
) {
  const now = variant?.calculated_price?.calculated_amount;
  const was = offerCompareAt(product, variant);
  if (now == null || was == null || was <= now) return 0;
  return Math.round(((was - now) / was) * 100);
}
