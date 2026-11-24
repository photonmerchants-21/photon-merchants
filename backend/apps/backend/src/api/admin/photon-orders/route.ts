import { MedusaRequest, MedusaResponse } from '@medusajs/framework/http'
import { listPhotonOrders } from '../../../lib/photon-order-store'

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const orders = await listPhotonOrders(req.scope)
  res.json({ orders, count: orders.length })
}
