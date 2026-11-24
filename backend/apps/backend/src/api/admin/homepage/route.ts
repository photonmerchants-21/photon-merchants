import { MedusaRequest, MedusaResponse } from '@medusajs/framework/http'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'
import { updateStoresWorkflow } from '@medusajs/medusa/core-flows'
import {
  DEFAULT_HOMEPAGE,
  normalizeHomepage,
  type HomepageConfig,
} from '../../../lib/homepage'

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data: stores } = await query.graph({
    entity: 'store',
    fields: ['id', 'metadata'],
  })

  const store = stores[0]
  if (!store) {
    res.status(404).json({ message: 'Store not found' })
    return
  }

  const metadata = (store.metadata || {}) as Record<string, unknown>
  res.json({
    store_id: store.id,
    homepage: normalizeHomepage(metadata.homepage),
    defaults: DEFAULT_HOMEPAGE,
  })
}

type HomepageBody = { homepage?: HomepageConfig }

export async function POST(req: MedusaRequest<HomepageBody>, res: MedusaResponse) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data: stores } = await query.graph({
    entity: 'store',
    fields: ['id', 'metadata'],
  })

  const store = stores[0]
  if (!store) {
    res.status(404).json({ message: 'Store not found' })
    return
  }

  const homepage = normalizeHomepage(req.body?.homepage)
  const previous = (store.metadata || {}) as Record<string, unknown>

  await updateStoresWorkflow(req.scope).run({
    input: {
      selector: { id: store.id as string },
      update: {
        metadata: {
          ...previous,
          homepage,
        },
      },
    },
  })

  res.json({ homepage })
}
