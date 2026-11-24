"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useAuth } from "../lib/auth";

const links: { href: string; label: string; exact?: boolean }[] = [
  { href: "/account", label: "Overview", exact: true },
  { href: "/account/orders", label: "Orders" },
  { href: "/account/addresses", label: "Addresses" },
];

export function AccountShell({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const { ready, customer, displayName, logout } = useAuth();

  if (!ready) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
        <h1 className="font-display text-4xl text-cream">{title}</h1>
        <p className="mt-3 text-cream/60">Loading account…</p>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center md:px-6">
        <h1 className="font-display text-4xl text-cream">Sign in required</h1>
        <p className="mt-3 text-cream/65">
          Create an account or sign in to manage orders and addresses. Guest
          checkout still works without an account.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/account/login"
            className="rounded-full bg-mustard px-5 py-3 text-sm font-semibold text-ink"
          >
            Sign in
          </Link>
          <Link
            href="/account/register"
            className="rounded-full border border-white/20 px-5 py-3 text-sm text-cream hover:border-mustard/50"
          >
            Create account
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-cream/50">Account</p>
          <h1 className="mt-1 font-display text-4xl text-cream">{title}</h1>
          <p className="mt-2 text-sm text-cream/60">
            Signed in as {displayName}
          </p>
        </div>
        <button
          type="button"
          onClick={logout}
          className="rounded-full border border-white/20 px-4 py-2 text-sm text-cream/80 hover:border-mustard/50 hover:text-mustard"
        >
          Sign out
        </button>
      </div>

      <nav className="mt-6 flex flex-wrap gap-2 border-b border-white/10 pb-4">
        {links.map((link) => {
          const active = link.exact
            ? pathname === link.href
            : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-full px-4 py-2 text-sm ${
                active
                  ? "bg-mustard text-ink"
                  : "border border-white/15 text-cream/75 hover:border-mustard/40"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-8">{children}</div>
    </div>
  );
}
