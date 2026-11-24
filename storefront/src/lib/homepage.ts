import { cache } from "react";
import { getKenyaRegionId, medusaFetch, type MedusaProduct } from "./medusa";

export type HomepageHero = {
  eyebrow: string;
  title: string;
  subtitle: string;
  image_url: string;
  cta_label: string;
  cta_href: string;
};

export type HomepageProductSection = {
  title: string;
  product_handles: string[];
};

export type HomepageTrustItem = {
  title: string;
  body: string;
};

export type HomepageCampaign = {
  enabled: boolean;
  live: boolean;
  name: string;
  headline: string;
  subtitle: string;
  badge: string;
  image_url: string;
  cta_label: string;
  starts_at: string | null;
  ends_at: string | null;
  product_handles: string[];
};

export type HomepageConfig = {
  hero: HomepageHero;
  campaign?: HomepageCampaign;
  offers: HomepageProductSection;
  featured: HomepageProductSection;
  new_arrivals: HomepageProductSection;
  bestsellers: HomepageProductSection;
  trust: HomepageTrustItem[];
};

export const fetchHomepageConfig = cache(
  async (): Promise<HomepageConfig | null> => {
    try {
      const data = await medusaFetch<{ homepage: HomepageConfig }>({
        path: "/store/homepage",
      });
      return data.homepage;
    } catch {
      return null;
    }
  }
);

/** The campaign only while it is live (enabled, active, inside its dates). */
export async function getLiveCampaign(): Promise<HomepageCampaign | null> {
  const campaign = (await fetchHomepageConfig())?.campaign;
  if (!campaign?.live) return null;
  if (campaign.ends_at && new Date(campaign.ends_at) <= new Date()) return null;
  return campaign;
}

export async function resolveSectionProducts(
  handles: string[]
): Promise<MedusaProduct[]> {
  if (!handles.length) return [];
  try {
    const region_id = await getKenyaRegionId();
    const data = await medusaFetch<{ products: MedusaProduct[] }>({
      path: "/store/products",
      query: {
        "handle[]": handles,
        limit: String(handles.length),
        region_id: region_id ?? undefined,
        fields: [
          "id",
          "title",
          "handle",
          "thumbnail",
          "metadata",
          "*variants.calculated_price",
          "+variants.inventory_quantity",
          "*categories",
        ].join(","),
      },
    });
    const byHandle = new Map(data.products.map((p) => [p.handle, p]));
    return handles
      .map((h) => byHandle.get(h))
      .filter((p): p is MedusaProduct => !!p);
  } catch {
    return [];
  }
}

export { offerCompareAt } from "./money";
