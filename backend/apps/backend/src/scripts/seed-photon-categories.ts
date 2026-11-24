/**
 * Photon Merchants catalog v2: eight home categories + demo products (KES).
 *
 *   npx medusa exec ./src/scripts/seed-photon-categories.ts
 *
 * Idempotent. Run after seed-photon-catalog.ts. It:
 *  - creates / updates the eight categories (name, rank, tile image),
 *  - moves the original twelve products into them and refreshes their copy,
 *  - creates the new demo products with stock at the first location,
 *  - removes the old Beddings / Kitchenware / Electronics and Medusa demo
 *    apparel categories, and unpublishes the demo apparel products.
 */
import {
  createInventoryLevelsWorkflow,
  createProductCategoriesWorkflow,
  createProductsWorkflow,
  deleteProductCategoriesWorkflow,
  updateProductCategoriesWorkflow,
  updateProductsWorkflow,
  updateStoresWorkflow,
} from '@medusajs/medusa/core-flows'
import {
  ContainerRegistrationKeys,
  MedusaError,
  ProductStatus,
} from '@medusajs/framework/utils'
import type { ExecArgs } from '@medusajs/framework/types'
import { DEFAULT_HOMEPAGE, normalizeHomepage } from '../lib/homepage'

const img = (id: string) =>
  `https://images.unsplash.com/photo-${id}?w=1000&q=80`

type CategoryHandle =
  | 'kitchen-dining'
  | 'appliances'
  | 'storage-organisation'
  | 'bedroom-bedding'
  | 'bathroom'
  | 'home-decor'
  | 'cleaning-laundry'
  | 'tech-electronics'

const CATEGORIES: {
  handle: CategoryHandle
  name: string
  description: string
  image: string
}[] = [
  {
    handle: 'kitchen-dining',
    name: 'Kitchen & Dining',
    description: 'Cookware, knives, bowls, and everything for the table',
    image: img('1556911220-bff31c812dba'),
  },
  {
    handle: 'appliances',
    name: 'Appliances',
    description: 'Blenders, ovens, and coffee machines that earn their counter space',
    image: img('1570222094114-d054a817e56b'),
  },
  {
    handle: 'storage-organisation',
    name: 'Storage & Organisation',
    description: 'Canisters, shelves, and towers to tidy every corner',
    image: img('1595428774223-ef52624120d2'),
  },
  {
    handle: 'bedroom-bedding',
    name: 'Bedroom & Bedding',
    description: 'Duvet covers, sheets, pillows, and throws',
    image: img('1615874959474-d609969a20ed'),
  },
  {
    handle: 'bathroom',
    name: 'Bathroom',
    description: 'Mirrors, dispensers, and small luxuries for the bath',
    image: img('1584622650111-993a426fbf0a'),
  },
  {
    handle: 'home-decor',
    name: 'Home Decor',
    description: 'Mirrors, clocks, and candles that finish a room',
    image: img('1578500494198-246f612d3b3d'),
  },
  {
    handle: 'cleaning-laundry',
    name: 'Cleaning & Laundry',
    description: 'Vacuums, sprayers, and baskets for an easier wash day',
    image: img('1626806787461-102c1bfaaea1'),
  },
  {
    handle: 'tech-electronics',
    name: 'Tech & Electronics',
    description: 'Power, sound, and lighting for home and on the go',
    image: img('1505740420928-5e560c06d30e'),
  },
]

const RETIRED_CATEGORY_HANDLES = [
  'beddings',
  'kitchenware',
  'electronics',
  'shirts',
  'sweatshirts',
  'pants',
  'merch',
]

const DEMO_APPAREL_HANDLES = ['t-shirt', 'sweatshirt', 'sweatpants', 'shorts']

type Seed = {
  handle: string
  category: CategoryHandle
  title: string
  description: string
  priceKes: number
  image: string
  images?: string[]
  stock: number
  compareAt?: number
  options?: { title: string; values: string[] }
  variants?: { title: string; options: Record<string, string>; priceKes?: number }[]
}

