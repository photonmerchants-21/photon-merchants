"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../lib/auth";
import { useBag } from "../lib/bag";
import {
  emptyCheckout,
  loadCheckout,
  saveCheckout,
  validateCheckout,
  type CheckoutDraft,
  type PendingOrder,
  PENDING_ORDER_KEY,
} from "../lib/checkout";
import {
  corridors,
  deliveryFee,
  getDeliveryArea,
} from "../lib/delivery";
import { formatKes } from "../lib/money";
import { saveOrderHistory } from "../lib/orders";
import { validateDiscountCode } from "../lib/photon-discounts-api";
import { createRemoteOrder } from "../lib/photon-orders-api";
import { site, whatsappHref } from "../lib/site";

export function CheckoutView() {
  const router = useRouter();
  const { lines, count, subtotal, currency, ready, clear } = useBag();
  const { ready: authReady, customer, addresses, createAddress } = useAuth();
  const [draft, setDraft] = useState<CheckoutDraft>(emptyCheckout);
  const [errors, setErrors] = useState<Partial<Record<keyof CheckoutDraft, string>>>(
    {}
  );
  const [submitting, setSubmitting] = useState(false);
  const [saveAddress, setSaveAddress] = useState(false);
  const [prefilled, setPrefilled] = useState(false);
  const [promoInput, setPromoInput] = useState("");
  const [promoBusy, setPromoBusy] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [appliedCode, setAppliedCode] = useState<string | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [draftLoaded, setDraftLoaded] = useState(false);
  useEffect(() => {
    setDraft(loadCheckout());
    setDraftLoaded(true);
  }, []);

  useEffect(() => {
    if (!authReady || !customer || prefilled) return;
    setDraft((prev) => {
      const name =
        prev.name.trim() ||
        [customer.first_name, customer.last_name].filter(Boolean).join(" ").trim();
      return {
        ...prev,
        name: name || prev.name,
        email: prev.email.trim() || customer.email || "",
        phone: prev.phone.trim() || customer.phone || "",
      };
    });
    setPrefilled(true);
  }, [authReady, customer, prefilled]);

  useEffect(() => {
    if (draftLoaded) saveCheckout(draft);
  }, [draft, draftLoaded]);

  const fee = deliveryFee(draft.method, draft.areaId);
  const total = Math.max(0, subtotal - discountAmount + fee);
  const area = getDeliveryArea(draft.areaId);
  const corridorGroups = useMemo(() => corridors(), []);
  const [areaQuery, setAreaQuery] = useState("");
  const filteredGroups = useMemo(() => {
    const q = areaQuery.trim().toLowerCase();
    if (!q) return corridorGroups;
    return corridorGroups
      .map(
        ([corridor, items]) =>
          [
            corridor,
            items.filter(
              (item) =>
                item.id === draft.areaId ||
                item.area.toLowerCase().includes(q) ||
                corridor.toLowerCase().includes(q)
            ),
          ] as typeof corridorGroups[number]
      )
      .filter(([, items]) => items.length > 0);
  }, [corridorGroups, areaQuery, draft.areaId]);
  const filteredAreaCount = filteredGroups.reduce(
    (n, [, items]) => n + items.length,
    0
  );

  useEffect(() => {
    // Re-validate when bag subtotal changes after a code was applied
    if (!appliedCode) return;
    let cancelled = false;
    void (async () => {
      const result = await validateDiscountCode(appliedCode, subtotal);
      if (cancelled) return;
      if (!result.valid) {
        setAppliedCode(null);
        setDiscountAmount(0);
        setPromoError(result.message || "Code no longer valid");
        return;
      }
      setDiscountAmount(result.amount_off || 0);
    })();
    return () => {
      cancelled = true;
    };
  }, [subtotal, appliedCode]);

  const applyPromo = async () => {
    setPromoError(null);
    const code = promoInput.trim();
    if (!code) {
      setPromoError("Enter a code");
      return;
    }
    setPromoBusy(true);
    try {
      const result = await validateDiscountCode(code, subtotal);
      if (!result.valid || !result.code) {
        setAppliedCode(null);
        setDiscountAmount(0);
        setPromoError(result.message || "That code is not valid");
        return;
      }
      setAppliedCode(result.code);
      setDiscountAmount(result.amount_off || 0);
      setPromoInput(result.code);
    } finally {
      setPromoBusy(false);
    }
  };

  const clearPromo = () => {
    setAppliedCode(null);
    setDiscountAmount(0);
    setPromoInput("");
    setPromoError(null);
  };

  const update = <K extends keyof CheckoutDraft>(key: K, value: CheckoutDraft[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const applySavedAddress = (addressId: string) => {
    const addr = addresses.find((a) => a.id === addressId);
    if (!addr) return;
    const areaId =
      typeof addr.metadata?.area_id === "string" ? addr.metadata.area_id : null;
    const name = [addr.first_name, addr.last_name].filter(Boolean).join(" ").trim();
    setDraft((prev) => ({
      ...prev,
      method: "delivery",
      areaId,
      name: name || prev.name,
      phone: addr.phone || prev.phone,
    }));
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const nextErrors = validateCheckout(draft);
    setErrors(nextErrors);
    const firstInvalid = (["name", "phone", "email", "areaId"] as const).find(
      (key) => nextErrors[key]
    );
    if (firstInvalid) {
      const el = e.currentTarget.querySelector<HTMLElement>(
        `[name="${firstInvalid}"]`
      );
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      el?.focus({ preventScroll: true });
      return;
    }
    if (!lines.length) return;

    setSubmitting(true);
    setSubmitError(null);
    try {
      if (customer && saveAddress && draft.method === "delivery" && draft.areaId && area) {
        const already = addresses.some(
          (a) => a.metadata?.area_id === draft.areaId
        );
        if (!already) {
          await createAddress({
            address_name: area.area,
            first_name: customer.first_name || draft.name.split(" ")[0] || "Customer",
            last_name:
              customer.last_name ||
              draft.name.split(" ").slice(1).join(" ") ||
              "Photon",
            phone: draft.phone,
            address_1: area.area,
            city: "Nairobi",
            province: area.corridor,
            country_code: "ke",
            postal_code: "00100",
            metadata: {
              area_id: area.id,
              method: "delivery",
              fee: area.fee,
            },
          });
        }
      }

      const order: PendingOrder = {
        id: `PM-${Date.now().toString().slice(-6)}`,
        createdAt: new Date().toISOString(),
        customerId: customer?.id ?? null,
        customer: draft,
        lines: lines.map((l) => ({
          title: l.title,
          variantTitle: l.variantTitle,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          currency: l.currency,
          variantId: l.variantId,
          productId: l.productId,
        })),
        subtotal,
        deliveryFee: fee,
        discountCode: appliedCode,
        discountAmount,
        total,
        currency,
        fulfillment: draft.method,
        areaLabel:
          draft.method === "collection"
            ? `Collect at ${site.address}`
            : area
              ? `${area.area} (${area.corridor})`
              : null,
        status: "placed",
        statusHistory: [
          { status: "placed", at: new Date().toISOString() },
        ],
      };
      const remote = await createRemoteOrder(order);
      const saved = { ...order, ...remote, customerId: customer?.id ?? null };
      localStorage.setItem(PENDING_ORDER_KEY, JSON.stringify(saved));
      saveOrderHistory(saved);
      clear();
      router.push(`/checkout/pay?order=${saved.id}`);
    } catch {
      setSubmitting(false);
      setSubmitError("Could not prepare checkout. Check your connection and try again.");
    }
  };

  if (!ready) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
        <h1 className="font-display text-4xl text-cream">Checkout</h1>
        <p className="mt-3 text-cream/60">Loading…</p>
      </div>
    );
  }

  if (!count) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
        <h1 className="font-display text-4xl text-cream">Checkout</h1>
        <p className="mt-3 text-cream/65">Your bag is empty.</p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-full bg-mustard px-5 py-3 text-sm font-semibold text-ink"
        >
          Continue shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 pb-28 md:px-6 lg:pb-10">
      <p className="text-sm text-cream/50">
        <Link href="/cart" className="hover:text-mustard">
          Bag
        </Link>{" "}
        / Checkout
      </p>
      <h1 className="mt-3 font-display text-4xl text-cream">Checkout</h1>
      <p className="mt-2 text-sm text-cream/60">
        {customer
          ? `Signed in as ${customer.email} · guest fields still work`
          : "Guest checkout · "}
        {!customer && (
          <>
            <Link href="/account/login" className="text-mustard hover:underline">
              sign in
            </Link>{" "}
            to reuse addresses
          </>
        )}
      </p>

      <form
        onSubmit={(e) => void onSubmit(e)}
        className="mt-8 grid gap-8 lg:grid-cols-[1fr_340px]"
      >
        <div className="space-y-8">
          <section className="rounded-2xl border border-white/10 bg-ink-soft p-5">
            <h2 className="font-display text-2xl text-cream">Your details</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field
                label="Full name"
                error={errors.name}
                className="sm:col-span-2"
              >
                <input
                  name="name"
                  value={draft.name}
                  onChange={(e) => update("name", e.target.value)}
                  className={inputClass}
                  autoComplete="name"
                  placeholder="Jane Wanjiku"
                  aria-invalid={Boolean(errors.name)}
                />
              </Field>
              <Field
                label="M-Pesa phone"
                error={errors.phone}
                hint="We send the M-Pesa prompt to this number."
              >
                <input
                  name="phone"
                  type="tel"
                  inputMode="tel"
                  value={draft.phone}
                  onChange={(e) => update("phone", e.target.value)}
                  className={inputClass}
                  autoComplete="tel"
                  placeholder="07XX XXX XXX"
                  aria-invalid={Boolean(errors.phone)}
                />
              </Field>
              <Field
                label="Email"
                error={errors.email}
                hint="For your receipt and order updates."
              >
                <input
                  name="email"
                  type="email"
                  inputMode="email"
                  aria-invalid={Boolean(errors.email)}
                  value={draft.email}
                  onChange={(e) => update("email", e.target.value)}
                  className={inputClass}
                  autoComplete="email"
                  placeholder="you@email.com"
                />
              </Field>
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-ink-soft p-5">
            <h2 className="font-display text-2xl text-cream">Fulfillment</h2>

            {customer && addresses.length > 0 && (
              <div className="mt-4">
                <label className="text-xs font-semibold uppercase tracking-[0.18em] text-mustard">
                  Saved addresses
                </label>
                <select
                  defaultValue=""
                  onChange={(e) => {
                    if (e.target.value) applySavedAddress(e.target.value);
                  }}
                  className={`${inputClass} mt-2`}
                >
                  <option value="">Choose a saved address…</option>
                  {addresses.map((addr) => (
                    <option key={addr.id} value={addr.id}>
                      {addr.address_name || addr.address_1 || "Address"}
                      {addr.province ? ` · ${addr.province}` : ""}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {(
                [
                  ["delivery", "Delivery", "Fee by Nairobi area"],
                  ["collection", "Collect at OTC", "Fee KES 0"],
                ] as const
              ).map(([value, label, hint]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() =>
                    setDraft((prev) => ({
                      ...prev,
                      method: value,
                      areaId: value === "collection" ? null : prev.areaId,
                    }))
                  }
                  className={`rounded-2xl border px-4 py-4 text-left transition ${
                    draft.method === value
                      ? "border-mustard bg-mustard/10"
                      : "border-white/15 hover:border-mustard/40"
                  }`}
                >
                  <p className="font-semibold text-cream">{label}</p>
                  <p className="mt-1 text-sm text-cream/55">{hint}</p>
                </button>
              ))}
            </div>

            {draft.method === "delivery" && (
              <div className="mt-5">
                <label
                  htmlFor="checkout-area"
                  className="text-xs font-semibold uppercase tracking-[0.18em] text-mustard"
                >
                  Delivery area
                </label>
                <input
                  type="search"
                  value={areaQuery}
                  onChange={(e) => setAreaQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key !== "Enter") return;
                    e.preventDefault();
                    const only = filteredGroups.flatMap(([, items]) => items);
                    if (only.length === 1) update("areaId", only[0].id);
                  }}
                  placeholder="Type your area, e.g. Kilimani"
                  aria-label="Filter delivery areas"
                  className={`${inputClass} mt-2`}
                />
                <select
                  id="checkout-area"
                  name="areaId"
                  value={draft.areaId ?? ""}
                  onChange={(e) => update("areaId", e.target.value || null)}
                  className={`${inputClass} mt-2`}
                  aria-invalid={Boolean(errors.areaId)}
                >
                  <option value="">
                    {areaQuery.trim()
                      ? `${filteredAreaCount} match${filteredAreaCount === 1 ? "" : "es"} — select…`
                      : "Select area…"}
                  </option>
                  {filteredGroups.map(([corridor, items]) => (
                    <optgroup key={corridor} label={corridor}>
                      {items.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.area} — KES {item.fee.toLocaleString("en-KE")}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                {areaQuery.trim() && filteredAreaCount === 0 && (
                  <p className="mt-2 text-sm text-cream/60">
                    No area matches “{areaQuery.trim()}”. Pick the nearest one,
                    or{" "}
                    <a
                      href={`${whatsappHref}?text=${encodeURIComponent(`Hi Photon, do you deliver to ${areaQuery.trim()}?`)}`}
                      className="text-mustard hover:underline"
                    >
                      ask us on WhatsApp
                    </a>
                    .
                  </p>
                )}
                {errors.areaId && (
                  <p className="mt-1 text-sm text-red-300">{errors.areaId}</p>
                )}
                {area && (
                  <p className="mt-2 text-sm text-cream/60">
                    Delivery to {area.area}:{" "}
                    <span className="text-mustard">
                      {formatKes(area.fee, currency)}
                    </span>
                  </p>
                )}
                {customer && (
                  <label className="mt-4 flex items-center gap-2 text-sm text-cream/70">
                    <input
                      type="checkbox"
                      checked={saveAddress}
                      onChange={(e) => setSaveAddress(e.target.checked)}
                      className="rounded border-white/30"
                    />
                    Save this area to my account
                  </label>
                )}
              </div>
            )}

            {draft.method === "collection" && (
              <p className="mt-4 text-sm text-cream/65">
                Collect from {site.address}. {site.hours}. Bring your order
                number.
              </p>
            )}
          </section>
        </div>

        <aside className="h-fit rounded-2xl border border-white/10 bg-ink-soft p-5">
          <h2 className="font-display text-2xl text-cream">Order summary</h2>
          <ul className="mt-4 space-y-3 border-b border-white/10 pb-4">
            {lines.map((line) => (
              <li key={line.variantId} className="flex justify-between gap-3 text-sm">
                <span className="text-cream/80">
                  {line.title}
                  {line.variantTitle !== "Default" ? ` · ${line.variantTitle}` : ""}{" "}
                  × {line.quantity}
                </span>
                <span className="shrink-0 text-cream">
                  {formatKes(line.unitPrice * line.quantity, currency)}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-4 border-b border-white/10 pb-4">
            <label className="text-xs font-semibold uppercase tracking-[0.18em] text-mustard">
              Discount code
            </label>
            <div className="mt-2 flex gap-2">
              <input
                value={promoInput}
                onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                onKeyDown={(e) => {
                  if (e.key !== "Enter") return;
                  e.preventDefault();
                  if (!appliedCode) void applyPromo();
                }}
                placeholder="Enter code"
                aria-label="Discount code"
                autoCapitalize="characters"
                autoComplete="off"
                disabled={Boolean(appliedCode)}
                className={`${inputClass} flex-1`}
              />
              {appliedCode ? (
                <button
                  type="button"
                  onClick={clearPromo}
                  className="rounded-full border border-white/20 px-4 text-sm text-cream/80 hover:border-mustard/50"
                >
                  Remove
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => void applyPromo()}
                  disabled={promoBusy}
                  className="rounded-full bg-mustard/90 px-4 text-sm font-semibold text-ink hover:bg-mustard disabled:opacity-60"
                >
                  {promoBusy ? "…" : "Apply"}
                </button>
              )}
            </div>
            {promoError && (
              <p className="mt-2 text-sm text-red-300">{promoError}</p>
            )}
            {appliedCode && !promoError && (
              <p className="mt-2 text-sm text-mustard">
                {appliedCode} applied
              </p>
            )}
          </div>

          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between text-cream/70">
              <dt>Subtotal</dt>
              <dd>{formatKes(subtotal, currency)}</dd>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-mustard">
                <dt>Discount</dt>
                <dd>−{formatKes(discountAmount, currency)}</dd>
              </div>
            )}
            <div className="flex justify-between text-cream/70">
              <dt>
                {draft.method === "collection" ? "Collection" : "Delivery"}
              </dt>
              <dd>{formatKes(fee, currency)}</dd>
            </div>
            <div className="flex justify-between border-t border-white/10 pt-3 text-base font-semibold text-cream">
              <dt>Total</dt>
              <dd className="text-mustard">{formatKes(total, currency)}</dd>
            </div>
          </dl>

          {submitError && (
            <p className="mt-4 text-sm text-red-300" role="alert">
              {submitError}
            </p>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="mt-6 hidden w-full rounded-full bg-mustard px-5 py-3 text-sm font-semibold text-ink hover:bg-mustard-bright disabled:opacity-60 lg:block"
          >
            {submitting ? "Preparing…" : "Continue to payment"}
          </button>
          <p className="mt-3 hidden text-center text-xs text-cream/45 lg:block">
            Next, approve the M-Pesa prompt on your phone.
          </p>
        </aside>

        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-ink/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur lg:hidden">
          <div className="mx-auto flex max-w-6xl items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs text-cream/55">Total</p>
              <p className="font-semibold text-mustard">
                {formatKes(total, currency)}
              </p>
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="shrink-0 rounded-full bg-mustard px-5 py-2.5 text-sm font-semibold text-ink disabled:opacity-60"
            >
              {submitting ? "Preparing…" : "Continue to payment"}
            </button>
          </div>
          {submitError && (
            <p className="mx-auto mt-2 max-w-6xl text-xs text-red-300" role="alert">
              {submitError}
            </p>
          )}
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  error,
  hint,
  children,
  className = "",
}: {
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-mustard">
        {label}
      </span>
      <div className="mt-2">{children}</div>
      {error ? (
        <p className="mt-1 text-sm text-red-300">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-xs text-cream/45">{hint}</p>
      ) : null}
    </label>
  );
}

const inputClass =
  "w-full rounded-xl border border-white/15 bg-ink px-3 py-2.5 text-sm text-cream outline-none placeholder:text-cream/35 focus:border-mustard/60";
