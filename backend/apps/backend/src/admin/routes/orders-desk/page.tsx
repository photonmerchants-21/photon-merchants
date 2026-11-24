import { defineRouteConfig } from '@medusajs/admin-sdk'
import {
  Badge,
  Button,
  Container,
  Heading,
  Input,
  Label,
  Text,
  Textarea,
  toast,
} from '@medusajs/ui'
import { useEffect, useMemo, useState } from 'react'

type PhotonOrder = {
  id: string
  createdAt: string
  status: string
  total: number
  currency: string
  customer: { name: string; phone: string; email: string }
  areaLabel: string | null
  fulfillment: string
  eta?: string | null
  dispatchNote?: string | null
  statusHistory: { status: string; at: string; note?: string | null }[]
  lines: { title: string; variantTitle: string; quantity: number }[]
}

const DELIVERY_STATUSES = [
  'paid',
  'processing',
  'packed',
  'dispatched',
  'out_for_delivery',
  'delivered',
  'cancelled',
  'returned',
] as const

const COLLECTION_STATUSES = [
  'paid',
  'processing',
  'packed',
  'delivered',
  'cancelled',
  'returned',
] as const

function staffStatusLabel(status: string, fulfillment: string) {
  if (fulfillment === 'collection') {
    if (status === 'packed') return 'ready for collection'
    if (status === 'delivered') return 'collected'
  }
  return status.replace(/_/g, ' ')
}

const PAID_LIKE = new Set([
  'paid',
  'processing',
  'packed',
  'dispatched',
  'out_for_delivery',
  'delivered',
])

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10)
}

function daysAgoIso(days: number) {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().slice(0, 10)
}

