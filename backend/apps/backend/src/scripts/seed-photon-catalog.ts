/**
 * Photon Merchants Phase 1 catalog seed.
 * Creates Beddings / Kitchenware / Electronics + sample products (KES).
 *
 *   npx medusa exec ./src/scripts/seed-photon-catalog.ts
 *
 * Idempotent: skips existing handles / category handles.
 */
import {
  createInventoryLevelsWorkflow,
  createProductCategoriesWorkflow,
  createProductsWorkflow,
  createRegionsWorkflow,
  updateStoresWorkflow,
} from '@medusajs/medusa/core-flows'
import {
  ContainerRegistrationKeys,
  MedusaError,
  ProductStatus,
} from '@medusajs/framework/utils'
import type { ExecArgs } from '@medusajs/framework/types'

type SampleProduct = {
  title: string
  handle: string
  category: 'beddings' | 'kitchenware' | 'electronics'
  description: string
  priceKes: number
  image: string
  /** Extra gallery URLs (Phase 7 multi-image) */
  images?: string[]
  stock: number
  options?: { title: string; values: string[] }
  variants?: { title: string; options: Record<string, string>; priceKes?: number }[]
}

const CATEGORIES = [
  { name: 'Beddings', handle: 'beddings', description: 'Sheets, duvets, pillows, and blankets' },
  { name: 'Kitchenware', handle: 'kitchenware', description: 'Cookware, tableware, and storage' },
  { name: 'Electronics', handle: 'electronics', description: 'Lamps, power, and small gadgets' },
] as const

const PRODUCTS: SampleProduct[] = [
  {
    title: 'Cotton Duvet Cover Set',
    handle: 'photon-cotton-duvet-cover',
    category: 'beddings',
    description: 'Soft cotton duvet cover with two pillowcases. Sample product for demo.',
    priceKes: 4500,
    image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80',
    stock: 24,
    options: { title: 'Size', values: ['Queen', 'King'] },
    variants: [
      { title: 'Queen', options: { Size: 'Queen' }, priceKes: 4500 },
      { title: 'King', options: { Size: 'King' }, priceKes: 5200 },
    ],
  },
  {
    title: 'Microfiber Pillow Pair',
    handle: 'photon-microfiber-pillows',
    category: 'beddings',
    description: 'Two medium-loft pillows. Easy care. Sample product for demo.',
    priceKes: 1800,
    image: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=800&q=80',
    stock: 40,
  },
  {
    title: 'Fleece Throw Blanket',
    handle: 'photon-fleece-blanket',
    category: 'beddings',
    description: 'Warm fleece throw for sofa or bed. Sample product for demo.',
    priceKes: 2200,
    image: 'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=800&q=80',
      'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=800&q=80',
      'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80',
    ],
    stock: 30,
  },
  {
    title: 'Fitted Sheet Set',
    handle: 'photon-fitted-sheet-set',
    category: 'beddings',
    description: 'Fitted sheet plus pillowcases. Sample product for demo.',
    priceKes: 2800,
    image: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&q=80',
    stock: 18,
  },
  {
    title: 'Non-stick Frying Pan 28cm',
    handle: 'photon-frying-pan-28',
    category: 'kitchenware',
    description: 'Everyday non-stick pan for the Nairobi kitchen. Sample product for demo.',
    priceKes: 2500,
    image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80',
    stock: 22,
  },
  {
    title: 'Stainless Mixing Bowl Set',
    handle: 'photon-mixing-bowls',
    category: 'kitchenware',
    description: 'Three nested stainless bowls. Sample product for demo.',
    priceKes: 3200,
    image: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800&q=80',
    stock: 15,
  },
  {
    title: 'Ceramic Dinner Plates (4)',
    handle: 'photon-dinner-plates',
    category: 'kitchenware',
    description: 'Set of four ceramic dinner plates. Sample product for demo.',
    priceKes: 3600,
    image: 'https://images.unsplash.com/photo-1578500494198-246f612d3b3d?w=800&q=80',
    stock: 20,
  },
  {
    title: 'Glass Food Containers',
    handle: 'photon-glass-containers',
    category: 'kitchenware',
    description: 'Three glass containers with lids. Sample product for demo.',
    priceKes: 2900,
    image: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800&q=80',
    stock: 25,
  },
  {
    title: 'LED Desk Lamp',
    handle: 'photon-led-desk-lamp',
    category: 'electronics',
    description: 'Adjustable LED desk lamp. Sample product for demo.',
    priceKes: 2100,
    image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&q=80',
    stock: 16,
  },
  {
    title: 'Extension Cable 5m',
    handle: 'photon-extension-5m',
    category: 'electronics',
    description: '5-metre extension with surge protection. Sample product for demo.',
    priceKes: 950,
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
    stock: 50,
  },
  {
    title: 'USB Power Bank 10000mAh',
    handle: 'photon-power-bank-10k',
    category: 'electronics',
    description: 'Portable 10000mAh power bank. Sample product for demo.',
    priceKes: 2400,
    image: 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=800&q=80',
    stock: 28,
  },
  {
    title: 'Bluetooth Earphones',
    handle: 'photon-bt-earphones',
    category: 'electronics',
    description: 'Wireless earphones with charging case. Sample product for demo.',
    priceKes: 3500,
    image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&q=80',
    stock: 14,
  },
]

