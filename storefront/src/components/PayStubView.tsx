"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import {
  PENDING_ORDER_KEY,
  isAwaitingPayment,
  isPaid,
  type PendingOrder,
} from "../lib/checkout";
import { formatKes } from "../lib/money";
import {
  getOrderById,
  loadOrders,
  statusLabel,
  syncLocalFromRemote,
} from "../lib/orders";
import { simulateRemotePayment } from "../lib/photon-orders-api";
import { useAuth } from "../lib/auth";
import { site, whatsappHref } from "../lib/site";

type UiPhase = "ready" | "waiting" | "success" | "failed";

function PayInner() {
  const params = useSearchParams();
  const orderId = params.get("order");
  const [order, setOrder] = useState<PendingOrder | null>(null);
  const [phase, setPhase] = useState<UiPhase>("ready");
  const [error, setError] = useState<string | null>(null);
  const { customer } = useAuth();

  useEffect(() => {
    try {
      const raw = localStorage.getItem(PENDING_ORDER_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as PendingOrder;
        if (!orderId || parsed.id === orderId) {
          setOrder(parsed);
          if (isPaid(parsed.status)) setPhase("success");
          else if (parsed.status === "payment_failed") setPhase("failed");
          return;
        }
      }
      if (orderId) {
        const fromHistory = loadOrders().find((o) => o.id === orderId) ?? null;
        setOrder(fromHistory);
        if (fromHistory) {
          if (isPaid(fromHistory.status)) setPhase("success");
          else if (fromHistory.status === "payment_failed") setPhase("failed");
        }
      }
    } catch {
      setOrder(null);
    }
  }, [orderId]);

  const runSimulate = async (outcome: "success" | "fail") => {
    if (!order) return;
    if (isPaid(order.status)) {
      setPhase("success");
      return;
    }
    setPhase("waiting");
    setError(null);
    try {
      const { order: updated, already_paid } = await simulateRemotePayment(
        order.id,
        outcome,
        order.customer.phone
      );
      syncLocalFromRemote(updated);
      setOrder(updated);
      if (already_paid || isPaid(updated.status)) setPhase("success");
      else if (updated.status === "payment_failed") setPhase("failed");
      else setPhase("ready");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Simulate failed");
      setPhase("ready");
    }
  };

  if (!order) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center md:px-6">
        <h1 className="font-display text-3xl text-cream">No pending payment</h1>
        <p className="mt-3 text-cream/65">
          Start from your bag to create an order summary.
        </p>
        <Link
          href="/cart"
          className="mt-6 inline-block rounded-full bg-mustard px-5 py-3 text-sm font-semibold text-ink"
        >
          Go to bag
        </Link>
      </div>
    );
  }

  if (phase === "success" || isPaid(order.status)) {
    return (
      <div className="mx-auto max-w-xl px-4 py-10 md:px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-mustard">
          Payment confirmed
        </p>
        <h1 className="mt-3 font-display text-4xl text-cream">Thank you</h1>
        <p className="mt-3 text-cream/70">
          We’ve received{" "}
          <span className="text-cream">
            {formatKes(order.total, order.currency)}
          </span>
          {order.paymentSimulated ? " (sandbox)" : ""}. Keep your order number
          handy.
        </p>
        <div className="mt-8 rounded-2xl border border-mustard/30 bg-ink-soft p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm text-cream/60">Order number</p>
              <p className="mt-1 font-display text-3xl tracking-wide text-cream">
                {order.id}
              </p>
            </div>
            <CopyButton value={order.id} />
          </div>
          <div className="mt-4 flex flex-wrap items-baseline justify-between gap-2 border-t border-white/10 pt-4">
            <p className="font-semibold text-mustard first-letter:uppercase">
              {statusLabel(order.status, order.fulfillment)}
            </p>
            {order.paidAt && (
              <p className="text-sm text-cream/55">
                Paid {new Date(order.paidAt).toLocaleString("en-KE")}
              </p>
            )}
          </div>
        </div>
        <div className="mt-4 rounded-2xl border border-white/10 bg-ink-soft p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-mustard">
            What happens next
          </p>
          <p className="mt-2 text-sm leading-relaxed text-cream/75">
            {order.fulfillment === "collection"
              ? `We’ll prepare your items and let you know when they’re ready. Collect from ${site.address} (${site.hours}) — show your order number at the counter.`
              : `We’ll pack your order and our rider will call ${order.customer.phone} before delivery${order.areaLabel ? ` to ${order.areaLabel}` : ""}.`}
          </p>
          <a
            href={`${whatsappHref}?text=${encodeURIComponent(`Hi Photon, about my order ${order.id}`)}`}
            className="mt-3 inline-block text-sm text-mustard hover:underline"
          >
            Questions? WhatsApp {site.whatsappDisplay}
          </a>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href={`/orders?order=${order.id}&phone=${encodeURIComponent(order.customer.phone)}`}
            className="rounded-full bg-mustard px-5 py-3 text-sm font-semibold text-ink"
          >
            Track order
          </Link>
          {customer ? (
            <Link
              href="/account/orders"
              className="rounded-full border border-white/20 px-5 py-3 text-sm text-cream hover:border-mustard/50"
            >
              Order history
            </Link>
          ) : null}
          <Link
            href="/"
            className="rounded-full border border-white/20 px-5 py-3 text-sm text-cream hover:border-mustard/50"
          >
            Continue shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-10 md:px-6">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-mustard">
        Sandbox · simulate M-Pesa
      </p>
      <h1 className="mt-3 font-display text-4xl text-cream">Pay with M-Pesa</h1>
      <p className="mt-3 text-cream/70">
        Order <span className="text-mustard">{order.id}</span>
        {phase === "failed" || order.status === "payment_failed"
          ? " — last attempt failed. Still unpaid."
          : " — unpaid until payment confirms."}
      </p>

      <div className="mt-8 rounded-2xl border border-white/10 bg-ink-soft p-5">
        <p className="text-sm text-cream/60">Amount due</p>
        <p className="mt-1 font-display text-4xl text-mustard">
          {formatKes(order.total, order.currency)}
        </p>
        <dl className="mt-5 space-y-2 border-t border-white/10 pt-4 text-sm text-cream/75">
          <div className="flex justify-between">
            <dt>Subtotal</dt>
            <dd>{formatKes(order.subtotal, order.currency)}</dd>
          </div>
          {(order.discountAmount || 0) > 0 && (
            <div className="flex justify-between text-mustard">
              <dt>Discount{order.discountCode ? ` (${order.discountCode})` : ""}</dt>
              <dd>−{formatKes(order.discountAmount || 0, order.currency)}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt>
              {order.fulfillment === "collection" ? "Collection" : "Delivery"}
            </dt>
            <dd>{formatKes(order.deliveryFee, order.currency)}</dd>
          </div>
          {order.areaLabel && (
            <div className="pt-1 text-cream/55">{order.areaLabel}</div>
          )}
          <div className="flex justify-between pt-2">
            <dt>Customer</dt>
            <dd className="text-right">
              {order.customer.name}
              <br />
              {order.customer.phone}
            </dd>
          </div>
        </dl>

        {error && <p className="mt-4 text-sm text-red-300">{error}</p>}

        {phase === "waiting" ? (
          <button
            type="button"
            disabled
            className="mt-6 w-full rounded-full bg-mustard/40 px-5 py-3 text-sm font-semibold text-ink"
          >
            Waiting for M-Pesa STK…
          </button>
        ) : (
          <div className="mt-6 space-y-3">
            <button
              type="button"
              disabled={!isAwaitingPayment(order.status)}
              onClick={() => void runSimulate("success")}
              className="w-full rounded-full bg-mustard px-5 py-3 text-sm font-semibold text-ink hover:bg-mustard-bright disabled:opacity-50"
            >
              Simulate successful payment
            </button>
            <button
              type="button"
              onClick={() => void runSimulate("fail")}
              className="w-full rounded-full border border-white/20 px-5 py-3 text-sm text-cream/80 hover:border-red-300/50 hover:text-red-200"
            >
              Simulate cancelled / failed
            </button>
          </div>
        )}
      </div>

      <div className="mt-6 flex flex-wrap justify-center gap-4 text-sm">
        <Link href="/" className="text-mustard hover:underline">
          Back to shop
        </Link>
        <button
          type="button"
          onClick={() => {
            const latest = getOrderById(order.id);
            if (latest) {
              setOrder(latest);
              if (isPaid(latest.status)) setPhase("success");
              else if (latest.status === "payment_failed") setPhase("failed");
            }
          }}
          className="text-cream/60 hover:text-mustard"
        >
          Refresh status
        </button>
      </div>
    </div>
  );
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        void navigator.clipboard?.writeText(value).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1600);
        });
      }}
      className="shrink-0 rounded-full border border-white/20 px-3 py-1.5 text-xs text-cream/80 hover:border-mustard/50 hover:text-mustard"
      aria-live="polite"
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

export function PayStubView() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-xl px-4 py-16 text-cream/60">Loading…</div>
      }
    >
      <PayInner />
    </Suspense>
  );
}
