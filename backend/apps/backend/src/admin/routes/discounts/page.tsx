import { defineRouteConfig } from '@medusajs/admin-sdk'
import {
  Button,
  Container,
  Heading,
  Input,
  Label,
  Switch,
  Text,
  toast,
} from '@medusajs/ui'
import { useEffect, useState } from 'react'

type DiscountCode = {
  code: string
  type: 'percent' | 'fixed'
  value: number
  active: boolean
  note?: string
}

const emptyRow = (): DiscountCode => ({
  code: '',
  type: 'percent',
  value: 10,
  active: true,
  note: '',
})

const DiscountsPage = () => {
  const [codes, setCodes] = useState<DiscountCode[]>([emptyRow()])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/admin/photon-discounts', { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.codes) && data.codes.length) {
          setCodes(data.codes)
        }
      })
      .catch(() => toast.error('Could not load discount codes'))
      .finally(() => setLoading(false))
  }, [])

  const save = async () => {
    setSaving(true)
    try {
      const res = await fetch('/admin/photon-discounts', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codes }),
      })
      if (!res.ok) throw new Error('save failed')
      const data = await res.json()
      setCodes(data.codes)
      toast.success('Discount codes saved')
    } catch {
      toast.error('Could not save codes')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Container className="p-6">
        <Text>Loading discounts…</Text>
      </Container>
    )
  }

  return (
    <Container className="p-6">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <Heading level="h1">Discount codes</Heading>
          <Text className="text-ui-fg-subtle">
            Codes reduce the merchandise subtotal at checkout (before delivery).
            Try PHOTON10 or SAVE500 on staging.
          </Text>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={() => setCodes((prev) => [...prev, emptyRow()])}
          >
            Add code
          </Button>
          <Button onClick={() => void save()} isLoading={saving}>
            Save
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {codes.map((row, index) => (
          <div
            key={index}
            className="grid gap-3 rounded-lg border border-ui-border-base p-4 md:grid-cols-[1fr_140px_120px_100px_auto]"
          >
            <div>
              <Label>Code</Label>
              <Input
                value={row.code}
                onChange={(e) => {
                  const next = [...codes]
                  next[index] = {
                    ...row,
                    code: e.target.value.toUpperCase(),
                  }
                  setCodes(next)
                }}
                placeholder="PHOTON10"
              />
            </div>
            <div>
              <Label>Type</Label>
              <select
                value={row.type}
                onChange={(e) => {
                  const next = [...codes]
                  next[index] = {
                    ...row,
                    type: e.target.value === 'fixed' ? 'fixed' : 'percent',
                  }
                  setCodes(next)
                }}
                className="mt-1 w-full rounded-md border border-ui-border-base bg-ui-bg-field px-2 py-2 text-sm"
              >
                <option value="percent">Percent</option>
                <option value="fixed">Fixed KES</option>
              </select>
            </div>
            <div>
              <Label>Value</Label>
              <Input
                type="number"
                min={0}
                value={row.value}
                onChange={(e) => {
                  const next = [...codes]
                  next[index] = { ...row, value: Number(e.target.value) || 0 }
                  setCodes(next)
                }}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Active</Label>
              <Switch
                checked={row.active}
                onCheckedChange={(checked) => {
                  const next = [...codes]
                  next[index] = { ...row, active: Boolean(checked) }
                  setCodes(next)
                }}
              />
            </div>
            <div className="flex items-end">
              <Button
                variant="danger"
                size="small"
                onClick={() =>
                  setCodes((prev) => prev.filter((_, i) => i !== index))
                }
              >
                Remove
              </Button>
            </div>
            <div className="md:col-span-5">
              <Label>Note (optional)</Label>
              <Input
                value={row.note || ''}
                onChange={(e) => {
                  const next = [...codes]
                  next[index] = { ...row, note: e.target.value }
                  setCodes(next)
                }}
                placeholder="Shown to staff only"
              />
            </div>
          </div>
        ))}
      </div>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: 'Discounts',
  rank: 25,
})

export default DiscountsPage
