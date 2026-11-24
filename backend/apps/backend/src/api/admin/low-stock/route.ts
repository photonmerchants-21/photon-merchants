import { MedusaRequest, MedusaResponse } from '@medusajs/framework/http'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const threshold = Math.max(
    0,
    Number(req.query?.threshold ?? 5) || 5
  )

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data: variants } = await query.graph({
    entity: 'product_variant',
    fields: [
      'id',
      'title',
      'sku',
      'manage_inventory',
      'inventory_quantity',
      'product.id',
      'product.title',
      'product.handle',
      'product.status',
      'product.thumbnail',
    ],
  })

  const items = (variants || [])
    .filter((v) => {
      if (!v?.manage_inventory) return false
      if (v.product?.status && v.product.status !== 'published') return false
      const qty = Number(v.inventory_quantity ?? 0)
      return qty <= threshold
    })
    .map((v) => ({
      variant_id: v.id,
      sku: v.sku,
      variant_title: v.title,
      inventory_quantity: Number(v.inventory_quantity ?? 0),
      product_id: v.product?.id || null,
      product_title: v.product?.title || 'Product',
      product_handle: v.product?.handle || null,
      product_status: v.product?.status || null,
      thumbnail: v.product?.thumbnail || null,
    }))
    .sort(
      (a, b) => a.inventory_quantity - b.inventory_quantity
    )

  res.json({ threshold, count: items.length, items })
}
