"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AccountShell } from "../../../components/AccountShell";
import { useAuth } from "../../../lib/auth";
import { isAwaitingPayment, isPaid } from "../../../lib/checkout";
import { formatKes } from "../../../lib/money";
import {
  ordersForCustomer,
  statusLabel,
  type SavedOrder,
} from "../../../lib/orders";

export default function AccountOrdersPage() {
  const { customer } = useAuth();
  const [orders, setOrders] = useState<SavedOrder[]>([]);

  useEffect(() => {
    if (!customer) return;
    setOrders(ordersForCustomer(customer.id, customer.email));
  }, [customer]);

  return (
    <AccountShell title="Order history">
      {!orders.length ? (
        <div className="rounded-2xl border border-white/10 bg-ink-soft p-6">
          <p className="text-cream/70">No orders yet for this account.</p>
          <Link
            href="/"
            className="mt-4 inline-block text-sm text-mustard hover:underline"
          >
            Continue shopping
          </Link>
        </div>
      ) : (
        <ul className="space-y-4">
          {orders.map((order) => (
            <li
              key={order.id}
              className="rounded-2xl border border-white/10 bg-ink-soft p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-cream">{order.id}</p>
                  <p className="mt-1 text-sm text-cream/55">
                    {new Date(order.createdAt).toLocaleString("en-KE")} ·{" "}
                    {order.fulfillment === "collection"
                      ? "Collection"
                      : order.areaLabel || "Delivery"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-mustard">
                    {formatKes(order.total, order.currency)}
                  </p>
                  <p className="mt-1 text-xs uppercase tracking-[0.16em] text-cream/45">
                    {statusLabel(order.status, order.fulfillment)}
                  </p>
                </div>
              </div>
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
              <div className="mt-3 flex flex-wrap gap-4 text-sm">
                <Link
                  href={`/orders?order=${encodeURIComponent(order.id)}&phone=${encodeURIComponent(order.customer.phone)}`}
                  className="text-mustard hover:underline"
                >
                  Track
                </Link>
                {isAwaitingPayment(order.status) && (
                  <Link
                    href={`/checkout/pay?order=${order.id}`}
                    className="text-cream/60 hover:text-mustard"
                  >
                    Pay now
                  </Link>
                )}
                {isPaid(order.status) && (
                  <span className="text-cream/40">Paid</span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </AccountShell>
  );
}
