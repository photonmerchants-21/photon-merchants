"use client";

import Link from "next/link";
import { AccountShell } from "../../components/AccountShell";
import { useAuth } from "../../lib/auth";
import { ordersForCustomer } from "../../lib/orders";
import { useEffect, useState } from "react";

export default function AccountPage() {
  const { customer, addresses } = useAuth();
  const [orderCount, setOrderCount] = useState(0);

  useEffect(() => {
    if (!customer) return;
    setOrderCount(ordersForCustomer(customer.id, customer.email).length);
  }, [customer]);

  return (
    <AccountShell title="Overview">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card
          label="Orders"
          value={String(orderCount)}
          href="/account/orders"
          cta="View history"
        />
        <Card
          label="Addresses"
          value={String(addresses.length)}
          href="/account/addresses"
          cta="Manage"
        />
        <Card
          label="Checkout"
          value="Guest OK"
          href="/checkout"
          cta="Go to checkout"
        />
      </div>
      <p className="mt-6 text-sm text-cream/60">
        Email: {customer?.email}
        {customer?.phone ? ` · ${customer.phone}` : ""}
      </p>
    </AccountShell>
  );
}

function Card({
  label,
  value,
  href,
  cta,
}: {
  label: string;
  value: string;
  href: string;
  cta: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-ink-soft p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-mustard">
        {label}
      </p>
      <p className="mt-3 font-display text-3xl text-cream">{value}</p>
      <Link href={href} className="mt-4 inline-block text-sm text-mustard hover:underline">
        {cta}
      </Link>
    </div>
  );
}
