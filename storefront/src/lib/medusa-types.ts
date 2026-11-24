export type MedusaImage = { id?: string; url: string }
export type MedusaCategory = {
  id: string
  name: string
  handle: string
  description?: string | null
  rank?: number | null
  metadata?: Record<string, unknown> | null
}

export type MedusaVariant = {
  id: string
  title: string
  sku?: string | null
  manage_inventory?: boolean
  allow_backorder?: boolean
  inventory_quantity?: number | null
  calculated_price?: {
    calculated_amount: number | null
    currency_code: string | null
    original_amount?: number | null
    calculated_price?: {
      price_list_id?: string | null
      price_list_type?: string | null
    } | null
  } | null
  options?: { option_id?: string; value?: string; option?: { title?: string } }[]
}

export type MedusaProduct = {
  id: string
  title: string
  handle: string
  description?: string | null
  thumbnail?: string | null
  images?: MedusaImage[]
  variants?: MedusaVariant[]
  options?: { id: string; title: string; values?: { id: string; value: string }[] }[]
  categories?: MedusaCategory[]
  metadata?: Record<string, unknown> | null
}
