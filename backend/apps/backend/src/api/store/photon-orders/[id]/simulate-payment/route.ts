import { MedusaRequest, MedusaResponse } from '@medusajs/framework/http'
import { decrementStockForPaidOrder } from '../../../../../lib/photon-inventory'
import {
  getPhotonOrder,
  patchPhotonOrder,
} from '../../../../../lib/photon-order-store'
import {
  isAwaitingPayment,
  isPaidLike,
} from '../../../../../lib/photon-orders'
import { notifyOrderStatus } from '../../../../../lib/photon-order-notify'

type Body = { outcome?: 'success' | 'fail'; phone?: string }

export async function POST(req: MedusaRequest<Body>, res: MedusaResponse) {
  const id = req.params.id
  const existing = await getPhotonOrder(req.scope, id)
  if (!existing) {
    res.status(404).json({ message: 'Order not found' })
    return
  }

  const phone = String(req.body?.phone || '')
  if (phone) {
    const digits = (s: string) => s.replace(/\D/g, '').slice(-9)
    if (digits(existing.customer.phone) !== digits(phone)) {
      res.status(403).json({ message: 'Phone does not match order' })
      return
    }
  }

  // Idempotent: already paid stays paid
  if (isPaidLike(existing.status)) {
    res.json({ order: existing, already_paid: true })
    return
  }

  const outcome = req.body?.outcome === 'fail' ? 'fail' : 'success'
  const previous = existing.status

  if (outcome === 'fail') {
    if (!isAwaitingPayment(existing.status)) {
      res.json({ order: existing })
      return
    }
    const updated = await patchPhotonOrder(req.scope, id, {
      status: 'payment_failed',
      paidAt: null,
      paymentSimulated: true,
      note: 'Sandbox simulate: cancelled / failed',
    })
    if (updated) await notifyOrderStatus(req.scope, updated, previous)
    res.json({ order: updated })
    return
  }

  let updated = await patchPhotonOrder(req.scope, id, {
    status: 'paid',
    paidAt: new Date().toISOString(),
    paymentSimulated: true,
    note: 'Sandbox simulate: payment confirmed',
  })

  if (updated && !updated.stockDecremented) {
    const stock = await decrementStockForPaidOrder(req.scope, updated)
    if (stock.adjusted > 0) {
      updated = await patchPhotonOrder(req.scope, id, {
        stockDecremented: true,
        note: `Stock adjusted for ${stock.adjusted} line(s)`,
      })
    }
  }

  if (updated) await notifyOrderStatus(req.scope, updated, previous)
  res.json({ order: updated })
}
