import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTenantBySlug, buildWhatsAppUrl } from '@/lib/tenant'
import ShareButton from '@/components/vehicles/ShareButton'

interface Props {
  params: Promise<{ slug: string; vehicleSlug: string }>
}

// ─── Types ────────────────────────────────────────────────────────────────────

type VehicleDetail = {
  id: string
  slug: string
  title: string
  brand: string
  model: string
  version: string | null
  year_fab: number
  year_model: number
  mileage: number
  price: number
  price_negotiable: boolean
  color: string | null
  fuel: string
  transmission: string
  condition: string
  doors: number | null
  description: string | null
  features: string[]
  thumbnail_url: string | null
  photo_urls: string[]
  status: string
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, vehicleSlug } = await params

  const apiUrl = process.env.INTERNAL_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'
  const [vehicle, tenant] = await Promise.all([
    fetchVehicle(apiUrl, slug, vehicleSlug),
    getTenantBySlug(slug),
  ])

  if (!vehicle || !tenant) return { title: vehicleSlug }

  const price = vehicle.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  const title = `${vehicle.title} — ${price} | ${tenant.name}`
  const description = vehicle.description
    ?? `${vehicle.brand} ${vehicle.model} ${vehicle.year_model} com ${vehicle.mileage.toLocaleString('pt-BR')} km. ${price}.`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: vehicle.thumbnail_url ? [{ url: vehicle.thumbnail_url }] : undefined,
      type: 'website',
    },
    alternates: {
      canonical: `/${slug}/${vehicleSlug}`,
    },
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export const revalidate = 60

