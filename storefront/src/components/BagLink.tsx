"use client";

import Link from "next/link";
import { useBag } from "../lib/bag";

export function BagLink({ className = "" }: { className?: string }) {
  const { count } = useBag();
  return (
    <Link href="/cart" className={`relative ${className}`}>
      Bag
      {count > 0 && (
        <span className="ml-1 inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-mustard px-1.5 text-[10px] font-bold text-ink">
          {count}
        </span>
      )}
    </Link>
  );
}
