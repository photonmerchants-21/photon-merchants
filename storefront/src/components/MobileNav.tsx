"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../lib/auth";
import { useBag } from "../lib/bag";

type IconName = "home" | "orders" | "bag" | "account";

export function MobileNav() {
  const pathname = usePathname();
  const { count } = useBag();
  const { customer } = useAuth();

  // Checkout owns the bottom of the screen with its own pay bar.
  if (pathname.startsWith("/checkout")) return null;

  const items: {
    href: string;
    label: string;
    icon: IconName;
    badge?: number;
    match: (p: string) => boolean;
  }[] = [
    { href: "/", label: "Home", icon: "home", match: (p) => p === "/" },
    {
      href: "/orders",
      label: "Track",
      icon: "orders",
      match: (p) => p.startsWith("/orders"),
    },
    {
      href: "/cart",
      label: "Bag",
      icon: "bag",
      badge: count,
      match: (p) => p.startsWith("/cart"),
    },
    {
      href: customer ? "/account" : "/account/login",
      label: customer ? "Account" : "Sign in",
      icon: "account",
      match: (p) => p.startsWith("/account"),
    },
  ];

  return (
    <nav
      aria-label="Mobile"
      className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-white/10 bg-ink/95 px-2 pb-[max(0.25rem,env(safe-area-inset-bottom))] pt-1 backdrop-blur md:hidden"
    >
      {items.map((item) => {
        const active = item.match(pathname);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center gap-0.5 rounded-lg py-1.5 text-[11px] transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mustard ${
              active
                ? "font-semibold text-mustard"
                : "text-cream/65 hover:text-mustard"
            }`}
            aria-current={active ? "page" : undefined}
            aria-label={
              item.badge ? `${item.label}, ${item.badge} items` : undefined
            }
          >
            <span className="relative">
              <NavIcon name={item.icon} />
              {item.badge ? (
                <span className="absolute -right-2.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-mustard px-1 text-[10px] font-bold leading-none text-ink">
                  {item.badge > 99 ? "99+" : item.badge}
                </span>
              ) : null}
            </span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function NavIcon({ name }: { name: IconName }) {
  const common = {
    width: 22,
    height: 22,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.75,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  switch (name) {
    case "home":
      return (
        <svg {...common}>
          <path d="M3 10.5 12 3l9 7.5" />
          <path d="M5 9.5V20h14V9.5" />
          <path d="M10 20v-5h4v5" />
        </svg>
      );
    case "orders":
      return (
        <svg {...common}>
          <path d="M3 7h11v9H3z" />
          <path d="M14 10h4l3 3v3h-7" />
          <circle cx="7" cy="18" r="1.75" />
          <circle cx="17" cy="18" r="1.75" />
        </svg>
      );
    case "bag":
      return (
        <svg {...common}>
          <path d="M5 8h14l-1 12H6L5 8Z" />
          <path d="M9 8V6a3 3 0 0 1 6 0v2" />
        </svg>
      );
    case "account":
      return (
        <svg {...common}>
          <circle cx="12" cy="8" r="3.5" />
          <path d="M5 20a7 7 0 0 1 14 0" />
        </svg>
      );
  }
}
