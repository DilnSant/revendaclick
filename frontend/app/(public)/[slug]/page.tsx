import { notFound } from 'next/navigation'
import { getTenantBySlug, buildWhatsAppUrl } from '@/lib/tenant'

interface Props {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ marca?: string; condicao?: string; min?: string; max?: string; pagina?: string }>
}

export const revalidate = 60

export default async function StorePage({ params, searchParams }: Props) {
  const { slug } = await params
  const query = await searchParams

  const [tenant, vehiclesRes] = await Promise.all([
    getTenantBySlug(slug),
    fetchVehicles(slug, query),
  ])

  if (!tenant) notFound()

  const { vehicles, total } = vehiclesRes

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Store hero */}
      <section className="mb-10">
        <h1 className="text-3xl font-bold text-gray-900">{tenant.name}</h1>
        {tenant.description && (
          <p className="mt-2 text-gray-600">{tenant.description}</p>
        )}
      </section>

      {/* Vehicle grid */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            {total} veículo{total !== 1 ? 's' : ''} disponível{total !== 1 ? 'is' : ''}
          </p>
        </div>

        {vehicles.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 py-20 text-center">
            <p className="text-gray-400">Nenhum veículo disponível no momento.</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {vehicles.map((v) => (
              <VehicleCard
                key={v.id}
                vehicle={v}
                slug={slug}
                whatsapp={tenant.phone_whatsapp}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

// ─── Vehicle card component ───────────────────────────────────────────────────

type Vehicle = {
  id: string
  slug: string
  title: string
  brand: string
  model: string
  year_model: number
  mileage: number
  price: number
  price_negotiable: boolean
  thumbnail_url: string | null
  fuel: string
}

function VehicleCard({
  vehicle: v,
  slug,
  whatsapp,
}: {
  vehicle: Vehicle
  slug: string
  whatsapp: string
}) {
  const waMsg = `Olá! Vi o ${v.title} no site e tenho interesse. Pode me dar mais informações?`
  const waUrl = buildWhatsAppUrl(whatsapp, waMsg)
  const price = v.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  return (
    <article className="card group overflow-hidden transition-shadow hover:shadow-card-hover">
      <a href={`/${slug}/${v.slug}`} className="block">
        <div className="aspect-[4/3] overflow-hidden bg-gray-100">
          {v.thumbnail_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={v.thumbnail_url}
              alt={v.title}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-gray-300">
              <CarIcon />
            </div>
          )}
        </div>

        <div className="p-4">
          <p className="truncate text-sm font-semibold text-gray-900">{v.title}</p>
          <p className="mt-0.5 text-xs text-gray-500">
            {v.year_model} &bull; {v.mileage.toLocaleString('pt-BR')} km &bull; {fuelLabel(v.fuel)}
          </p>
          <p className="mt-2 text-lg font-bold text-primary">{price}</p>
          {v.price_negotiable && (
            <p className="text-xs text-gray-400">Valor negociável</p>
          )}
        </div>
      </a>

      <div className="px-4 pb-4">
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary w-full text-xs"
        >
          Tenho interesse
        </a>
      </div>
    </article>
  )
}

// ─── Data fetching ─────────────────────────────────────────────────────────────

async function fetchVehicles(
  tenantSlug: string,
  q: Record<string, string | undefined>
) {
  const apiUrl = process.env.INTERNAL_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'
  const params = new URLSearchParams({ status: 'available', limit: '12' })
  if (q.marca) params.set('brand', q.marca)
  if (q.condicao) params.set('condition', q.condicao)
  if (q.min) params.set('min_price', q.min)
  if (q.max) params.set('max_price', q.max)
  if (q.pagina) params.set('offset', String((Number(q.pagina) - 1) * 12))

  try {
    const res = await fetch(`${apiUrl}/api/public/${tenantSlug}/vehicles?${params}`, {
      next: { revalidate: 60 },
    })
    if (!res.ok) return { vehicles: [], total: 0 }
    const json = await res.json()
    return { vehicles: (json.data ?? []) as Vehicle[], total: json.meta?.total ?? 0 }
  } catch {
    return { vehicles: [], total: 0 }
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

function CarIcon() {
  return (
    <svg className="h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
        d="M9 17a2 2 0 11-4 0 2 2 0 014 0zm10 0a2 2 0 11-4 0 2 2 0 014 0zM1 11l2-6h18l2 6M3 11h18M5 11V7h14v4" />
    </svg>
  )
}