/** The original twelve products: category move plus refreshed title / copy / image. */
const EXISTING: Record<
  string,
  { category: CategoryHandle; title?: string; description?: string; image?: string }
> = {
  'photon-cotton-duvet-cover': {
    category: 'bedroom-bedding',
    description:
      'Breathable cotton duvet cover with two matching pillowcases and a hidden button closure.',
  },
  'photon-microfiber-pillows': {
    category: 'bedroom-bedding',
    description:
      'Two medium-loft microfibre pillows that keep their shape. Machine washable.',
  },
  'photon-fleece-blanket': {
    category: 'bedroom-bedding',
    description: 'Soft, warm fleece throw for the sofa or the foot of the bed.',
  },
  'photon-fitted-sheet-set': {
    category: 'bedroom-bedding',
    description:
      'Deep-pocket fitted sheet with two pillowcases. Elastic all round for a snug fit.',
  },
  'photon-frying-pan-28': {
    category: 'kitchen-dining',
    description:
      'Everyday 28cm non-stick pan for eggs, chapati, and stir-fries. Works on gas and electric.',
  },
  'photon-mixing-bowls': {
    category: 'kitchen-dining',
    description: 'Three nesting stainless steel bowls for mixing, marinating, and serving.',
  },
  'photon-dinner-plates': {
    category: 'kitchen-dining',
    title: 'Stoneware Bowl Set (4)',
    description:
      'Four speckled stoneware bowls with a matte glaze. Stack neatly, microwave and dishwasher safe.',
    image: img('1603199506016-b9a594b593c0'),
  },
  'photon-glass-containers': {
    category: 'storage-organisation',
    title: 'Stacking Ceramic Canisters (4)',
    description:
      'Four nesting canisters for sugar, tea, rice, and spices. Airtight lids keep the pantry fresh.',
    image: img('1610701596007-11502861dcfa'),
  },
  'photon-led-desk-lamp': {
    category: 'tech-electronics',
    description:
      'Adjustable LED lamp with an angled head and soft, flicker-free light for desks and bedsides.',
  },
  'photon-extension-5m': {
    category: 'tech-electronics',
    description: '5-metre, four-way extension with surge protection and a master switch.',
  },
  'photon-power-bank-10k': {
    category: 'tech-electronics',
    description:
      'Slim 10,000mAh power bank with USB-C and USB-A. Charges most phones two to three times.',
  },
  'photon-bt-earphones': {
    category: 'tech-electronics',
    description:
      'True wireless earphones with a pocket charging case and about 20 hours of total play.',
  },
}

