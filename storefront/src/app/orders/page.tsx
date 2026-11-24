"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { isPaid, type PendingOrder } from "../../lib/checkout";
import { formatKes } from "../../lib/money";
import {
  findOrderByIdAndPhone,
  getOrderById,
  loadOrders,
  progressStatus,
  type SavedOrder,
  progressSteps,
  statusLabel,
  syncLocalFromRemote,
} from "../../lib/orders";
import {
  createRemoteOrder,
  fetchRemoteOrder,
} from "../../lib/photon-orders-api";
import { MedusaApiError } from "../../lib/medusa-browser";

function normalizeOrderId(id: string) {
  return id.trim().toUpperCase().replace(/\s+/g, "");
}

function TrackInner() {
  const params = useSearchParams();
  const [orderId, setOrderId] = useState(params.get("order") || "");
  const [phone, setPhone] = useState(params.get("phone") || "");
  const [order, setOrder] = useState<PendingOrder | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [searched, setSearched] = useState(false);
  const [source, setSource] = useState<"server" | "device" | null>(null);
  const [recent, setRecent] = useState<SavedOrder[]>([]);

  useEffect(() => {
    setRecent(
      [...loadOrders()]
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, 5)
    );
  }, []);

  const lookup = async (idRaw: string, telRaw: string) => {
    const id = normalizeOrderId(idRaw);
    const tel = telRaw.trim();
    setBusy(true);
    setError(null);
    setSearched(true);
    setOrderId(id);

    try {
      const remote = await fetchRemoteOrder(id, tel);
      syncLocalFromRemote(remote);
      setOrder(remote);
      setSource("server");
      return;
    } catch (err) {
      const message =
        err instanceof MedusaApiError ? err.message : "Order not found";

      // Fall back to orders saved on this browser (pre-sync / offline)
      const local =
        findOrderByIdAndPhone(id, tel) ||
        findOrderByIdAndPhone(idRaw.trim(), tel);

      if (local) {
        setOrder(local);
        setSource("device");
        // Best-effort push so staff desk can see it next time
        try {
          const pushed = await createRemoteOrder(local);
          syncLocalFromRemote(pushed);
          setOrder(pushed);
          setSource("server");
        } catch {
          /* keep device copy */
        }
        return;
      }

      // Helpful: order id exists locally but phone wrong
      const byId = getOrderById(id) || getOrderById(idRaw.trim());
      if (byId) {
        setOrder(null);
        setSource(null);
        setError(
          "That order number is on this device, but the phone does not match. Use the phone from checkout."
        );
        return;
      }

      setOrder(null);
      setSource(null);
      setError(
        message.includes("Phone")
          ? message
          : "No order matched that number and phone. Check both, or track from the same browser you used to checkout."
      );
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    const id = params.get("order");
    const tel = params.get("phone");
    if (id && tel) void lookup(id, tel);
    else if (id && !tel) {
      setOrderId(normalizeOrderId(id));
      const local = getOrderById(normalizeOrderId(id)) || getOrderById(id);
      if (local?.customer.phone) {
        setPhone(local.customer.phone);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onLookup = (e: React.FormEvent) => {
    e.preventDefault();
    void lookup(orderId, phone);
  };

  const steps = order ? progressSteps(order.fulfillment) : [];
  const normalizedStatus = order
    ? progressStatus(order.status, order.fulfillment)
    : null;

  const stepIndex = normalizedStatus
    ? Math.max(0, steps.indexOf(normalizedStatus))
    : -1;

  return (
    <div className="mx-auto max-w-xl px-4 py-10 md:px-6">
      <h1 className="font-display text-4xl text-cream">Track an order</h1>
      <p className="mt-2 text-sm text-cream/60">
        Use the order number (e.g. PM-123456) and the phone from checkout.
      </p>

      <form
        onSubmit={onLookup}
        className="mt-8 space-y-4 rounded-2xl border border-white/10 bg-ink-soft p-5"
      >
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-mustard">
            Order number
          </span>
          <input
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            placeholder="PM-123456"
            autoCapitalize="characters"
            autoComplete="off"
            className="mt-2 w-full rounded-xl border border-white/15 bg-ink px-3 py-2.5 text-sm text-cream outline-none focus:border-mustard/60"
            required
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-mustard">
            Phone
          </span>
          <input
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="07XX XXX XXX"
            className="mt-2 w-full rounded-xl border border-white/15 bg-ink px-3 py-2.5 text-sm text-cream outline-none focus:border-mustard/60"
            required
          />
        </label>
        {error && <p className="text-sm text-red-300">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-full bg-mustard px-5 py-3 text-sm font-semibold text-ink hover:bg-mustard-bright disabled:opacity-60"
        >
          {busy ? "Looking up…" : "Look up"}
        </button>
      </form>

      {recent.length > 0 && !(searched && order) && (
        <div className="mt-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-mustard">
            Recent on this device
          </p>
          <ul className="mt-3 divide-y divide-white/10 rounded-2xl border border-white/10 bg-ink-soft">
            {recent.map((o) => (
              <li key={o.id}>
                <button
                  type="button"
                  onClick={() => {
                    setPhone(o.customer.phone);
                    void lookup(o.id, o.customer.phone);
                  }}
                  className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm transition hover:bg-white/5"
                >
                  <span>
                    <span className="block font-semibold text-cream">{o.id}</span>
                    <span className="block text-xs text-cream/55 first-letter:uppercase">
                      {new Date(o.createdAt).toLocaleDateString("en-KE", {
                        day: "numeric",
                        month: "short",
                      })}{" "}
                      · {statusLabel(o.status, o.fulfillment)}
                    </span>
                  </span>
                  <span className="shrink-0 text-cream/80">
                    {formatKes(o.total, o.currency)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {searched && order && (
        <div className="mt-6 space-y-4">
          <div className="rounded-2xl border border-white/10 bg-ink-soft p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-cream">{order.id}</p>
                <p className="mt-1 text-sm first-letter:uppercase text-mustard">
                  {statusLabel(order.status, order.fulfillment)}
                </p>
              </div>
              <p className="text-cream">
                {formatKes(order.total, order.currency)}
              </p>
            </div>
            <p className="mt-3 text-sm text-cream/60">
              {order.fulfillment === "collection"
                ? "Collection"
                : order.areaLabel || "Delivery"}{" "}
              · {order.customer.name}
            </p>
            {(order.discountAmount || 0) > 0 && (
              <p className="mt-2 text-sm text-mustard">
                Discount{order.discountCode ? ` ${order.discountCode}` : ""}: −
                {formatKes(order.discountAmount || 0, order.currency)}
              </p>
            )}
            {source === "device" && (
              <p className="mt-2 text-xs text-cream/45">
                Showing a copy saved on this browser. Staff updates appear after
                the order is synced to the server.
              </p>
            )}
            {(order.eta || order.dispatchNote) && (
              <div className="mt-4 rounded-xl border border-mustard/25 bg-ink px-3 py-3 text-sm text-cream/75">
                {order.eta && (
                  <p>
                    <span className="text-mustard">ETA:</span> {order.eta}
                  </p>
                )}
                {order.dispatchNote && (
                  <p className={order.eta ? "mt-1" : ""}>
                    <span className="text-mustard">Note:</span>{" "}
                    {order.dispatchNote}
                  </p>
                )}
              </div>
            )}
            <ul className="mt-4 space-y-1 border-t border-white/10 pt-3 text-sm text-cream/75">
              {order.lines.map((line, i) => (
                <li key={`${order.id}-${i}`}>
                  {line.title}
                  {line.variantTitle !== "Default"
                    ? ` · ${line.variantTitle}`
                    : ""}{" "}
                  × {line.quantity}
                </li>
              ))}
            </ul>
            {!isPaid(order.status) && (
              <Link
                href={`/checkout/pay?order=${order.id}`}
                className="mt-4 inline-block text-sm text-mustard hover:underline"
              >
                Complete payment
              </Link>
            )}
          </div>

          <div className="rounded-2xl border border-white/10 bg-ink-soft p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-mustard">
              Progress
            </p>
            <ol className="mt-4 space-y-3">
              {steps.map((step, i) => {
                const done =
                  stepIndex >= i && order.status !== "payment_failed";
                const current = normalizedStatus === step;
                return (
                  <li key={step} className="flex items-center gap-3 text-sm">
                    <span
                      className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                        done
                          ? "bg-mustard text-ink"
                          : "border border-white/20 text-cream/40"
                      }`}
                    >
                      {i + 1}
                    </span>
                    <span
                      className={
                        current
                          ? "font-semibold first-letter:uppercase text-cream"
                          : done
                            ? "first-letter:uppercase text-cream/80"
                            : "first-letter:uppercase text-cream/40"
                      }
                    >
                      {statusLabel(step, order.fulfillment)}
                    </span>
                  </li>
                );
              })}
            </ol>
            {order.statusHistory && order.statusHistory.length > 0 && (
              <ul className="mt-5 space-y-2 border-t border-white/10 pt-4 text-xs text-cream/50">
                {[...order.statusHistory].reverse().map((event, i) => (
                  <li key={`${event.at}-${i}`} className="first-letter:uppercase">
                    {statusLabel(event.status, order.fulfillment)} ·{" "}
                    {new Date(event.at).toLocaleString("en-KE")}
                    {event.note ? ` — ${event.note}` : ""}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-xl px-4 py-10 text-cream/60">Loading…</div>
      }
    >
      <TrackInner />
    </Suspense>
  );
}
