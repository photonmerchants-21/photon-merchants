import { medusaBrowserFetch } from "./medusa-browser";

export type DiscountValidation = {
  valid: boolean;
  code?: string;
  type?: "percent" | "fixed";
  value?: number;
  amount_off?: number;
  note?: string | null;
  message?: string;
};

export async function validateDiscountCode(
  code: string,
  subtotal: number
): Promise<DiscountValidation> {
  try {
    return await medusaBrowserFetch<DiscountValidation>({
      path: "/store/photon-discounts/validate",
      method: "POST",
      body: { code, subtotal },
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "That code is not valid";
    return { valid: false, message };
  }
}
