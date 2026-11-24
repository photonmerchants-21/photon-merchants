import { cache } from "react";
import type { MedusaCategory, MedusaProduct } from "./medusa-types";
import { site, type NavCategory } from "./site";

export type {
  MedusaCategory,
  MedusaImage,
  MedusaProduct,
  MedusaVariant,
} from "./medusa-types";

export { formatKes, productPrice, stockLabel } from "./money";

const BACKEND = process.env.MEDUSA_BACKEND_URL || "http://127.0.0.1:9000";
const PUBLISHABLE =
  process.env.MEDUSA_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ||
  "";

type FetchOpts = {
  path: string;
  query?: Record<string, string | string[] | undefined>;
  cache?: RequestCache;
};

export async function medusaFetch<T>({
  path,
  query,
  cache = "no-store",
}: FetchOpts): Promise<T> {
  const url = new URL(path.startsWith("http") ? path : `${BACKEND}${path}`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value == null) continue;
      if (Array.isArray(value)) {
        value.forEach((v) => url.searchParams.append(key, v));
      } else {
        url.searchParams.set(key, value);
      }
    }
  }

  const res = await fetch(url.toString(), {
    headers: {
      "x-publishable-api-key": PUBLISHABLE,
      Accept: "application/json",
    },
    cache,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Medusa ${res.status} ${path}: ${text.slice(0, 200)}`);
  }

  return res.json() as Promise<T>;
}

let cachedRegionId: string | null = null;

export async function getKenyaRegionId() {
  if (cachedRegionId) return cachedRegionId;
  const data = await medusaFetch<{
    regions: { id: string; currency_code: string; name: string }[];
  }>({
    path: "/store/regions",
  });
  const region =
    data.regions.find((r) => r.currency_code === "kes") ||
    data.regions.find((r) => r.name.toLowerCase().includes("kenya")) ||
    data.regions[0];
  cachedRegionId = region?.id ?? null;
  return cachedRegionId;
}

const productFields = [
  "id",
  "title",
  "handle",
  "description",
  "thumbnail",
  "metadata",
  "images.*",
  "options.*",
  "options.values.*",
  "variants.*",
  "*variants.calculated_price",
  "+variants.inventory_quantity",
  "*categories",
].join(",");

/** Active top-level categories in admin rank order. */
export const listCategories = cache(async () => {
  const data = await medusaFetch<{ product_categories: MedusaCategory[] }>({
    path: "/store/product-categories",
    query: {
      limit: "50",
      parent_category_id: "null",
      fields: "id,name,handle,description,rank,metadata",
    },
  });
  return [...data.product_categories].sort(
    (a, b) => (a.rank ?? 0) - (b.rank ?? 0)
  );
});

export async function getCategoryByHandle(handle: string) {
  const cats = await listCategories();
  return cats.find((c) => c.handle === handle) ?? null;
}

/** Categories for nav, footer, and tiles; falls back to the static list. */
export async function getNavCategories(): Promise<NavCategory[]> {
  try {
    const cats = await listCategories();
    if (cats.length) {
      return cats.map((c) => ({
        slug: c.handle,
        label: c.name,
        description: c.description,
        image:
          typeof c.metadata?.image_url === "string" ? c.metadata.image_url : null,
      }));
    }
  } catch {
    /* Medusa down: static list keeps navigation usable */
  }
  return site.categories.map((c) => ({ ...c }));
}

export async function listProducts(
  opts: {
    categoryId?: string;
    q?: string;
    limit?: number;
    handle?: string;
  } = {}
) {
  const region_id = await getKenyaRegionId();
  const data = await medusaFetch<{ products: MedusaProduct[]; count: number }>({
    path: "/store/products",
    query: {
      limit: String(opts.limit ?? 24),
      region_id: region_id ?? undefined,
      fields: productFields,
      "category_id[]": opts.categoryId ? [opts.categoryId] : undefined,
      q: opts.q || undefined,
      handle: opts.handle,
    },
  });
  return data;
}

export async function getProductByHandle(handle: string) {
  const { products } = await listProducts({ handle, limit: 1 });
  return products[0] ?? null;
}
