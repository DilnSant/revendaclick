import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site'

export default function robots(): MetadataRoute.Robots {
  const base = SITE_URL
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/dashboard/', '/billing/', '/settings/', '/api/', '/auth/', '/onboarding/'],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  }
}
