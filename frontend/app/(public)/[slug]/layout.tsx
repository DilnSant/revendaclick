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

export default async function StoreLayout({ children, params }: Props) {
  const { slug } = await params
  const tenant = await getTenantBySlug(slug)
  if (!tenant) notFound()

  const primaryColor = tenant.theme?.primary_color ?? '#E53935'

  return (
    <>
      {/* Inject tenant brand color as CSS variable for client components */}
      <style>{`:root { --color-primary: ${primaryColor}; }`}</style>

      {/* Store header */}
      <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          {tenant.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={tenant.logo_url} alt={tenant.name} className="h-16 w-auto object-contain" />
          ) : (
            <span className="text-lg font-heading font-bold text-graphite">{tenant.name}</span>
          )}

          <a
            href={`https://wa.me/${tenant.phone_whatsapp.replace(/\D/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary text-xs"
          >
            WhatsApp
          </a>
        </div>
      </header>

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
