"use client";

import { useSyncExternalStore } from "react";

function subscribe(onTick: () => void) {
  const id = window.setInterval(onTick, 1000);
  return () => window.clearInterval(id);
}

/** Seconds-resolution clock; null during SSR so markup hydrates cleanly. */
function useNowSeconds() {
  return useSyncExternalStore(
    subscribe,
    () => Math.floor(Date.now() / 1000),
    () => null
  );
}

function parts(endsAt: string, nowSec: number) {
  const left = Math.max(0, Math.floor(new Date(endsAt).getTime() / 1000) - nowSec);
  return {
    left,
    days: Math.floor(left / 86400),
    hours: Math.floor((left % 86400) / 3600),
    minutes: Math.floor((left % 3600) / 60),
    seconds: left % 60,
  };
}

const pad = (n: number) => String(n).padStart(2, "0");

/** Inline text, e.g. "6d 08:12:33". */
export function CountdownText({ endsAt }: { endsAt: string }) {
  const now = useNowSeconds();
  if (now == null) return <span className="tabular-nums">--:--:--</span>;
  const t = parts(endsAt, now);
  if (!t.left) return <span>ended</span>;
  return (
    <span className="tabular-nums">
      {t.days > 0 && `${t.days}d `}
      {pad(t.hours)}:{pad(t.minutes)}:{pad(t.seconds)}
    </span>
  );
}

/** Four boxed units for banners. */
export function CountdownBoxes({ endsAt }: { endsAt: string }) {
  const now = useNowSeconds();
  const t = now == null ? null : parts(endsAt, now);
  const units = [
    ["Days", t?.days],
    ["Hrs", t?.hours],
    ["Min", t?.minutes],
    ["Sec", t?.seconds],
  ] as const;
  return (
    <div
      className="flex gap-2"
      role="timer"
      aria-label={
        t ? `${t.days} days ${t.hours} hours ${t.minutes} minutes left` : undefined
      }
    >
      {units.map(([label, value]) => (
        <div
          key={label}
          className="flex w-14 flex-col items-center rounded-xl border border-mustard/30 bg-ink/70 py-2 md:w-16"
        >
          <span className="font-display text-2xl tabular-nums text-mustard md:text-3xl">
            {value == null ? "--" : pad(value)}
          </span>
          <span className="text-[10px] uppercase tracking-[0.18em] text-cream/55">
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}