export default async function VehiclePage({ params }: Props) {
  const { slug, vehicleSlug } = await params

  const apiUrl = process.env.INTERNAL_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'
  const [vehicle, tenant] = await Promise.all([
    fetchVehicle(apiUrl, slug, vehicleSlug),
    getTenantBySlug(slug),
  ])

  if (!vehicle || !tenant) notFound()
  if (vehicle.status !== 'available') notFound()

  const price = vehicle.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  const waMsg = `Olá! Vi o *${vehicle.title}* no seu site e tenho interesse. Pode me dar mais informações?`
  const waUrl = buildWhatsAppUrl(tenant.phone_whatsapp, waMsg)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://revendaclick.com.br'
  const shareUrl = `${appUrl}/${slug}/${vehicleSlug}`

  // schema.org structured data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Car',
    name: vehicle.title,
    brand: { '@type': 'Brand', name: vehicle.brand },
    model: vehicle.model,
    modelDate: String(vehicle.year_model),
    mileageFromOdometer: {
      '@type': 'QuantitativeValue',
      value: vehicle.mileage,
      unitCode: 'KMT',
    },
    offers: {
      '@type': 'Offer',
      price: vehicle.price,
      priceCurrency: 'BRL',
      availability: 'https://schema.org/InStock',
      seller: { '@type': 'AutoDealer', name: tenant.name },
    },
    ...(vehicle.description ? { description: vehicle.description } : {}),
    ...(vehicle.thumbnail_url ? { image: vehicle.thumbnail_url } : {}),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="mx-auto max-w-5xl px-4 py-8">

        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-xs text-gray-500">
          <a href={`/${slug}`} className="hover:text-gray-700">{tenant.name}</a>
          <span>/</span>
          <span className="text-gray-800 font-medium truncate">{vehicle.title}</span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">

          {/* Left — Gallery */}
          <div className="space-y-4">
            {/* Main photo */}
            <div className="aspect-[4/3] overflow-hidden rounded-2xl bg-gray-100">
              {vehicle.thumbnail_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={vehicle.thumbnail_url}
                  alt={vehicle.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-gray-300">
                  <CarIcon />
                </div>
              )}
            </div>

            {/* Photo strip */}
            {vehicle.photo_urls.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {vehicle.photo_urls.slice(0, 8).map((url, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={i}
                    src={url}
                    alt={`${vehicle.title} foto ${i + 1}`}
                    className="h-16 w-24 shrink-0 rounded-lg object-cover border border-gray-200"
                  />
                ))}
              </div>
            )}

            {/* Description */}
            {vehicle.description && (
              <div className="rounded-xl border border-gray-100 bg-white p-5">
                <h2 className="mb-2 text-sm font-semibold text-gray-900">Descrição</h2>
                <p className="whitespace-pre-line text-sm text-gray-600">{vehicle.description}</p>
              </div>
            )}

            {/* Features */}
            {vehicle.features.length > 0 && (
              <div className="rounded-xl border border-gray-100 bg-white p-5">
                <h2 className="mb-3 text-sm font-semibold text-gray-900">Opcionais</h2>
                <div className="flex flex-wrap gap-2">
                  {vehicle.features.map((f) => (
                    <span
                      key={f}
                      className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700"
                    >
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right — Info + CTA */}
          <div className="space-y-4">
            {/* Price card */}
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <p className="text-3xl font-bold text-gray-900">{price}</p>
              {vehicle.price_negotiable && (
                <p className="mt-0.5 text-xs text-green-600 font-medium">Valor negociável</p>
              )}
              <h1 className="mt-3 text-lg font-semibold text-gray-800 leading-tight">
                {vehicle.title}
              </h1>

              {/* Specs grid */}
              <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                <Spec label="Ano" value={`${vehicle.year_fab}/${vehicle.year_model}`} />
                <Spec label="Km" value={vehicle.mileage.toLocaleString('pt-BR')} />
                <Spec label="Combustível" value={fuelLabel(vehicle.fuel)} />
                <Spec label="Câmbio" value={transmissionLabel(vehicle.transmission)} />
                {vehicle.color && <Spec label="Cor" value={vehicle.color} />}
                {vehicle.doors && <Spec label="Portas" value={String(vehicle.doors)} />}
                <Spec label="Estado" value={vehicle.condition === 'used' ? 'Usado' : 'Novo'} />
              </div>

              {/* CTA */}
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary mt-6 w-full flex items-center justify-center gap-2"
              >
                <WhatsAppIcon />
                Quero este veículo
              </a>

              <ShareButton url={shareUrl} title={vehicle.title} />

              <a
                href={`/${slug}`}
                className="mt-3 block text-center text-xs font-medium text-gray-500 hover:text-gray-700"
              >
                ← Ver outros veículos
              </a>
            </div>

            {/* Seller card */}
            <div className="rounded-xl border border-gray-100 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Vendido por</p>
              <p className="font-semibold text-gray-900">{tenant.name}</p>
              {tenant.description && (
                <p className="mt-1 text-xs text-gray-500 line-clamp-2">{tenant.description}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-400">{label}</p>
      <p className="font-medium text-gray-800">{value}</p>
    </div>
  )
}

function CarIcon() {
  return (
    <svg className="h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
        d="M9 17a2 2 0 11-4 0 2 2 0 014 0zm10 0a2 2 0 11-4 0 2 2 0 014 0zM1 11l2-6h18l2 6M3 11h18M5 11V7h14v4" />
    </svg>
  )
}

function WhatsAppIcon() {
  return (
    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}

// ─── Data fetching ─────────────────────────────────────────────────────────────

async function fetchVehicle(
  apiUrl: string,
  tenantSlug: string,
  vehicleSlug: string,
): Promise<VehicleDetail | null> {
  try {
    const res = await fetch(
      `${apiUrl}/api/public/${tenantSlug}/vehicles/${vehicleSlug}`,
      { next: { revalidate: 60 } },
    )
    if (!res.ok) return null
    const json = await res.json()
    return (json.data ?? json) as VehicleDetail
  } catch {
    return null
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fuelLabel(fuel: string) {
  const map: Record<string, string> = {
    flex: 'Flex', gasoline: 'Gasolina', diesel: 'Diesel',
    electric: 'Elétrico', hybrid: 'Híbrido', ethanol: 'Etanol',
  }
  return map[fuel] ?? fuel
}

function transmissionLabel(t: string) {
  const map: Record<string, string> = {
    manual: 'Manual', automatic: 'Automático', cvt: 'CVT',
    semi_automatic: 'Semi-automático', dual_clutch: 'Dupla embreagem',
  }
  return map[t] ?? t
}
