import {
  PENDING_ORDER_KEY,
  type OrderStatus,
  type PendingOrder,
} from "./checkout";

export const ORDERS_STORAGE_KEY = "photon-orders-v1";

export type SavedOrder = PendingOrder & {
  customerId: string | null;
};

export function loadOrders(): SavedOrder[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(ORDERS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as SavedOrder[]) : [];
  } catch {
    return [];
  }
}

export function saveOrderHistory(order: SavedOrder) {
  if (typeof window === "undefined") return;
  const prev = loadOrders().filter((o) => o.id !== order.id);
  localStorage.setItem(
    ORDERS_STORAGE_KEY,
    JSON.stringify([order, ...prev].slice(0, 50))
  );
}

export function getOrderById(orderId: string): SavedOrder | null {
  const needle = orderId.trim().toUpperCase();
  return (
    loadOrders().find((o) => o.id.toUpperCase() === needle) ??
    loadOrders().find((o) => o.id === orderId.trim()) ??
    null
  );
}

export function findOrderByIdAndPhone(orderId: string, phone: string) {
  const digits = phone.replace(/\D/g, "");
  const order = getOrderById(orderId);
  if (!order) return null;
  const orderDigits = order.customer.phone.replace(/\D/g, "");
  const tail = (s: string) => s.slice(-9);
  if (!digits || tail(orderDigits) !== tail(digits)) return null;
  return order;
}

export function updateOrder(
  orderId: string,
  patch: Partial<SavedOrder>
): SavedOrder | null {
  const existing = getOrderById(orderId);
  if (!existing) return null;
  const next: SavedOrder = { ...existing, ...patch, id: existing.id };
  saveOrderHistory(next);

  try {
    const raw = localStorage.getItem(PENDING_ORDER_KEY);
    if (raw) {
      const pending = JSON.parse(raw) as PendingOrder;
      if (pending.id === orderId) {
        localStorage.setItem(PENDING_ORDER_KEY, JSON.stringify(next));
      }
    }
  } catch {
    /* ignore */
  }

  return next;
}

export function syncLocalFromRemote(order: PendingOrder) {
  saveOrderHistory({ ...order, customerId: order.customerId ?? null });
  try {
    const raw = localStorage.getItem(PENDING_ORDER_KEY);
    if (raw) {
      const pending = JSON.parse(raw) as PendingOrder;
      if (pending.id === order.id) {
        localStorage.setItem(PENDING_ORDER_KEY, JSON.stringify(order));
      }
    } else {
      localStorage.setItem(PENDING_ORDER_KEY, JSON.stringify(order));
    }
  } catch {
    /* ignore */
  }
}

export function ordersForCustomer(customerId: string, email?: string | null) {
  const emailLc = email?.trim().toLowerCase() || null;
  return loadOrders().filter(
    (o) =>
      o.customerId === customerId ||
      (emailLc && o.customer.email.trim().toLowerCase() === emailLc)
  );
}

export type FulfillmentKind = "delivery" | "collection";

/** Customer-facing progress steps — collection skips rider/delivery stages. */
export function progressSteps(fulfillment: FulfillmentKind): OrderStatus[] {
  if (fulfillment === "collection") {
    return ["placed", "paid", "processing", "packed", "delivered"];
  }
  return [
    "placed",
    "paid",
    "processing",
    "packed",
    "dispatched",
    "out_for_delivery",
    "delivered",
  ];
}

/** Map a raw status onto the progress ladder for this fulfillment type. */
export function progressStatus(
  status: OrderStatus,
  fulfillment: FulfillmentKind
): OrderStatus {
  if (status === "awaiting_mpesa" || status === "payment_failed") {
    return "placed";
  }
  if (fulfillment === "collection") {
    // Delivery-only stages still mean “waiting at the shop”
    if (status === "dispatched" || status === "out_for_delivery") {
      return "packed";
    }
  }
  return status;
}

export function statusLabel(
  status: OrderStatus,
  fulfillment: FulfillmentKind = "delivery"
) {
  if (status === "awaiting_mpesa") return "placed";
  if (fulfillment === "collection") {
    if (status === "packed" || status === "dispatched" || status === "out_for_delivery") {
      return "ready for collection";
    }
    if (status === "delivered") return "collected";
  }
  return status.replace(/_/g, " ");
}
