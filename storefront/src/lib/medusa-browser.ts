const BACKEND =
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "/medusa";
const PUBLISHABLE =
  process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "";

export type MedusaCustomer = {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  has_account: boolean;
};

export type MedusaAddress = {
  id: string;
  address_name: string | null;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  address_1: string | null;
  address_2: string | null;
  city: string | null;
  province: string | null;
  postal_code: string | null;
  country_code: string | null;
  metadata: Record<string, unknown> | null;
  is_default_shipping: boolean;
  is_default_billing: boolean;
};

type BrowserFetchOpts = {
  path: string;
  method?: string;
  body?: unknown;
  token?: string | null;
};

export class MedusaApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function medusaBrowserFetch<T>({
  path,
  method = "GET",
  body,
  token,
}: BrowserFetchOpts): Promise<T> {
  const headers: Record<string, string> = {
    Accept: "application/json",
    "x-publishable-api-key": PUBLISHABLE,
  };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${BACKEND}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    credentials: "include",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    let message = text.slice(0, 240) || res.statusText;
    try {
      const parsed = JSON.parse(text) as { message?: string };
      if (parsed.message) message = parsed.message;
    } catch {
      /* keep text */
    }
    throw new MedusaApiError(res.status, message);
  }

  if (res.status === 204) return undefined as T;
  const text = await res.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

export function customerDisplayName(customer: MedusaCustomer) {
  const name = [customer.first_name, customer.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();
  return name || customer.email;
}
