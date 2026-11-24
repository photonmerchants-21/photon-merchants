import areas from "../data/delivery-areas.json";

export type DeliveryArea = {
  id: string;
  corridor: string;
  area: string;
  fee: number;
};

export const deliveryAreas = areas as DeliveryArea[];

export const COLLECTION_FEE = 0;

export function getDeliveryArea(id: string | null | undefined) {
  if (!id) return null;
  return deliveryAreas.find((a) => a.id === id) ?? null;
}

export function corridors() {
  const map = new Map<string, DeliveryArea[]>();
  for (const area of deliveryAreas) {
    const list = map.get(area.corridor) ?? [];
    list.push(area);
    map.set(area.corridor, list);
  }
  return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
}

export function deliveryFee(
  method: "delivery" | "collection",
  areaId: string | null | undefined
) {
  if (method === "collection") return COLLECTION_FEE;
  return getDeliveryArea(areaId)?.fee ?? 0;
}
