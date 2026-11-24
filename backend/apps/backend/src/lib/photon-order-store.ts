import { MedusaContainer } from '@medusajs/framework/types'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'
import { updateStoresWorkflow } from '@medusajs/medusa/core-flows'
import {
  normalizeOrder,
  phoneTail,
  readOrders,
  writeOrders,
  type PhotonOrder,
  type PhotonOrderStatus,
  type StatusEvent,
} from './photon-orders'

async function getStore(container: MedusaContainer) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data: stores } = await query.graph({
    entity: 'store',
    fields: ['id', 'metadata'],
  })
  return stores[0] as { id: string; metadata?: Record<string, unknown> } | undefined
}

export async function listPhotonOrders(container: MedusaContainer) {
  const store = await getStore(container)
  if (!store) return []
  return readOrders(store.metadata).sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt)
  )
}

export async function getPhotonOrder(container: MedusaContainer, id: string) {
  const orders = await listPhotonOrders(container)
  const needle = id.trim().toUpperCase()
  return (
    orders.find((o) => o.id.toUpperCase() === needle) ??
    orders.find((o) => o.id === id.trim()) ??
    null
  )
}

export async function findPhotonOrderByPhone(
  container: MedusaContainer,
  id: string,
  phone: string
): Promise<{ order: PhotonOrder | null; reason?: 'not_found' | 'phone_mismatch' }> {
  const order = await getPhotonOrder(container, id)
  if (!order) return { order: null, reason: 'not_found' }
  if (phoneTail(order.customer.phone) !== phoneTail(phone)) {
    return { order: null, reason: 'phone_mismatch' }
  }
  return { order }
}

export async function upsertPhotonOrder(
  container: MedusaContainer,
  order: PhotonOrder
) {
  const store = await getStore(container)
  if (!store) throw new Error('Store not found')
  const previous = (store.metadata || {}) as Record<string, unknown>
  const orders = readOrders(previous).filter((o) => o.id !== order.id)
  const next = normalizeOrder(order)
  await updateStoresWorkflow(container).run({
    input: {
      selector: { id: store.id },
      update: {
        metadata: writeOrders(previous, [next, ...orders]),
      },
    },
  })
  return next
}

export async function patchPhotonOrder(
  container: MedusaContainer,
  id: string,
  patch: {
    status?: PhotonOrderStatus
    eta?: string | null
    dispatchNote?: string | null
    paidAt?: string | null
    paymentSimulated?: boolean
    stockDecremented?: boolean
    note?: string | null
  }
) {
  const existing = await getPhotonOrder(container, id)
  if (!existing) return null

  const nextStatus = patch.status ?? existing.status
  const history: StatusEvent[] = [...existing.statusHistory]
  if (patch.status && patch.status !== existing.status) {
    history.push({
      status: patch.status,
      at: new Date().toISOString(),
      note: patch.note ?? null,
    })
  }

  const updated = normalizeOrder({
    ...existing,
    status: nextStatus,
    eta: patch.eta !== undefined ? patch.eta : existing.eta,
    dispatchNote:
      patch.dispatchNote !== undefined
        ? patch.dispatchNote
        : existing.dispatchNote,
    paidAt: patch.paidAt !== undefined ? patch.paidAt : existing.paidAt,
    paymentSimulated:
      patch.paymentSimulated !== undefined
        ? patch.paymentSimulated
        : existing.paymentSimulated,
    stockDecremented:
      patch.stockDecremented !== undefined
        ? patch.stockDecremented
        : existing.stockDecremented,
    statusHistory: history,
  })

  return upsertPhotonOrder(container, updated)
}
