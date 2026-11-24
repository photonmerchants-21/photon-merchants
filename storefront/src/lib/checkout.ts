export type FulfillmentMethod = "delivery" | "collection";

export type CheckoutDraft = {
  name: string;
  phone: string;
  email: string;
  method: FulfillmentMethod;
  areaId: string | null;
};

export const CHECKOUT_STORAGE_KEY = "photon-checkout-v1";

export const emptyCheckout = (): CheckoutDraft => ({
  name: "",
  phone: "",
  email: "",
  method: "delivery",
  areaId: null,
});

export function loadCheckout(): CheckoutDraft {
  if (typeof window === "undefined") return emptyCheckout();
  try {
    const raw = localStorage.getItem(CHECKOUT_STORAGE_KEY);
    if (!raw) return emptyCheckout();
    const parsed = JSON.parse(raw) as Partial<CheckoutDraft>;
    return {
      ...emptyCheckout(),
      ...parsed,
      method: parsed.method === "collection" ? "collection" : "delivery",
    };
  } catch {
    return emptyCheckout();
  }
}

export function saveCheckout(draft: CheckoutDraft) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CHECKOUT_STORAGE_KEY, JSON.stringify(draft));
}

export function validateCheckout(draft: CheckoutDraft) {
  const errors: Partial<Record<keyof CheckoutDraft, string>> = {};
  if (!draft.name.trim()) errors.name = "Name is required";
  if (!draft.phone.trim()) errors.phone = "Phone is required";
  else {
    const digits = draft.phone.replace(/\D/g, "");
    const ok =
      /^(?:254|0)?[17]\d{8}$/.test(digits) ||
      /^254[17]\d{8}$/.test(digits);
    if (!ok) errors.phone = "Use a valid Kenyan mobile (e.g. 07XX XXX XXX)";
  }
  if (!draft.email.trim()) errors.email = "Email is required";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email)) {
    errors.email = "Enter a valid email";
  }
  if (draft.method === "delivery" && !draft.areaId) {
    errors.areaId = "Choose a delivery area";
  }
  return errors;
}

/** Aligns with Phase 6 status model (+ legacy awaiting_mpesa). */
export type OrderStatus =
  | "placed"
  | "awaiting_mpesa"
  | "payment_failed"
  | "paid"
  | "processing"
  | "packed"
  | "dispatched"
  | "out_for_delivery"
  | "delivered"
  | "cancelled"
  | "returned";

export type StatusEvent = {
  status: OrderStatus;
  at: string;
  note?: string | null;
};

export type PendingOrder = {
  id: string;
  createdAt: string;
  customerId: string | null;
  customer: CheckoutDraft;
  lines: {
    title: string;
    variantTitle: string;
    quantity: number;
    unitPrice: number;
    currency: string;
    variantId?: string | null;
    productId?: string | null;
  }[];
  subtotal: number;
  deliveryFee: number;
  discountCode?: string | null;
  discountAmount?: number;
  total: number;
  currency: string;
  fulfillment: FulfillmentMethod;
  areaLabel: string | null;
  status: OrderStatus;
  paidAt?: string | null;
  paymentSimulated?: boolean;
  stockDecremented?: boolean;
  eta?: string | null;
  dispatchNote?: string | null;
  statusHistory?: StatusEvent[];
};

export const PENDING_ORDER_KEY = "photon-pending-order-v1";

export function isAwaitingPayment(status: OrderStatus) {
  return (
    status === "placed" ||
    status === "awaiting_mpesa" ||
    status === "payment_failed"
  );
}

export function isPaid(status: OrderStatus) {
  return (
    status === "paid" ||
    status === "processing" ||
    status === "packed" ||
    status === "dispatched" ||
    status === "out_for_delivery" ||
    status === "delivered"
  );
}
