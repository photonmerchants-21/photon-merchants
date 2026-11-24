import { defineRouteConfig } from '@medusajs/admin-sdk'
import {
  Badge,
  Button,
  Container,
  Heading,
  Input,
  Label,
  Text,
  toast,
} from '@medusajs/ui'
import { useEffect, useState } from 'react'

type LowStockItem = {
  variant_id: string
  sku: string | null
  variant_title: string
  inventory_quantity: number
  product_title: string
  product_handle: string | null
  product_status: string | null
}

const LowStockPage = () => {
  const [threshold, setThreshold] = useState(5)
  const [items, setItems] = useState<LowStockItem[]>([])
  const [loading, setLoading] = useState(true)

  const load = async (nextThreshold = threshold) => {
    setLoading(true)
    try {
      const res = await fetch(
        `/admin/low-stock?threshold=${encodeURIComponent(String(nextThreshold))}`,
        { credentials: 'include' }
      )
      const data = await res.json()
      setItems(data.items || [])
    } catch {
      toast.error('Could not load low-stock list')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  return (
    <Container className="p-6">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <Heading level="h1">Low stock</Heading>
          <Text className="text-ui-fg-subtle">
            Variants at or below the threshold. Restock from Products in Medusa
            admin.
          </Text>
        </div>
        <div className="flex items-end gap-2">
          <div>
            <Label>Threshold</Label>
            <Input
              type="number"
              min={0}
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value) || 0)}
              className="w-28"
            />
          </div>
          <Button
            variant="secondary"
            onClick={() => void load(threshold)}
            isLoading={loading}
          >
            Refresh
          </Button>
        </div>
      </div>

      {loading ? (
        <Text>Loading…</Text>
      ) : !items.length ? (
        <Text className="text-ui-fg-subtle">
          Nothing at or below {threshold} units.
        </Text>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.variant_id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-ui-border-base p-3"
            >
              <div>
                <Text weight="plus">{item.product_title}</Text>
                <Text size="small" className="text-ui-fg-subtle">
                  {item.variant_title}
                  {item.sku ? ` · ${item.sku}` : ''}
                  {item.product_handle ? ` · ${item.product_handle}` : ''}
                </Text>
              </div>
              <Badge
                color={item.inventory_quantity <= 0 ? 'red' : 'orange'}
                size="2xsmall"
              >
                {item.inventory_quantity} left
              </Badge>
            </div>
          ))}
        </div>
      )}
    </Container>
  )
}

export const config = defineRouteConfig({
  label: 'Low stock',
  rank: 18,
})

export default LowStockPage
