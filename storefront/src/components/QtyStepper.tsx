"use client";

type QtyStepperProps = {
  value: number;
  onChange: (next: number) => void;
  /** Called when quantity would go below 1 (defaults to setting 0 / remove). */
  onRemove?: () => void;
  min?: number;
  max?: number;
  size?: "md" | "lg";
  className?: string;
  "aria-label"?: string;
};

export function QtyStepper({
  value,
  onChange,
  onRemove,
  min = 1,
  max = 99,
  size = "md",
  className = "",
  "aria-label": ariaLabel = "Quantity",
}: QtyStepperProps) {
  const dim =
    size === "lg"
      ? { btn: "h-11 w-11 text-lg", qty: "min-w-[2.75rem] text-base" }
      : { btn: "h-9 w-9 text-base", qty: "min-w-[2.25rem] text-sm" };

  const decrease = () => {
    if (value <= min) {
      if (onRemove) onRemove();
      else onChange(0);
      return;
    }
    onChange(value - 1);
  };

  const increase = () => {
    if (value >= max) return;
    onChange(value + 1);
  };

  return (
    <div
      className={`inline-flex items-center rounded-full border border-mustard/35 bg-ink p-1 ${className}`}
      role="group"
      aria-label={ariaLabel}
    >
      <button
        type="button"
        onClick={decrease}
        aria-label={value <= min ? "Remove from bag" : "Decrease quantity"}
        className={`${dim.btn} flex items-center justify-center rounded-full text-cream transition hover:bg-mustard/15 hover:text-mustard active:scale-95`}
      >
        <MinusIcon />
      </button>
      <span
        className={`${dim.qty} select-none text-center font-semibold tabular-nums text-cream`}
        aria-live="polite"
      >
        {value}
      </span>
      <button
        type="button"
        onClick={increase}
        disabled={value >= max}
        aria-label="Increase quantity"
        className={`${dim.btn} flex items-center justify-center rounded-full bg-mustard text-ink transition hover:bg-mustard-bright active:scale-95 disabled:cursor-not-allowed disabled:opacity-40`}
      >
        <PlusIcon />
      </button>
    </div>
  );
}

function MinusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path
        d="M3 7h8"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path
        d="M7 3v8M3 7h8"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}
