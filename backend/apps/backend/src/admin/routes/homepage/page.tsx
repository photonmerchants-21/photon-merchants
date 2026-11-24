import { defineRouteConfig } from '@medusajs/admin-sdk'
import {
  Button,
  Container,
  Heading,
  Input,
  Label,
  Switch,
  Text,
  Textarea,
  toast,
} from '@medusajs/ui'
import { useEffect, useState } from 'react'
import type { HomepageConfig } from '../../../lib/homepage'

const empty: HomepageConfig = {
  hero: {
    eyebrow: '',
    title: '',
    subtitle: '',
    image_url: '',
    cta_label: '',
    cta_href: '',
  },
  campaign: {
    enabled: false,
    price_list_id: '',
    name: '',
    headline: '',
    subtitle: '',
    badge: '',
    image_url: '',
    cta_label: '',
  },
  offers: { title: 'On offer', product_handles: [] },
  featured: { title: 'Featured', product_handles: [] },
  new_arrivals: { title: 'New', product_handles: [] },
  bestsellers: { title: 'Best sellers', product_handles: [] },
  trust: [
    { title: '', body: '' },
    { title: '', body: '' },
    { title: '', body: '' },
  ],
}

type ProductHit = { id: string; title: string; handle: string }

type PriceListOption = {
  id: string
  title: string
  status: string
  starts_at: string | null
  ends_at: string | null
}

function formatWindow(list?: PriceListOption) {
  if (!list) return ''
  const fmt = (iso: string | null) =>
    iso
      ? new Date(iso).toLocaleString('en-KE', {
          dateStyle: 'medium',
          timeStyle: 'short',
        })
      : 'open'
  return `${fmt(list.starts_at)} → ${fmt(list.ends_at)} · ${list.status}`
}

function handlesToText(handles: string[]) {
  return handles.join(', ')
}