const NEW_PRODUCTS: Seed[] = [
  {
    handle: 'photon-cast-iron-casserole',
    category: 'kitchen-dining',
    title: 'Enamelled Cast Iron Casserole 26cm',
    description:
      'Heavy enamelled cast iron that holds heat for slow stews, pilau, and fresh bread. Oven safe.',
    priceKes: 8900,
    compareAt: 10500,
    image: img('1590794056226-79ef3a8147e1'),
    stock: 9,
  },
  {
    handle: 'photon-whistling-kettle',
    category: 'kitchen-dining',
    title: 'Stainless Whistling Kettle 2.5L',
    description:
      'Brushed stainless kettle for gas or electric hobs, with a heat-safe handle and loud whistle.',
    priceKes: 2600,
    image: img('1594213114663-d94db9b17125'),
    stock: 20,
  },
  {
    handle: 'photon-knife-set',
    category: 'kitchen-dining',
    title: "Chef's Knife Set (5 piece)",
    description:
      "Chef's, bread, utility, and paring knives plus a carving fork. Stainless blades, wooden handles.",
    priceKes: 4800,
    image: img('1593618998160-e34014e67546'),
    stock: 12,
  },
  {
    handle: 'photon-blender-1-5l',
    category: 'appliances',
    title: 'Countertop Blender 1.5L',
    description:
      'Glass jug, stainless blades, and three speeds plus pulse for smoothies, soups, and juice.',
    priceKes: 6500,
    image: img('1585515320310-259814833e62'),
    stock: 14,
  },
  {
    handle: 'photon-toaster-oven',
    category: 'appliances',
    title: 'Electric Toaster Oven 23L',
    description:
      'Bake, grill, and toast in one compact oven. Timer, adjustable thermostat, and a crumb tray.',
    priceKes: 9800,
    image: img('1574269909862-7e1d70bb8078'),
    stock: 8,
  },
  {
    handle: 'photon-espresso-machine',
    category: 'appliances',
    title: 'Espresso Machine with Milk Frother',
    description:
      '15-bar pump espresso maker with a steam wand for cappuccinos and lattes at home.',
    priceKes: 18500,
    compareAt: 21000,
    image: img('1608354580875-30bd4168b351'),
    stock: 5,
  },
  {
    handle: 'photon-storage-tower',
    category: 'storage-organisation',
    title: 'Slim Storage Tower',
    description:
      'Five open shelves in a slim wood-look frame. Fits beside a fridge, bath, or bed.',
    priceKes: 7400,
    image: img('1595428774223-ef52624120d2'),
    stock: 6,
  },
  {
    handle: 'photon-floating-shelf',
    category: 'storage-organisation',
    title: 'Floating Wall Shelf with Drawer',
    description:
      'Wall-mounted oak-effect shelf with a hidden drawer. Fixings included.',
    priceKes: 4200,
    image: img('1595515106969-1ce29566ff1c'),
    stock: 10,
  },
  {
    handle: 'photon-led-bath-mirror',
    category: 'bathroom',
    title: 'Round LED Bathroom Mirror 60cm',
    description:
      'Backlit round mirror with touch switch and warm or cool light. Splash resistant.',
    priceKes: 11500,
    image: img('1604709177225-055f99402ea3'),
    stock: 6,
  },
  {
    handle: 'photon-dispenser-set',
    category: 'bathroom',
    title: 'Refillable Pump Bottle Set (3)',
    description:
      'Three matte pump bottles for soap, shampoo, and lotion. Refill from bulk and save.',
    priceKes: 1900,
    image: img('1631729371254-42c2892f0e6e'),
    stock: 30,
  },
  {
    handle: 'photon-soap-bars',
    category: 'bathroom',
    title: 'Handmade Soap Bars (4 pack)',
    description:
      'Cold-process bars with shea butter. Lavender, lemongrass, oat, and unscented.',
    priceKes: 1200,
    image: img('1604335399105-a0c585fd81a1'),
    stock: 40,
  },
  {
    handle: 'photon-round-wall-mirror',
    category: 'home-decor',
    title: 'Round Gold Wall Mirror 70cm',
    description:
      'Thin brushed-gold frame that brightens a hallway or living room. Ready to hang.',
    priceKes: 7900,
    compareAt: 9500,
    image: img('1618220179428-22790b461013'),
    stock: 7,
  },
  {
    handle: 'photon-wall-clock',
    category: 'home-decor',
    title: 'Minimal Wall Clock 30cm',
    description:
      'Silent sweep movement, black frame, and clean numerals. Runs on one AA battery.',
    priceKes: 1800,
    image: img('1563861826100-9cb868fdbe1c'),
    stock: 25,
  },
  {
    handle: 'photon-scented-candle',
    category: 'home-decor',
    title: 'Scented Glass Candle',
    description:
      'Soy wax in a smoked glass jar, about 40 hours of burn. Vanilla and cedar.',
    priceKes: 1500,
    image: img('1602874801007-bd458bb1b8b6'),
    stock: 35,
  },
  {
    handle: 'photon-stick-vacuum',
    category: 'cleaning-laundry',
    title: 'Cordless Stick Vacuum',
    description:
      'Lightweight rechargeable vacuum that converts to a handheld. About 35 minutes per charge.',
    priceKes: 15900,
    image: img('1527515637462-cff94eecc1ac'),
    stock: 6,
  },
  {
    handle: 'photon-spray-bottles',
    category: 'cleaning-laundry',
    title: 'Amber Glass Spray Bottles (2)',
    description:
      'Refillable 500ml glass sprayers with adjustable nozzles. Ideal for homemade cleaners.',
    priceKes: 1400,
    image: img('1528740561666-dc2479dc08ab'),
    stock: 30,
  },
  {
    handle: 'photon-laundry-basket',
    category: 'cleaning-laundry',
    title: 'Ventilated Laundry Basket 60L',
    description:
      'Sturdy, breathable basket with comfortable side handles. Stacks when empty.',
    priceKes: 1100,
    image: img('1582735689369-4fe89db7114c'),
    stock: 40,
  },
  {
    handle: 'photon-bt-speaker',
    category: 'tech-electronics',
    title: 'Portable Bluetooth Speaker',
    description:
      'Splash-proof speaker with deep bass and about 12 hours of play time.',
    priceKes: 5500,
    image: img('1608043152269-423dbba4e7e1'),
    stock: 15,
  },
  {
    handle: 'photon-over-ear-headphones',
    category: 'tech-electronics',
    title: 'Wireless Over-ear Headphones',
    description:
      'Cushioned over-ear headphones with Bluetooth 5.3, a built-in mic, and 30-hour battery.',
    priceKes: 6900,
    image: img('1505740420928-5e560c06d30e'),
    stock: 12,
  },
]

