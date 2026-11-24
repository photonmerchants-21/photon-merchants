/**
 * Seeds store.metadata.homepage + offer compare-at prices on sample products.
 *
 *   npx medusa exec ./src/scripts/seed-photon-homepage.ts
 */
import { updateStoresWorkflow, updateProductsWorkflow } from '@medusajs/medusa/core-flows'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'
import type { ExecArgs } from '@medusajs/framework/types'
import { DEFAULT_HOMEPAGE } from '../lib/homepage'

/** handle → compare-at KES (strikethrough); live price stays lower */
const OFFER_COMPARE_AT: Record<string, number> = {
  'photon-cotton-duvet-cover': 6200,
  'photon-frying-pan-28': 3200,
  'photon-led-desk-lamp': 2800,
  'photon-power-bank-10k': 3000,
}

export default async function seedPhotonHomepage({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const { data: stores } = await query.graph({
    entity: 'store',
    fields: ['id', 'metadata'],
  })
  const store = stores[0]
  if (!store) {
    throw new Error('No store found')
  }

  const previous = (store.metadata || {}) as Record<string, unknown>
  await updateStoresWorkflow(container).run({
    input: {
      selector: { id: store.id as string },
      update: {
        metadata: {
          ...previous,
          homepage: previous.homepage || DEFAULT_HOMEPAGE,
        },
      },
    },
  })
  logger.info('Store homepage metadata ready.')

  const { data: products } = await query.graph({
    entity: 'product',
    fields: ['id', 'handle', 'metadata'],
  })

  for (const [handle, compareAt] of Object.entries(OFFER_COMPARE_AT)) {
    const product = products.find((p) => p.handle === handle)
    if (!product) {
      logger.warn(`Offer product missing: ${handle}`)
      continue
    }
    const meta = {
      ...((product.metadata || {}) as Record<string, unknown>),
      compare_at_price: compareAt,
      on_offer: true,
    }
    await updateProductsWorkflow(container).run({
      input: {
        products: [
          {
            id: product.id as string,
            metadata: meta,
          },
        ],
      },
    })
    logger.info(`Offer metadata set on ${handle} (compare_at ${compareAt})`)
  }

  logger.info('Homepage seed done.')
}
