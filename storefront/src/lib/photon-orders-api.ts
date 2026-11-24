import { medusaBrowserFetch } from "./medusa-browser";
import type { PendingOrder } from "./checkout";

export async function createRemoteOrder(order: PendingOrder) {
  const data = await medusaBrowserFetch<{ order: PendingOrder }>({
    path: "/store/photon-orders",
    method: "POST",
    body: {
      ...order,
      status: order.status === "awaiting_mpesa" ? "placed" : order.status,
      statusHistory: [
        {
          status: order.status === "awaiting_mpesa" ? "placed" : order.status,
          at: order.createdAt,
        },
      ],
    },
  });
  return data.order;
}

export async function fetchRemoteOrder(orderId: string, phone: string) {
  const data = await medusaBrowserFetch<{ order: PendingOrder }>({
    path: `/store/photon-orders/${encodeURIComponent(orderId)}?phone=${encodeURIComponent(phone)}`,
  });
  return data.order;
}

export async function simulateRemotePayment(
  orderId: string,
  outcome: "success" | "fail",
  phone: string
) {
  const data = await medusaBrowserFetch<{
    order: PendingOrder;
    already_paid?: boolean;
  }>({
    path: `/store/photon-orders/${encodeURIComponent(orderId)}/simulate-payment`,
    method: "POST",
    body: { outcome, phone },
  });
  return data;
}
