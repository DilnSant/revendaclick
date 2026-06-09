import type { MetadataRoute } from 'next'
import { createServiceClient } from '@/lib/supabaseServer'

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'https://revendaclick.com.br'

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
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
