"use client";

import Link from "next/link";
import { useAuth } from "../lib/auth";

export function AccountLink({ className = "" }: { className?: string }) {
  const { ready, customer, displayName } = useAuth();

  if (!ready) {
    return (
      <span className={`text-cream/40 ${className}`} aria-hidden>
        Account
      </span>
    );
  }

  if (customer) {
    return (
      <Link href="/account" className={`hover:text-mustard ${className}`}>
        {displayName?.split(" ")[0] || "Account"}
      </Link>
    );
  }

  return (
    <Link href="/account/login" className={`hover:text-mustard ${className}`}>
      Sign in
    </Link>
  );
}
