import { MedusaRequest, MedusaResponse } from '@medusajs/framework/http'
import { findPhotonOrderByPhone } from '../../../../lib/photon-order-store'

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const id = req.params.id
  const phone = String(req.query.phone || '')
  if (!phone) {
    res.status(400).json({ message: 'phone query is required' })
    return
  }

  const result = await findPhotonOrderByPhone(req.scope, id, phone)
  if (!result.order) {
    res.status(404).json({
      message:
        result.reason === 'phone_mismatch'
          ? 'Phone does not match this order'
          : 'Order not found',
      reason: result.reason || 'not_found',
    })
    return
  }

  res.json({ order: result.order })
}
