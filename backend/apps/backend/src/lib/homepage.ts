export type HomepageHero = {
  eyebrow: string
  title: string
  subtitle: string
  image_url: string
  cta_label: string
  cta_href: string
}

export type HomepageProductSection = {
  title: string
  product_handles: string[]
}

export type HomepageTrustItem = {
  title: string
  body: string
}

/**
 * A time-boxed sale (e.g. Black Friday). Prices and dates live on the Medusa
 * price list; this block only holds the storefront copy.
 */
export type HomepageCampaign = {
  enabled: boolean
  price_list_id: string
  name: string
  headline: string
  subtitle: string
  badge: string
  image_url: string
  cta_label: string
}

export type HomepageConfig = {
  hero: HomepageHero
  campaign: HomepageCampaign
  offers: HomepageProductSection
  featured: HomepageProductSection
  new_arrivals: HomepageProductSection
  bestsellers: HomepageProductSection
  trust: HomepageTrustItem[]
}

export const DEFAULT_CAMPAIGN: HomepageCampaign = {
  enabled: false,
  price_list_id: '',
  name: 'Black Friday',
  headline: 'Black Friday at Photon',
  subtitle: 'Up to 40% off across the home. Prices drop for one week only.',
  badge: 'Black Friday',
  image_url:
    'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1600&q=80',
  cta_label: 'Shop the deals',
}

export const DEFAULT_HOMEPAGE: HomepageConfig = {
  hero: {
    eyebrow: 'Photon Merchants · Nairobi',
    title: 'Quality and comfort, from OTC to your gate.',
    subtitle:
      'Kitchen, bedroom, bathroom, and tech for the home. Pay with M-Pesa. Collect at the mall or we deliver across Nairobi.',
    image_url:
      'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=1600&q=80',
    cta_label: 'Shop bedroom',
    cta_href: '/category/bedroom-bedding',
  },
  campaign: DEFAULT_CAMPAIGN,
  offers: {
    title: 'On offer',
    product_handles: [
      'photon-cotton-duvet-cover',
      'photon-frying-pan-28',
      'photon-led-desk-lamp',
      'photon-power-bank-10k',
    ],
  },
  featured: {
    title: 'Featured',
    product_handles: [
      'photon-fitted-sheet-set',
      'photon-mixing-bowls',
      'photon-bt-earphones',
      'photon-fleece-blanket',
    ],
  },
  new_arrivals: {
    title: 'New',
    product_handles: [
      'photon-glass-containers',
      'photon-microfiber-pillows',
      'photon-extension-5m',
    ],
  },
  bestsellers: {
    title: 'Best sellers',
    product_handles: [
      'photon-cotton-duvet-cover',
      'photon-dinner-plates',
      'photon-led-desk-lamp',
      'photon-frying-pan-28',
    ],
  },
  trust: [
    {
      title: 'Pay on the phone',
      body: 'M-Pesa STK push — no cards at launch',
    },
    {
      title: 'Nairobi delivery',
      body: 'Fees by area · rider or courier',
    },
    {
      title: 'Or collect',
      body: 'OTC Mall · Mon–Sat 7am–7pm',
    },
  ],
}

export function normalizeHomepage(raw: unknown): HomepageConfig {
  const input = (raw && typeof raw === 'object' ? raw : {}) as Partial<HomepageConfig>
  return {
    hero: { ...DEFAULT_HOMEPAGE.hero, ...(input.hero || {}) },
    campaign: {
      ...DEFAULT_CAMPAIGN,
      ...(input.campaign || {}),
      enabled: input.campaign?.enabled === true,
    },
    offers: {
      title: input.offers?.title || DEFAULT_HOMEPAGE.offers.title,
      product_handles:
        input.offers?.product_handles || DEFAULT_HOMEPAGE.offers.product_handles,
    },
    featured: {
      title: input.featured?.title || DEFAULT_HOMEPAGE.featured.title,
      product_handles:
        input.featured?.product_handles || DEFAULT_HOMEPAGE.featured.product_handles,
    },
    new_arrivals: {
      title: input.new_arrivals?.title || DEFAULT_HOMEPAGE.new_arrivals.title,
      product_handles:
        input.new_arrivals?.product_handles ||
        DEFAULT_HOMEPAGE.new_arrivals.product_handles,
    },
    bestsellers: {
      title: input.bestsellers?.title || DEFAULT_HOMEPAGE.bestsellers.title,
      product_handles:
        input.bestsellers?.product_handles ||
        DEFAULT_HOMEPAGE.bestsellers.product_handles,
    },
    trust:
      Array.isArray(input.trust) && input.trust.length
        ? input.trust
        : DEFAULT_HOMEPAGE.trust,
  }
}
