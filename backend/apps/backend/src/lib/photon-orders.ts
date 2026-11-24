export type FulfillmentMethod = 'delivery' | 'collection'

export type PhotonOrderStatus =
  | 'placed'
  | 'awaiting_mpesa'
  | 'payment_failed'
  | 'paid'
  | 'processing'
  | 'packed'
  | 'dispatched'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'
  | 'returned'

export type PhotonOrderLine = {
  title: string
  variantTitle: string
  quantity: number
  unitPrice: number
  currency: string
  variantId?: string | null
  productId?: string | null
}

export type PhotonOrderCustomer = {
  name: string
  phone: string
  email: string
  method: FulfillmentMethod
  areaId: string | null
}

export type StatusEvent = {
  status: PhotonOrderStatus
  at: string
  note?: string | null
}

export type PhotonOrder = {
  id: string
  createdAt: string
  customerId: string | null
  customer: PhotonOrderCustomer
  lines: PhotonOrderLine[]
  subtotal: number
  deliveryFee: number
  discountCode?: string | null
  discountAmount?: number
  total: number
  currency: string
  fulfillment: FulfillmentMethod
  areaLabel: string | null
  status: PhotonOrderStatus
  paidAt?: string | null
  paymentSimulated?: boolean
  /** True after inventory was reduced for a confirmed payment */
  stockDecremented?: boolean
  eta?: string | null
  dispatchNote?: string | null
  statusHistory: StatusEvent[]
}

export const STAFF_STATUSES: PhotonOrderStatus[] = [
  'paid',
  'processing',
  'packed',
  'dispatched',
  'out_for_delivery',
  'delivered',
  'cancelled',
  'returned',
]

export function normalizeStatus(status: string | undefined): PhotonOrderStatus {
  if (status === 'awaiting_mpesa') return 'placed'
  const allowed: PhotonOrderStatus[] = [
    'placed',
    'awaiting_mpesa',
    'payment_failed',
    'paid',
    'processing',
    'packed',
    'dispatched',
    'out_for_delivery',
    'delivered',
    'cancelled',
    'returned',
  ]
  if (status && allowed.includes(status as PhotonOrderStatus)) {
    return status === 'awaiting_mpesa' ? 'placed' : (status as PhotonOrderStatus)
  }
  return 'placed'
}

export function isAwaitingPayment(status: PhotonOrderStatus) {
  return (
    status === 'placed' ||
    status === 'awaiting_mpesa' ||
    status === 'payment_failed'
  )
}

export function isPaidLike(status: PhotonOrderStatus) {
  return (
    status === 'paid' ||
    status === 'processing' ||
    status === 'packed' ||
    status === 'dispatched' ||
    status === 'out_for_delivery' ||
    status === 'delivered'
  )
}

export function phoneTail(phone: string) {
  return phone.replace(/\D/g, '').slice(-9)
}

export function normalizeOrder(input: Partial<PhotonOrder> & { id: string }): PhotonOrder {
  const status = normalizeStatus(input.status)
  const createdAt = input.createdAt || new Date().toISOString()
  const history =
    Array.isArray(input.statusHistory) && input.statusHistory.length
      ? input.statusHistory
      : [{ status, at: createdAt }]

  return {
    id: input.id,
    createdAt,
    customerId: input.customerId ?? null,
    customer: {
      name: input.customer?.name || '',
      phone: input.customer?.phone || '',
      email: input.customer?.email || '',
      method: input.customer?.method === 'collection' ? 'collection' : 'delivery',
      areaId: input.customer?.areaId ?? null,
    },
    lines: Array.isArray(input.lines)
      ? input.lines.map((line) => ({
          title: line.title || '',
          variantTitle: line.variantTitle || 'Default',
          quantity: Number(line.quantity) || 0,
          unitPrice: Number(line.unitPrice) || 0,
          currency: (line.currency || 'kes').toLowerCase(),
          variantId: line.variantId || null,
          productId: line.productId || null,
        }))
      : [],
    subtotal: Number(input.subtotal) || 0,
    deliveryFee: Number(input.deliveryFee) || 0,
    discountCode: input.discountCode ? String(input.discountCode) : null,
    discountAmount: Math.max(0, Number(input.discountAmount) || 0),
    total: Number(input.total) || 0,
    currency: (input.currency || 'kes').toLowerCase(),
    fulfillment: input.fulfillment === 'collection' ? 'collection' : 'delivery',
    areaLabel: input.areaLabel ?? null,
    status,
    paidAt: input.paidAt ?? null,
    paymentSimulated: Boolean(input.paymentSimulated),
    stockDecremented: Boolean(input.stockDecremented),
    eta: input.eta ?? null,
    dispatchNote: input.dispatchNote ?? null,
    statusHistory: history,
  }
}

export function readOrders(metadata: Record<string, unknown> | null | undefined) {
  const raw = metadata?.photon_orders
  if (!Array.isArray(raw)) return [] as PhotonOrder[]
  return raw
    .filter((o): o is Record<string, unknown> => !!o && typeof o === 'object')
    .map((o) => normalizeOrder(o as Partial<PhotonOrder> & { id: string }))
}

export function writeOrders(
  metadata: Record<string, unknown> | null | undefined,
  orders: PhotonOrder[]
) {
  return {
    ...(metadata || {}),
    photon_orders: orders.slice(0, 200),
  }
}
