import { MedusaRequest, MedusaResponse } from '@medusajs/framework/http'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'
import {
  discountAmountOff,
  findDiscountCode,
  normalizeDiscountCodes,
} from '../../../../lib/photon-discounts'

type Body = { code?: string; subtotal?: number }

export async function POST(req: MedusaRequest<Body>, res: MedusaResponse) {
  const code = (req.body?.code || '').trim()
  const subtotal = Number(req.body?.subtotal) || 0
  if (!code) {
    res.status(400).json({ message: 'Discount code is required', valid: false })
    return
  }

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data: stores } = await query.graph({
    entity: 'store',
    fields: ['id', 'metadata'],
  })
  const store = stores[0]
  const metadata = (store?.metadata || {}) as Record<string, unknown>
  const codes = normalizeDiscountCodes(metadata.photon_discount_codes)
  const discount = findDiscountCode(codes, code)

  if (!discount) {
    res.status(404).json({
      valid: false,
      message: 'That code is not valid',
    })
    return
  }

  const amount_off = discountAmountOff(discount, subtotal)
  res.json({
    valid: true,
    code: discount.code,
    type: discount.type,
    value: discount.value,
    amount_off,
    note: discount.note || null,
  })
}