const OrdersDeskPage = () => {
  const [orders, setOrders] = useState<PhotonOrder[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState('paid')
  const [eta, setEta] = useState('')
  const [dispatchNote, setDispatchNote] = useState('')
  const [fromDate, setFromDate] = useState(daysAgoIso(30))
  const [toDate, setToDate] = useState(todayIsoDate())

  const selected = useMemo(
    () => orders.find((o) => o.id === selectedId) || null,
    [orders, selectedId]
  )

  const salesSummary = useMemo(() => {
    const from = fromDate ? new Date(`${fromDate}T00:00:00`) : null
    const to = toDate ? new Date(`${toDate}T23:59:59.999`) : null
    const inRange = orders.filter((o) => {
      const at = new Date(o.paidAt || o.createdAt)
      if (from && at < from) return false
      if (to && at > to) return false
      return true
    })
    const paid = inRange.filter((o) => PAID_LIKE.has(o.status))
    const amount = paid.reduce((sum, o) => sum + (Number(o.total) || 0), 0)
    return {
      orderCount: inRange.length,
      paidCount: paid.length,
      amountPaid: amount,
    }
  }, [orders, fromDate, toDate])

  const filteredOrders = useMemo(() => {
    const from = fromDate ? new Date(`${fromDate}T00:00:00`) : null
    const to = toDate ? new Date(`${toDate}T23:59:59.999`) : null
    return orders.filter((o) => {
      const at = new Date(o.createdAt)
      if (from && at < from) return false
      if (to && at > to) return false
      return true
    })
  }, [orders, fromDate, toDate])

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch('/admin/photon-orders', { credentials: 'include' })
      const data = await res.json()
      setOrders(data.orders || [])
      if (!selectedId && data.orders?.[0]) {
        setSelectedId(data.orders[0].id)
      }
    } catch {
      toast.error('Could not load orders')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const staffStatuses =
    selected?.fulfillment === 'collection'
      ? COLLECTION_STATUSES
      : DELIVERY_STATUSES

  useEffect(() => {
    if (!selected) return
    const allowed =
      selected.fulfillment === 'collection'
        ? COLLECTION_STATUSES
        : DELIVERY_STATUSES
    setStatus(
      allowed.includes(selected.status as (typeof allowed)[number])
        ? selected.status
        : 'paid'
    )
    setEta(selected.eta || '')
    setDispatchNote(selected.dispatchNote || '')
  }, [selected])

  const save = async () => {
    if (!selected) return
    setSaving(true)
    try {
      const res = await fetch(`/admin/photon-orders/${selected.id}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          eta: eta || null,
          dispatchNote: dispatchNote || null,
          note: `Staff set status to ${status}`,
        }),
      })
      if (!res.ok) throw new Error('save failed')
      const data = await res.json()
      setOrders((prev) =>
        prev.map((o) => (o.id === data.order.id ? data.order : o))
      )
      toast.success(`Updated ${data.order.id}`)
    } catch {
      toast.error('Could not update order')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Container className="p-6">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <Heading level="h1">Orders desk</Heading>
          <Text className="text-ui-fg-subtle">
            Move the same order the customer can track. Status emails log locally
            in sandbox.
          </Text>
        </div>
        <Button variant="secondary" onClick={() => void load()}>
          Refresh
        </Button>
      </div>

      <div className="mb-6 grid gap-4 rounded-lg border border-ui-border-base p-4 md:grid-cols-[1fr_1fr_auto]">
        <div>
          <Label>From</Label>
          <Input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
        </div>
        <div>
          <Label>To</Label>
          <Input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
        </div>
        <div className="flex flex-col justify-end gap-1 text-sm">
          <Text>
            Orders in range: <strong>{salesSummary.orderCount}</strong>
          </Text>
          <Text>
            Paid: <strong>{salesSummary.paidCount}</strong> · KES{' '}
            <strong>{salesSummary.amountPaid.toLocaleString('en-KE')}</strong>
          </Text>
        </div>
      </div>

      {loading ? (
        <Text>Loading orders…</Text>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <div className="space-y-2">
            {!filteredOrders.length && (
              <Text className="text-ui-fg-subtle">
                No Photon orders in this date range. Complete a storefront
                checkout first.
              </Text>
            )}
            {filteredOrders.map((order) => (
              <button
                key={order.id}
                type="button"
                onClick={() => setSelectedId(order.id)}
                className={`w-full rounded-lg border p-3 text-left ${
                  selectedId === order.id
                    ? 'border-ui-fg-interactive bg-ui-bg-base'
                    : 'border-ui-border-base'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{order.id}</span>
                  <Badge size="2xsmall">{order.status}</Badge>
                </div>
                <Text size="small" className="text-ui-fg-subtle">
                  {order.customer.name} · KES {order.total.toLocaleString('en-KE')}
                </Text>
              </button>
            ))}
          </div>

          {selected ? (
            <div className="space-y-5 rounded-lg border border-ui-border-base p-4">
              <div>
                <Heading level="h2">{selected.id}</Heading>
                <Text className="text-ui-fg-subtle">
                  {selected.customer.name} · {selected.customer.phone} ·{' '}
                  {selected.customer.email}
                </Text>
                <Text size="small" className="mt-1 text-ui-fg-subtle">
                  {selected.fulfillment === 'collection'
                    ? 'Collection'
                    : selected.areaLabel || 'Delivery'}{' '}
                  · {new Date(selected.createdAt).toLocaleString('en-KE')}
                </Text>
              </div>

              <ul className="space-y-1 border-y border-ui-border-base py-3 text-sm">
                {selected.lines.map((line, i) => (
                  <li key={`${selected.id}-${i}`}>
                    {line.title}
                    {line.variantTitle !== 'Default'
                      ? ` · ${line.variantTitle}`
                      : ''}{' '}
                    × {line.quantity}
                  </li>
                ))}
              </ul>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Status</Label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="mt-1 w-full rounded-md border border-ui-border-base bg-ui-bg-field px-2 py-2 text-sm"
                  >
                    {staffStatuses.map((s) => (
                      <option key={s} value={s}>
                        {staffStatusLabel(s, selected.fulfillment)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>
                    {selected.fulfillment === 'collection'
                      ? 'Ready / collect by'
                      : 'ETA'}
                  </Label>
                  <Input
                    value={eta}
                    onChange={(e) => setEta(e.target.value)}
                    placeholder={
                      selected.fulfillment === 'collection'
                        ? 'Ready after 3pm · Shop B77'
                        : 'Today 4–6pm / Tomorrow morning'
                    }
                  />
                </div>
              </div>

              <div>
                <Label>
                  {selected.fulfillment === 'collection'
                    ? 'Collection note'
                    : 'Dispatch / delivery note'}
                </Label>
                <Textarea
                  value={dispatchNote}
                  onChange={(e) => setDispatchNote(e.target.value)}
                  placeholder={
                    selected.fulfillment === 'collection'
                      ? 'Counter B77 · ask for receipt'
                      : 'Rider: John · leave with guard'
                  }
                  rows={3}
                />
              </div>

              <Button onClick={() => void save()} isLoading={saving}>
                Save status
              </Button>

              <div>
                <Heading level="h3">History</Heading>
                <ul className="mt-2 space-y-2">
                  {[...selected.statusHistory].reverse().map((event, i) => (
                    <li key={`${event.at}-${i}`} className="text-sm">
                      <span className="font-medium">
                        {staffStatusLabel(event.status, selected.fulfillment)}
                      </span>
                      <span className="text-ui-fg-subtle">
                        {' '}
                        · {new Date(event.at).toLocaleString('en-KE')}
                      </span>
                      {event.note ? (
                        <div className="text-ui-fg-subtle">{event.note}</div>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </Container>
  )
}

export const config = defineRouteConfig({
  label: 'Orders desk',
  rank: 15,
})

export default OrdersDeskPage
