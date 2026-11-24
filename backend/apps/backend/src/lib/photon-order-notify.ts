import { MedusaContainer } from '@medusajs/framework/types'
import { Modules } from '@medusajs/framework/utils'
import type { PhotonOrder } from './photon-orders'

export async function notifyOrderStatus(
  container: MedusaContainer,
  order: PhotonOrder,
  previousStatus?: string
) {
  const notification = container.resolve(Modules.NOTIFICATION)
  const storefront =
    process.env.STOREFRONT_URL?.replace(/\/$/, '') || 'http://127.0.0.1:3001'

  await notification.createNotifications({
    to: order.customer.email || order.customer.phone,
    channel: 'email',
    template: 'order-status',
    data: {
      order_id: order.id,
      status: order.status,
      previous_status: previousStatus || null,
      total: order.total,
      currency: order.currency,
      eta: order.eta,
      dispatch_note: order.dispatchNote,
      track_url: `${storefront}/orders?order=${encodeURIComponent(order.id)}`,
      customer_name: order.customer.name,
    },
  })
}