function textToHandles(value: string) {
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

const STOREFRONT_URL = 'http://127.0.0.1:3001'

const HomepagePage = () => {
  const [config, setConfig] = useState<HomepageConfig>(empty)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [productQuery, setProductQuery] = useState('')
  const [productHits, setProductHits] = useState<ProductHit[]>([])
  const [searching, setSearching] = useState(false)
  const [pickerTarget, setPickerTarget] = useState<
    'offers' | 'featured' | 'new_arrivals' | 'bestsellers' | null
  >(null)
  const [priceLists, setPriceLists] = useState<PriceListOption[]>([])

  useEffect(() => {
    fetch('/admin/homepage', { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => {
        if (data.homepage) setConfig(data.homepage)
      })
      .catch(() => toast.error('Could not load homepage config'))
      .finally(() => setLoading(false))
    fetch(
      '/admin/price-lists?limit=50&fields=id,title,status,starts_at,ends_at',
      { credentials: 'include' }
    )
      .then((r) => r.json())
      .then((data) => setPriceLists(data.price_lists || []))
      .catch(() => setPriceLists([]))
  }, [])

  const setCampaign = (patch: Partial<HomepageConfig['campaign']>) =>
    setConfig((prev) => ({ ...prev, campaign: { ...prev.campaign, ...patch } }))
  const selectedList = priceLists.find(
    (l) => l.id === config.campaign.price_list_id
  )

  const save = async () => {
    setSaving(true)
    try {
      const res = await fetch('/admin/homepage', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ homepage: config }),
      })
      if (!res.ok) {
        throw new Error(await res.text())
      }
      const data = await res.json()
      setConfig(data.homepage)
      toast.success('Homepage saved — refresh the storefront to see it')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const uploadHero = async (file: File | null) => {
    if (!file) return
    setUploading(true)
    try {
      const body = new FormData()
      body.append('files', file)
      const res = await fetch('/admin/uploads', {
        method: 'POST',
        credentials: 'include',
        body,
      })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      const url = data.files?.[0]?.url
      if (!url) throw new Error('Upload returned no URL')
      setConfig((prev) => ({
        ...prev,
        hero: { ...prev.hero, image_url: url },
      }))
      toast.success('Hero image uploaded — save homepage to publish')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const searchProducts = async () => {
    const q = productQuery.trim()
    if (!q) {
      setProductHits([])
      return
    }
    setSearching(true)
    try {
      const res = await fetch(
        `/admin/products?q=${encodeURIComponent(q)}&limit=12&fields=id,title,handle`,
        { credentials: 'include' }
      )
      const data = await res.json()
      setProductHits(
        (data.products || []).map(
          (p: { id: string; title: string; handle: string }) => ({
            id: p.id,
            title: p.title,
            handle: p.handle,
          })
        )
      )
    } catch {
      toast.error('Product search failed')
    } finally {
      setSearching(false)
    }
  }

  const addHandle = (
    section: 'offers' | 'featured' | 'new_arrivals' | 'bestsellers',
    handle: string
  ) => {
    setConfig((prev) => {
      const handles = prev[section].product_handles
      if (handles.includes(handle)) return prev
      return {
        ...prev,
        [section]: {
          ...prev[section],
          product_handles: [...handles, handle],
        },
      }
    })
    toast.success(`Added ${handle}`)
  }

  if (loading) {
    return (
      <Container className="p-8">
        <Text>Loading homepage…</Text>
      </Container>
    )
  }

  return (
    <Container className="flex flex-col gap-6 p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Heading level="h1">Homepage</Heading>
          <Text className="text-ui-fg-subtle">
            Edit hero, offers, and shelves. Upload a banner or paste a URL.
            Changes apply after save + storefront refresh.
          </Text>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={() => window.open(STOREFRONT_URL, '_blank')}
          >
            Open storefront
          </Button>
          <Button onClick={save} isLoading={saving}>
            Save homepage
          </Button>
        </div>
      </div>

      <section className="rounded-lg border border-ui-border-base p-4">
        <Heading level="h2">Hero banner</Heading>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {(
            [
              ['eyebrow', 'Eyebrow'],
              ['title', 'Title'],
              ['subtitle', 'Subtitle'],
              ['image_url', 'Image URL'],
              ['cta_label', 'CTA label'],
              ['cta_href', 'CTA link (e.g. /category/bedroom-bedding or /deals)'],
            ] as const
          ).map(([key, label]) => (
            <div
              key={key}
              className={
                key === 'subtitle' || key === 'image_url' ? 'md:col-span-2' : ''
              }
            >
              <Label>{label}</Label>
              {key === 'subtitle' ? (
                <Textarea
                  rows={3}
                  value={config.hero[key]}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      hero: { ...config.hero, [key]: e.target.value },
                    })
                  }
                />
              ) : (
                <Input
                  value={config.hero[key]}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      hero: { ...config.hero, [key]: e.target.value },
                    })
                  }
                />
              )}
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Label htmlFor="hero-upload">Upload hero image</Label>
          <Input
            id="hero-upload"
            type="file"
            accept="image/*"
            disabled={uploading}
            onChange={(e) => void uploadHero(e.target.files?.[0] || null)}
          />
          {config.hero.image_url ? (
            <img
              src={config.hero.image_url}
              alt="Hero preview"
              className="h-16 w-28 rounded object-cover"
            />
          ) : null}
        </div>
      </section>

      <section className="rounded-lg border border-ui-border-base p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Heading level="h2">Sale campaign</Heading>
            <Text size="small" className="mt-1 text-ui-fg-subtle">
              Shows a countdown bar, a homepage banner, and the /deals page
              while the linked price list is active. Sale prices, products,
              and dates are set under Price Lists in the sidebar.
            </Text>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id="campaign-enabled"
              checked={config.campaign.enabled}
              onCheckedChange={(enabled) => setCampaign({ enabled })}
            />
            <Label htmlFor="campaign-enabled">Show on storefront</Label>
          </div>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="md:col-span-2">
            <Label>Price list</Label>
            <select
              value={config.campaign.price_list_id}
              onChange={(e) => setCampaign({ price_list_id: e.target.value })}
              className="mt-1 w-full rounded-md border border-ui-border-base bg-ui-bg-field px-2 py-2 text-sm"
            >
              <option value="">Choose a price list…</option>
              {priceLists.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.title}
                </option>
              ))}
            </select>
            {selectedList ? (
              <Text size="small" className="mt-1 text-ui-fg-subtle">
                {formatWindow(selectedList)} ·{' '}
                <a
                  href={`/app/price-lists/${selectedList.id}`}
                  className="text-ui-fg-interactive hover:underline"
                >
                  Edit prices and dates
                </a>
              </Text>
            ) : null}
          </div>
          {(
            [
              ['name', 'Campaign name (bar label)'],
              ['badge', 'Product badge'],
              ['headline', 'Banner headline'],
              ['cta_label', 'Button label'],
              ['subtitle', 'Banner subtitle'],
              ['image_url', 'Banner image URL'],
            ] as const
          ).map(([key, label]) => (
            <div
              key={key}
              className={
                key === 'subtitle' || key === 'image_url' ? 'md:col-span-2' : ''
              }
            >
              <Label>{label}</Label>
              <Input
                value={config.campaign[key]}
                onChange={(e) => setCampaign({ [key]: e.target.value })}
              />
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-ui-border-base p-4">
        <Heading level="h2">Add products by search</Heading>
        <Text size="small" className="mt-1 text-ui-fg-subtle">
          Search, pick a shelf, then click a product to append its handle.
        </Text>
        <div className="mt-3 flex flex-wrap gap-2">
          <Input
            value={productQuery}
            onChange={(e) => setProductQuery(e.target.value)}
            placeholder="Search title or handle…"
            className="max-w-sm"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                void searchProducts()
              }
            }}
          />
          <Button
            variant="secondary"
            onClick={() => void searchProducts()}
            isLoading={searching}
          >
            Search
          </Button>
          <select
            value={pickerTarget || ''}
            onChange={(e) =>
              setPickerTarget(
                (e.target.value || null) as typeof pickerTarget
              )
            }
            className="rounded-md border border-ui-border-base bg-ui-bg-field px-2 py-2 text-sm"
          >
            <option value="">Choose shelf…</option>
            <option value="offers">On offer</option>
            <option value="featured">Featured</option>
            <option value="new_arrivals">New arrivals</option>
            <option value="bestsellers">Best sellers</option>
          </select>
        </div>
        {productHits.length > 0 && (
          <ul className="mt-3 space-y-1">
            {productHits.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  className="text-left text-sm text-ui-fg-interactive hover:underline"
                  onClick={() => {
                    if (!pickerTarget) {
                      toast.error('Choose a shelf first')
                      return
                    }
                    addHandle(pickerTarget, p.handle)
                  }}
                >
                  {p.title}{' '}
                  <span className="text-ui-fg-subtle">({p.handle})</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {(
        [
          ['offers', 'On offer'],
          ['featured', 'Featured'],
          ['new_arrivals', 'New arrivals'],
          ['bestsellers', 'Best sellers'],
        ] as const
      ).map(([key, label]) => (
        <section
          key={key}
          className="rounded-lg border border-ui-border-base p-4"
        >
          <Heading level="h2">{label}</Heading>
          <div className="mt-4 grid gap-3">
            <div>
              <Label>Section title</Label>
              <Input
                value={config[key].title}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    [key]: { ...config[key], title: e.target.value },
                  })
                }
              />
            </div>
            <div>
              <Label>Product handles (comma-separated)</Label>
              <Textarea
                rows={2}
                value={handlesToText(config[key].product_handles)}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    [key]: {
                      ...config[key],
                      product_handles: textToHandles(e.target.value),
                    },
                  })
                }
              />
            </div>
          </div>
        </section>
      ))}

      <section className="rounded-lg border border-ui-border-base p-4">
        <Heading level="h2">Trust strip</Heading>
        <div className="mt-4 grid gap-4">
          {config.trust.map((item, index) => (
            <div key={index} className="grid gap-2 md:grid-cols-2">
              <div>
                <Label>Title {index + 1}</Label>
                <Input
                  value={item.title}
                  onChange={(e) => {
                    const trust = [...config.trust]
                    trust[index] = { ...trust[index], title: e.target.value }
                    setConfig({ ...config, trust })
                  }}
                />
              </div>
              <div>
                <Label>Body {index + 1}</Label>
                <Input
                  value={item.body}
                  onChange={(e) => {
                    const trust = [...config.trust]
                    trust[index] = { ...trust[index], body: e.target.value }
                    setConfig({ ...config, trust })
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: 'Homepage',
  rank: 20,
})

export default HomepagePage
