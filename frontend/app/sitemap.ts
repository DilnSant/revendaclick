import type { MetadataRoute } from 'next'
import { createServiceClient } from '@/lib/supabaseServer'
import { SITE_URL } from '@/lib/site'
import { SEGMENTOS } from '@/components/landing/segments/data'

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = SITE_URL

  // Derivado de SEGMENTOS: adicionar uma landing segmentada em data.ts já a coloca
  // no sitemap, sem lista paralela para esquecer de atualizar.
  const segmentRoutes: MetadataRoute.Sitemap = Object.values(SEGMENTOS).map((s) => ({
    url: `${base}/${s.slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.9,
  }))

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    ...segmentRoutes,
    { url: `${base}/privacidade`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/terms`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
  ]

  try {
    const supabase = createServiceClient()
    const { data: tenants } = await supabase
      .from('tenants')
      .select('slug, updated_at')
      .eq('is_active', true)
      .limit(500)

    if (!tenants) return staticRoutes

    const storeRoutes: MetadataRoute.Sitemap = tenants.flatMap((t) => [
      {
        url: `${base}/${t.slug}`,
        lastModified: new Date(t.updated_at),
        changeFrequency: 'daily' as const,
        priority: 0.8,
      },
    ])

    return [...staticRoutes, ...storeRoutes]
  } catch {
    return staticRoutes
  }
}