export default async function seedPhotonCatalog({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const { data: salesChannels } = await query.graph({
    entity: 'sales_channel',
    fields: ['id', 'name'],
  })
  const { data: shippingProfiles } = await query.graph({
    entity: 'shipping_profile',
    fields: ['id'],
  })
  const { data: stockLocations } = await query.graph({
    entity: 'stock_location',
    fields: ['id', 'name'],
  })
  const { data: stores } = await query.graph({
    entity: 'store',
    fields: ['id', 'supported_currencies.currency_code', 'supported_currencies.is_default'],
  })

  const salesChannel = salesChannels[0]
  const shippingProfile = shippingProfiles[0]
  const stockLocation = stockLocations[0]
  const store = stores[0]

  if (!salesChannel || !shippingProfile || !stockLocation || !store) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      'Missing sales channel, shipping profile, stock location, or store. Run initial seed first.'
    )
  }

  const existingCurrencies = (store.supported_currencies ?? [])
    .map((c) => c?.currency_code)
    .filter(Boolean) as string[]

  if (!existingCurrencies.includes('kes')) {
    logger.info('Adding KES as default store currency…')
    await updateStoresWorkflow(container).run({
      input: {
        selector: { id: store.id },
        update: {
          supported_currencies: [
            { currency_code: 'kes', is_default: true },
            ...existingCurrencies.map((currency_code) => ({
              currency_code,
              is_default: false,
            })),
          ],
        },
      },
    })
  }

  const { data: regions } = await query.graph({
    entity: 'region',
    fields: ['id', 'name', 'currency_code'],
  })
  let kenya = regions.find((r) => r.currency_code === 'kes' || r.name === 'Kenya')
  if (!kenya) {
    logger.info('Creating Kenya region (KES)…')
    const { result } = await createRegionsWorkflow(container).run({
      input: {
        regions: [
          {
            name: 'Kenya',
            currency_code: 'kes',
            countries: ['ke'],
            payment_providers: ['pp_system_default'],
          },
        ],
      },
    })
    kenya = result[0]
  }

  const { data: existingCategories } = await query.graph({
    entity: 'product_category',
    fields: ['id', 'name', 'handle'],
  })

  const missingCats = CATEGORIES.filter(
    (c) => !existingCategories.some((e) => e.handle === c.handle || e.name === c.name)
  )

  if (missingCats.length) {
    await createProductCategoriesWorkflow(container).run({
      input: {
        product_categories: missingCats.map((c) => ({
          name: c.name,
          handle: c.handle,
          description: c.description,
          is_active: true,
        })),
      },
    })
    logger.info(`Created categories: ${missingCats.map((c) => c.name).join(', ')}`)
  }

  const { data: allCategories } = await query.graph({
    entity: 'product_category',
    fields: ['id', 'name', 'handle'],
  })

  const catByHandle = Object.fromEntries(
    allCategories
      .filter((c) => c.handle)
      .map((c) => [c.handle as string, c.id as string])
  )

  const { data: existingProducts } = await query.graph({
    entity: 'product',
    fields: ['handle'],
  })
  const taken = new Set(existingProducts.map((p) => p.handle).filter(Boolean))

  const toCreate = PRODUCTS.filter((p) => !taken.has(p.handle))

  if (!toCreate.length) {
    logger.info('All Photon sample products already exist.')
  } else {
    const products = toCreate.map((p) => {
      const categoryId = catByHandle[p.category]
      if (!categoryId) {
        throw new MedusaError(
          MedusaError.Types.NOT_FOUND,
          `Category handle missing: ${p.category}`
        )
      }

      const optionDefs = p.options
        ? [{ title: p.options.title, values: p.options.values }]
        : [{ title: 'Default', values: ['Default'] }]

      const variants =
        p.variants?.map((v) => ({
          title: v.title,
          sku: `${p.handle}-${v.title}`.toUpperCase().replace(/\s+/g, '-'),
          options: v.options,
          manage_inventory: true,
          prices: [
            { amount: v.priceKes ?? p.priceKes, currency_code: 'kes' },
            { amount: Math.round((v.priceKes ?? p.priceKes) / 150), currency_code: 'eur' },
          ],
        })) ?? [
          {
            title: 'Default',
            sku: p.handle.toUpperCase(),
            options: { Default: 'Default' },
            manage_inventory: true,
            prices: [
              { amount: p.priceKes, currency_code: 'kes' },
              { amount: Math.round(p.priceKes / 150), currency_code: 'eur' },
            ],
          },
        ]

      return {
        title: p.title,
        handle: p.handle,
        description: p.description,
        status: ProductStatus.PUBLISHED,
        thumbnail: p.image,
        images: (p.images?.length ? p.images : [p.image]).map((url) => ({
          url,
        })),
        weight: 500,
        shipping_profile_id: shippingProfile.id,
        category_ids: [categoryId],
        sales_channels: [{ id: salesChannel.id }],
        options: optionDefs,
        variants,
        metadata: { sample_stock_hint: p.stock },
      }
    })

    await createProductsWorkflow(container).run({
      input: { products: products as never },
    })
    logger.info(`Created ${products.length} Photon sample product(s).`)
  }

  // Inventory for any items still at 0 / missing levels
  const { data: inventoryItems } = await query.graph({
    entity: 'inventory_item',
    fields: ['id', 'sku', 'location_levels.id', 'location_levels.location_id'],
  })

  const stockByHandle = Object.fromEntries(PRODUCTS.map((p) => [p.handle, p.stock]))
  const levels = inventoryItems
    .filter((item) => {
      const hasHere = (item.location_levels ?? []).some(
        (l) => l?.location_id === stockLocation.id
      )
      return !hasHere
    })
    .map((item) => {
      const sku = (item.sku as string) || ''
      const handle = PRODUCTS.find((p) =>
        sku.toUpperCase().startsWith(p.handle.toUpperCase())
      )
      const qty = handle ? stockByHandle[handle.handle] : 20
      return {
        location_id: stockLocation.id,
        stocked_quantity: qty,
        inventory_item_id: item.id as string,
      }
    })

  if (levels.length) {
    await createInventoryLevelsWorkflow(container).run({
      input: { inventory_levels: levels },
    })
    logger.info(`Created ${levels.length} inventory level(s).`)
  }

  logger.info(
    `Photon catalog ready. Kenya region: ${kenya?.id ?? 'n/a'}. Categories: beddings, kitchenware, electronics.`
  )
}
