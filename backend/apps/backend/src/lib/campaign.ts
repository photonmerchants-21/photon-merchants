import type { HomepageCampaign } from './homepage'

type Query = {
  graph: (args: {
    entity: string
    fields: string[]
    filters?: Record<string, unknown>
  }) => Promise<{ data: Record<string, any>[] }>
}

export type ResolvedCampaign = HomepageCampaign & {
  live: boolean
  starts_at: string | null
  ends_at: string | null
  product_handles: string[]
}

/**
 * Live = enabled here, price list active, and now inside its date window.
 * Product handles come from the variants priced in the list.
 */
export async function resolveCampaign(
  query: Query,
  campaign: HomepageCampaign,
  now = new Date()
): Promise<ResolvedCampaign> {
  const empty: ResolvedCampaign = {
    ...campaign,
    live: false,
    starts_at: null,
    ends_at: null,
    product_handles: [],
  }
  if (!campaign.price_list_id) return empty

  const { data: lists } = await query.graph({
    entity: 'price_list',
    fields: ['id', 'status', 'starts_at', 'ends_at', 'prices.price_set_id'],
    filters: { id: campaign.price_list_id },
  })
  const list = lists[0]
  if (!list) return empty

  const startsAt = list.starts_at ? new Date(list.starts_at) : null
  const endsAt = list.ends_at ? new Date(list.ends_at) : null
  const inWindow =
    (!startsAt || startsAt <= now) && (!endsAt || endsAt > now)

  const priceSetIds = [
    ...new Set(
      (list.prices ?? []).map((p: { price_set_id?: string }) => p?.price_set_id).filter(Boolean)
    ),
  ]
  let handles: string[] = []
  if (priceSetIds.length) {
    const { data: variants } = await query.graph({
      entity: 'product_variant',
      fields: ['id', 'price_set.id', 'product.handle', 'product.status'],
    })
    const wanted = new Set(priceSetIds)
    handles = [
      ...new Set(
        variants
          .filter(
            (v) =>
              wanted.has(v.price_set?.id) && v.product?.status === 'published'
          )
          .map((v) => v.product?.handle as string)
          .filter(Boolean)
      ),
    ]
  }

  return {
    ...campaign,
    live: campaign.enabled && list.status === 'active' && inWindow,
    starts_at: startsAt?.toISOString() ?? null,
    ends_at: endsAt?.toISOString() ?? null,
    product_handles: handles,
  }
}
