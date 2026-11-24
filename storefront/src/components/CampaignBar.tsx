"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CountdownText } from "./Countdown";

export function CampaignBar({
  name,
  endsAt,
}: {
  name: string;
  endsAt: string | null;
}) {
  const pathname = usePathname();
  if (pathname.startsWith("/checkout")) return null;

  return (
    <Link
      href="/deals"
      className="group block bg-mustard text-ink focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ink"
    >
      <div className="mx-auto flex max-w-6xl items-center justify-center gap-x-3 px-4 py-2 text-[13px] font-semibold md:px-6 md:text-sm">
        <span className="uppercase tracking-[0.14em]">{name}</span>
        {endsAt && (
          <span className="font-medium text-ink/75">
            Ends in <CountdownText endsAt={endsAt} />
          </span>
        )}
        <span className="underline decoration-ink/40 underline-offset-2 group-hover:decoration-ink">
          Shop deals
        </span>
      </div>
    </Link>
  );
}
