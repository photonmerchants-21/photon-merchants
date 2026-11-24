import type { MetadataRoute } from "next";
import { getNavCategories, listProducts } from "../lib/medusa";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "http://127.0.0.1:3001";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const categories = await getNavCategories();
  const staticRoutes: MetadataRoute.Sitemap = [
    "",
    "/orders",
    "/search",
    "/deals",
    ...categories.map((c) => `/category/${c.slug}`),
  ].map((path) => ({
    url: `${siteUrl}${path}`,
    changeFrequency: path === "" ? "daily" : "weekly",
    priority: path === "" ? 1 : 0.7,
  }));

  let productRoutes: MetadataRoute.Sitemap = [];
  try {
    const { products } = await listProducts({ limit: 200 });
    productRoutes = products.map((p) => ({
      url: `${siteUrl}/product/${p.handle}`,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));
  } catch {
    /* Medusa down during build — static routes still ship */
  }

  return [...staticRoutes, ...productRoutes];
}
