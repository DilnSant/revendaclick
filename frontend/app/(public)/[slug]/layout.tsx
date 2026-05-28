import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTenantBySlug } from '@/lib/tenant'

interface Props {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const tenant = await getTenantBySlug(slug)
  if (!tenant) return { title: slug }

  return {
    title: { default: tenant.name, template: `%s | ${tenant.name}` },
    description: tenant.seo_description ?? tenant.description ?? undefined,
    openGraph: {
      title: tenant.seo_title ?? tenant.name,
      description: tenant.seo_description ?? tenant.description ?? undefined,
      images: tenant.logo_url ? [{ url: tenant.logo_url }] : undefined,
      type: 'website',
    },
  }
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace('#', '').padEnd(6, '0')
  return {
    r: parseInt(h.slice(0, 2), 16) || 229,
    g: parseInt(h.slice(2, 4), 16) || 57,
    b: parseInt(h.slice(4, 6), 16) || 53,
  }
}

function darken(r: number, g: number, b: number, factor = 0.83): string {
  return `${Math.round(r * factor)} ${Math.round(g * factor)} ${Math.round(b * factor)}`
}

export default async function StoreLayout({ children, params }: Props) {
  const { slug } = await params
  const tenant = await getTenantBySlug(slug)
  if (!tenant) notFound()

  const hexColor = (tenant.theme as { primary_color?: string } | null)?.primary_color ?? '#E53935'
  const { r, g, b } = hexToRgb(hexColor)
  const darkChannels = darken(r, g, b)

  return (
    <>
      {/* Override Tailwind primary channel variables + hex variable for this tenant */}
      <style>{`
        :root {
          --color-primary: ${hexColor};
          --primary: ${r} ${g} ${b};
          --primary-dark: ${darkChannels};
        }
      `}</style>

      <main>{children}</main>

      <footer className="mt-16 border-t border-gray-100 bg-white py-8 text-center text-sm text-gray-500">
        <p>
          {tenant.name} &mdash; Powered by{' '}
          <a href="https://revendaclick.com.br" className="font-medium text-primary hover:underline">
            RevendaClick
          </a>
        </p>
      </footer>
    </>
  )
}
