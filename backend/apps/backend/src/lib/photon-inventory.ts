import { ContainerRegistrationKeys, Modules } from '@medusajs/framework/utils'
import type { PhotonOrder } from './photon-orders'

/**
 * Decrement Medusa inventory for paid Photon orders (once).
 * Failed / unpaid payments never call this.
 */
export async function decrementStockForPaidOrder(
  scope: {
    resolve: (key: string) => unknown
  },
  order: PhotonOrder
): Promise<{ adjusted: number; skipped: string[] }> {
  const skipped: string[] = []
  if (order.stockDecremented) {
    return { adjusted: 0, skipped: ['already_decremented'] }
  }

  const query = scope.resolve(ContainerRegistrationKeys.QUERY) as {
    graph: (args: unknown) => Promise<{ data: unknown[] }>
  }
  const inventory = scope.resolve(Modules.INVENTORY) as {
    adjustInventory: (
      inventoryItemId: string,
      locationId: string,
      adjustment: number
    ) => Promise<unknown>
  }

  const { data: locations } = await query.graph({
    entity: 'stock_location',
    fields: ['id'],
  })
  const locationId = (locations?.[0] as { id?: string } | undefined)?.id
  if (!locationId) {
    return { adjusted: 0, skipped: ['no_stock_location'] }
  }

  let adjusted = 0
  for (const line of order.lines) {
    const variantId = line.variantId
    if (!variantId) {
      skipped.push(`${line.title}:no_variant_id`)
      continue
    }
    const qty = Math.max(0, Number(line.quantity) || 0)
    if (!qty) continue

    const { data: variants } = await query.graph({
      entity: 'product_variant',
      fields: ['id', 'manage_inventory', 'inventory_items.inventory_item_id'],
      filters: { id: variantId },
    })

    const variant = variants?.[0] as
      | {
          manage_inventory?: boolean
          inventory_items?: { inventory_item_id?: string }[]
        }
      | undefined

    if (!variant) {
      skipped.push(`${variantId}:not_found`)
      continue
    }
    if (variant.manage_inventory === false) {
      skipped.push(`${variantId}:unmanaged`)
      continue
    }

    const inventoryItemId = variant.inventory_items?.[0]?.inventory_item_id
    if (!inventoryItemId) {
      skipped.push(`${variantId}:no_inventory_item`)
      continue
    }

    try {
      await inventory.adjustInventory(inventoryItemId, locationId, -qty)
      adjusted += 1
    } catch (err) {
      skipped.push(
        `${variantId}:${err instanceof Error ? err.message : 'adjust_failed'}`
      )
    }
  }

  return { adjusted, skipped }
}
