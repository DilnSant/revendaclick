import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTenantFromHeaders, getTenantById } from '@/lib/tenant'

interface Props {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const ctx = await getTenantFromHeaders()
  if (!ctx) return { title: slug }

  const tenant = await getTenantById(ctx.id)

  return {
    title: { default: tenant?.name ?? slug, template: `%s | ${tenant?.name ?? slug}` },
    description: tenant?.seo_description ?? tenant?.description ?? undefined,
    openGraph: {
      title: tenant?.seo_title ?? tenant?.name ?? slug,
      description: tenant?.seo_description ?? tenant?.description ?? undefined,
      images: tenant?.logo_url ? [{ url: tenant.logo_url }] : undefined,
      type: 'website',
    },
  }
}

/**
 * Layout for all public store pages.
 *
 * The middleware already resolved the tenant from the slug and injected it into
 * the request headers. We read those headers here to gate the layout — if the
 * tenant is missing (middleware let a bad slug through somehow), show 404.
 *
 * We then fetch the FULL tenant row (cached via React cache) and pass it down.
 */
export default async function StoreLayout({ children, params }: Props) {
  const ctx = await getTenantFromHeaders()

  // Middleware should always resolve valid tenants, but guard defensively.
  if (!ctx) notFound()

  const tenant = await getTenantById(ctx.id)
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
            <img src={tenant.logo_url} alt={tenant.name} className="h-8 w-auto object-contain" />
          ) : (
            <span className="text-lg font-bold text-gray-900">{tenant.name}</span>
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
          <a href="https://revendaclick.app" className="font-medium text-primary hover:underline">
            RevendaClick
          </a>
        </p>
      </footer>
    </>
  )
}