export default async function seedPhotonCategories({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const [{ data: salesChannels }, { data: shippingProfiles }, { data: stockLocations }] =
    await Promise.all([
      query.graph({ entity: 'sales_channel', fields: ['id'] }),
      query.graph({ entity: 'shipping_profile', fields: ['id'] }),
      query.graph({ entity: 'stock_location', fields: ['id'] }),
    ])
  const salesChannel = salesChannels[0]
  const shippingProfile = shippingProfiles[0]
  const stockLocation = stockLocations[0]
  if (!salesChannel || !shippingProfile || !stockLocation) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      'Missing sales channel, shipping profile, or stock location. Run seed-photon-catalog first.'
    )
  }

  // 1. Categories
  const { data: existingCats } = await query.graph({
    entity: 'product_category',
    fields: ['id', 'handle'],
  })
  const existingByHandle = new Map(existingCats.map((c) => [c.handle, c.id as string]))

  const missing = CATEGORIES.filter((c) => !existingByHandle.has(c.handle))
  if (missing.length) {
    await createProductCategoriesWorkflow(container).run({
      input: {
        product_categories: missing.map((c) => ({
          name: c.name,
          handle: c.handle,
          description: c.description,
          is_active: true,
        })),
      },
    })
    logger.info(`Created categories: ${missing.map((c) => c.name).join(', ')}`)
  }

  const { data: cats } = await query.graph({
    entity: 'product_category',
    fields: ['id', 'handle'],
  })
  const catId = Object.fromEntries(cats.map((c) => [c.handle, c.id as string]))

  for (const [rank, c] of CATEGORIES.entries()) {
    await updateProductCategoriesWorkflow(container).run({
      input: {
        selector: { id: catId[c.handle] },
        update: {
          name: c.name,
          description: c.description,
          rank,
          is_active: true,
          metadata: { image_url: c.image },
        },
      },
    })
  }

  // 2. Existing products: move category, refresh copy
  const { data: products } = await query.graph({
    entity: 'product',
    fields: ['id', 'handle', 'metadata'],
  })
  const productByHandle = new Map(products.map((p) => [p.handle, p]))

  for (const [handle, change] of Object.entries(EXISTING)) {
    const product = productByHandle.get(handle)
    if (!product) continue
    await updateProductsWorkflow(container).run({
      input: {
        selector: { id: product.id },
        update: {
          category_ids: [catId[change.category]],
          ...(change.title ? { title: change.title } : {}),
          ...(change.description ? { description: change.description } : {}),
          ...(change.image
            ? { thumbnail: change.image, images: [{ url: change.image }] }
            : {}),
        },
      },
    })
  }
  logger.info('Moved the original products into the new categories.')

  // 3. New products
  const toCreate = NEW_PRODUCTS.filter((p) => !productByHandle.has(p.handle))
  if (toCreate.length) {
    await createProductsWorkflow(container).run({
      input: {
        products: toCreate.map((p) => ({
          title: p.title,
          handle: p.handle,
          description: p.description,
          status: ProductStatus.PUBLISHED,
          thumbnail: p.image,
          images: (p.images?.length ? p.images : [p.image]).map((url) => ({ url })),
          weight: 500,
          shipping_profile_id: shippingProfile.id,
          category_ids: [catId[p.category]],
          sales_channels: [{ id: salesChannel.id }],
          options: p.options
            ? [{ title: p.options.title, values: p.options.values }]
            : [{ title: 'Default', values: ['Default'] }],
          variants: p.variants?.map((v) => ({
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
          ],
          metadata: {
            sample_stock_hint: p.stock,
            ...(p.compareAt ? { on_offer: true, compare_at_price: p.compareAt } : {}),
          },
        })) as never,
      },
    })
    logger.info(`Created ${toCreate.length} new product(s).`)
  }

  // 4. Stock for any inventory item without a level at the location
  const { data: inventoryItems } = await query.graph({
    entity: 'inventory_item',
    fields: ['id', 'sku', 'location_levels.location_id'],
  })
  const levels = inventoryItems
    .filter(
      (item) =>
        !(item.location_levels ?? []).some((l) => l?.location_id === stockLocation.id)
    )
    .map((item) => {
      const sku = String(item.sku || '').toUpperCase()
      const seed = NEW_PRODUCTS.find((p) => sku.startsWith(p.handle.toUpperCase()))
      return {
        location_id: stockLocation.id,
        stocked_quantity: seed?.stock ?? 20,
        inventory_item_id: item.id as string,
      }
    })
  if (levels.length) {
    await createInventoryLevelsWorkflow(container).run({
      input: { inventory_levels: levels },
    })
    logger.info(`Created ${levels.length} inventory level(s).`)
  }

  // 5. Retire old categories and Medusa demo apparel
  const retired = RETIRED_CATEGORY_HANDLES.map((h) => existingByHandle.get(h)).filter(
    Boolean
  ) as string[]
  if (retired.length) {
    await deleteProductCategoriesWorkflow(container).run({ input: retired })
    logger.info(`Deleted ${retired.length} retired categor(ies).`)
  }

  const apparel = DEMO_APPAREL_HANDLES.map((h) => productByHandle.get(h)?.id).filter(
    Boolean
  ) as string[]
  if (apparel.length) {
    await updateProductsWorkflow(container).run({
      input: { selector: { id: apparel }, update: { status: ProductStatus.DRAFT } },
    })
    logger.info(`Unpublished ${apparel.length} demo apparel product(s).`)
  }

  // 6. Homepage copy: old category links, and new products on the "New" shelf
  const { data: stores } = await query.graph({ entity: 'store', fields: ['id', 'metadata'] })
  const store = stores[0]
  const metadata = (store.metadata || {}) as Record<string, unknown>
  const homepage = normalizeHomepage(metadata.homepage)
  const retiredHref = /\/category\/(beddings|kitchenware|electronics)\b/
  if (retiredHref.test(homepage.hero.cta_href)) {
    homepage.hero = {
      ...homepage.hero,
      subtitle: DEFAULT_HOMEPAGE.hero.subtitle,
      cta_label: DEFAULT_HOMEPAGE.hero.cta_label,
      cta_href: DEFAULT_HOMEPAGE.hero.cta_href,
    }
  }
  homepage.new_arrivals = {
    ...homepage.new_arrivals,
    product_handles: [
      'photon-blender-1-5l',
      'photon-storage-tower',
      'photon-wall-clock',
      'photon-dispenser-set',
    ],
  }
  homepage.featured = {
    ...homepage.featured,
    product_handles: [
      'photon-fitted-sheet-set',
      'photon-knife-set',
      'photon-espresso-machine',
      'photon-spray-bottles',
    ],
  }
  await updateStoresWorkflow(container).run({
    input: {
      selector: { id: store.id },
      update: { metadata: { ...metadata, homepage } },
    },
  })

  logger.info(`Photon catalog v2 ready: ${CATEGORIES.map((c) => c.name).join(', ')}.`)
}
