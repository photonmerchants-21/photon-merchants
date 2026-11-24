/**
 * Black Friday 2026: a Medusa "sale" price list plus the homepage campaign block.
 *
 *   npx medusa exec ./src/scripts/seed-black-friday.ts
 *
 * Idempotent: reuses the price list by title and replaces its prices.
 * Dates and prices can be edited afterwards in Admin → Pricing.
 */
import {
  createPriceListsWorkflow,
  updatePriceListsWorkflow,
  batchPriceListPricesWorkflow,
  updateStoresWorkflow,
} from '@medusajs/medusa/core-flows'
import { ContainerRegistrationKeys, MedusaError } from '@medusajs/framework/utils'
import type { ExecArgs } from '@medusajs/framework/types'
import { normalizeHomepage } from '../lib/homepage'

const TITLE = 'Black Friday 2026'
const STARTS_AT = new Date('2026-11-21T00:00:00+03:00')
const ENDS_AT = new Date('2026-11-30T23:59:59+03:00')

/** Percent off per product handle. */
const DEALS: Record<string, number> = {
  'photon-stick-vacuum': 40,
  'photon-scented-candle': 40,
  'photon-cast-iron-casserole': 35,
  'photon-bt-speaker': 35,
  'photon-fleece-blanket': 30,
  'photon-frying-pan-28': 30,
  'photon-blender-1-5l': 30,
  'photon-led-bath-mirror': 30,
  'photon-over-ear-headphones': 30,
  'photon-power-bank-10k': 30,
  'photon-cotton-duvet-cover': 25,
  'photon-toaster-oven': 25,
  'photon-round-wall-mirror': 25,
  'photon-espresso-machine': 20,
}

/** Rounded down to KES 10 so the advertised percent is never overstated. */
const salePrice = (amount: number, pct: number) =>
  Math.max(10, Math.floor((amount * (100 - pct)) / 100 / 10) * 10)

export default async function seedBlackFriday({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const { data: products } = await query.graph({
    entity: 'product',
    fields: ['handle', 'variants.id', 'variants.prices.amount', 'variants.prices.currency_code', 'variants.prices.price_list_id'],
    filters: { handle: Object.keys(DEALS) },
  })

  const prices: { variant_id: string; amount: number; currency_code: string }[] = []
  for (const product of products) {
    const pct = DEALS[product.handle as string]
    const variants = (product.variants ?? []) as unknown as {
      id: string
      prices?: { amount: number; currency_code: string; price_list_id?: string | null }[]
    }[]
    for (const variant of variants) {
      const kes = (variant?.prices ?? []).find(
        (p) => p.currency_code === 'kes' && !p.price_list_id
      )
      if (!variant || !kes) continue
      const amount = salePrice(Number(kes.amount), pct)
      prices.push({ variant_id: variant.id, amount, currency_code: 'kes' })
      prices.push({
        variant_id: variant.id,
        amount: Math.max(1, Math.round(amount / 150)),
        currency_code: 'eur',
      })
    }
  }
  if (!prices.length) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      'No deal products found. Run seed-photon-categories first.'
    )
  }

  const { data: lists } = await query.graph({
    entity: 'price_list',
    fields: ['id', 'title', 'prices.id'],
    filters: { title: TITLE },
  })
  let priceListId = lists[0]?.id as string | undefined

  if (!priceListId) {
    const { result } = await createPriceListsWorkflow(container).run({
      input: {
        price_lists_data: [
          {
            title: TITLE,
            description: 'Black Friday week, 21–30 Nov 2026',
            type: 'sale',
            status: 'active',
            starts_at: STARTS_AT,
            ends_at: ENDS_AT,
            prices,
          },
        ] as never,
      },
    })
    priceListId = result[0].id
    logger.info(`Created price list ${TITLE} with ${prices.length} prices.`)
  } else {
    await updatePriceListsWorkflow(container).run({
      input: {
        price_lists_data: [
          {
            id: priceListId,
            type: 'sale',
            status: 'active',
            starts_at: STARTS_AT,
            ends_at: ENDS_AT,
          },
        ] as never,
      },
    })
    await batchPriceListPricesWorkflow(container).run({
      input: {
        data: {
          id: priceListId,
          create: prices,
          update: [],
          delete: (lists[0].prices ?? []).map((p) => p?.id).filter(Boolean) as string[],
        },
      },
    })
    logger.info(`Refreshed ${TITLE} with ${prices.length} prices.`)
  }

  const { data: stores } = await query.graph({
    entity: 'store',
    fields: ['id', 'metadata'],
  })
  const store = stores[0]
  const metadata = (store.metadata || {}) as Record<string, unknown>
  const homepage = normalizeHomepage(metadata.homepage)

  await updateStoresWorkflow(container).run({
    input: {
      selector: { id: store.id },
      update: {
        metadata: {
          ...metadata,
          homepage: {
            ...homepage,
            campaign: { ...homepage.campaign, enabled: true, price_list_id: priceListId },
          },
        },
      },
    },
  })
  logger.info('Homepage campaign enabled for Black Friday.')
}
