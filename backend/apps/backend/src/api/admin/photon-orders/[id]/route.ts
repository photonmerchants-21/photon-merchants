import { MedusaRequest, MedusaResponse } from '@medusajs/framework/http'
import {
  getPhotonOrder,
  patchPhotonOrder,
} from '../../../../lib/photon-order-store'
import {
  STAFF_STATUSES,
  type PhotonOrderStatus,
} from '../../../../lib/photon-orders'
import { notifyOrderStatus } from '../../../../lib/photon-order-notify'

type Body = {
  status?: PhotonOrderStatus
  eta?: string | null
  dispatchNote?: string | null
  note?: string | null
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const order = await getPhotonOrder(req.scope, req.params.id)
  if (!order) {
    res.status(404).json({ message: 'Order not found' })
    return
  }
  res.json({ order })
}

export async function POST(req: MedusaRequest<Body>, res: MedusaResponse) {
  const existing = await getPhotonOrder(req.scope, req.params.id)
  if (!existing) {
    res.status(404).json({ message: 'Order not found' })
    return
  }

  if (req.body?.status && !STAFF_STATUSES.includes(req.body.status)) {
    res.status(400).json({
      message: `status must be one of: ${STAFF_STATUSES.join(', ')}`,
    })
    return
  }

  const previous = existing.status
  const updated = await patchPhotonOrder(req.scope, req.params.id, {
    status: req.body?.status,
    eta: req.body?.eta,
    dispatchNote: req.body?.dispatchNote,
    note: req.body?.note,
  })

  if (
    updated &&
    (req.body?.status ||
      req.body?.eta !== undefined ||
      req.body?.dispatchNote !== undefined)
  ) {
    if (req.body?.status && req.body.status !== previous) {
      await notifyOrderStatus(req.scope, updated, previous)
    }
  }

  res.json({ order: updated })
}
