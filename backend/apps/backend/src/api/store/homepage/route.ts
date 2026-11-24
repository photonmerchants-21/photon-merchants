import { MedusaRequest, MedusaResponse } from '@medusajs/framework/http'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'
import { resolveCampaign } from '../../../lib/campaign'
import { normalizeHomepage } from '../../../lib/homepage'

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data: stores } = await query.graph({
    entity: 'store',
    fields: ['id', 'metadata'],
  })

  const metadata = (stores[0]?.metadata || {}) as Record<string, unknown>
  const homepage = normalizeHomepage(metadata.homepage)
  const campaign = await resolveCampaign(query as never, homepage.campaign)

  res.json({ homepage: { ...homepage, campaign } })
}
