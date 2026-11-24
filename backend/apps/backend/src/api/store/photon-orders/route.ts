import { MedusaRequest, MedusaResponse } from '@medusajs/framework/http'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'
import {
  discountAmountOff,
  findDiscountCode,
  normalizeDiscountCodes,
} from '../../../lib/photon-discounts'
import { normalizeOrder, type PhotonOrder } from '../../../lib/photon-orders'
import { upsertPhotonOrder } from '../../../lib/photon-order-store'

type CreateBody = Partial<PhotonOrder> & { id: string }

export async function POST(req: MedusaRequest<CreateBody>, res: MedusaResponse) {
  if (!req.body?.id || !req.body?.customer) {
    res.status(400).json({ message: 'id and customer are required' })
    return
  }

  const subtotal = Number(req.body.subtotal) || 0
  const deliveryFee = Number(req.body.deliveryFee) || 0
  let discountCode: string | null = null
  let discountAmount = 0

  const requestedCode = (req.body.discountCode || '').trim()
  if (requestedCode) {
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    const { data: stores } = await query.graph({
      entity: 'store',
      fields: ['id', 'metadata'],
    })
    const metadata = (stores[0]?.metadata || {}) as Record<string, unknown>
    const codes = normalizeDiscountCodes(metadata.photon_discount_codes)
    const discount = findDiscountCode(codes, requestedCode)
    if (!discount) {
      res.status(400).json({ message: 'That discount code is not valid' })
      return
    }
    discountCode = discount.code
    discountAmount = discountAmountOff(discount, subtotal)
  }

  const total = Math.max(0, subtotal - discountAmount + deliveryFee)

  const order = normalizeOrder({
    ...req.body,
    subtotal,
    deliveryFee,
    discountCode,
    discountAmount,
    total,
    status: req.body.status || 'placed',
    statusHistory: [
      {
        status: (req.body.status as PhotonOrder['status']) || 'placed',
        at: req.body.createdAt || new Date().toISOString(),
      },
    ],
  })

  const saved = await upsertPhotonOrder(req.scope, order)
  res.status(201).json({ order: saved })
}
