import { MedusaRequest, MedusaResponse } from '@medusajs/framework/http'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'
import { updateStoresWorkflow } from '@medusajs/medusa/core-flows'
import {
  DEFAULT_DISCOUNT_CODES,
  normalizeDiscountCodes,
  type PhotonDiscountCode,
} from '../../../lib/photon-discounts'

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data: stores } = await query.graph({
    entity: 'store',
    fields: ['id', 'metadata'],
  })
  const store = stores[0]
  if (!store) {
    res.status(404).json({ message: 'Store not found' })
    return
  }
  const metadata = (store.metadata || {}) as Record<string, unknown>
  const codes = normalizeDiscountCodes(metadata.photon_discount_codes)
  res.json({ codes, defaults: DEFAULT_DISCOUNT_CODES })
}

type Body = { codes?: PhotonDiscountCode[] }

export async function POST(req: MedusaRequest<Body>, res: MedusaResponse) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data: stores } = await query.graph({
    entity: 'store',
    fields: ['id', 'metadata'],
  })
  const store = stores[0]
  if (!store) {
    res.status(404).json({ message: 'Store not found' })
    return
  }

  const codes = normalizeDiscountCodes(req.body?.codes)
  const previous = (store.metadata || {}) as Record<string, unknown>

  await updateStoresWorkflow(req.scope).run({
    input: {
      selector: { id: store.id as string },
      update: {
        metadata: {
          ...previous,
          photon_discount_codes: codes,
        },
      },
    },
  })

  res.json({ codes })
}
