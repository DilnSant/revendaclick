import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTenantBySlug, getPublicStoreContact, buildWhatsAppUrl } from '@/lib/tenant'

interface Props {
  params: Promise<{ slug: string }>
  searchParams: Promise<{
    marca?: string
    condicao?: string
    combustivel?: string
    min?: string
    max?: string
    ordenar?: string
    busca?: string
    pagina?: string
  }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const tenant = await getTenantBySlug(slug)
  if (!tenant) return { title: slug }
  const title = tenant.seo_title ?? `${tenant.name} | Veículos`
  const description = tenant.seo_description ?? tenant.description ?? `Confira os veículos disponíveis em ${tenant.name}.`
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: tenant.logo_url ? [{ url: tenant.logo_url }] : undefined,
    },
    alternates: { canonical: `/${slug}` },
  }
}

export const revalidate = 60

export default async function StorePage({ params, searchParams }: Props) {
  const { slug } = await params
  const query    = await searchParams

  const tenant = await getTenantBySlug(slug)
  if (!tenant) notFound()

  const [vehiclesRes, publicContact] = await Promise.all([
    fetchVehicles(slug, query),
    getPublicStoreContact(tenant.id),
  ])

  const { vehicles, total } = vehiclesRes
  const city  = publicContact?.location
    ? null
    : (tenant.address as { city?: string } | null)?.city
  const state = publicContact?.location
    ? null
    : (tenant.address as { state?: string } | null)?.state

  const contactWhatsApp = publicContact?.public_whatsapp || tenant.phone_whatsapp

  const page    = Math.max(1, Number(query.pagina ?? '1'))
  const perPage = 12
  const pages   = Math.ceil(total / perPage)

  // Build filter URL helper — keeps all current params, overrides the changed one
  function filterUrl(overrides: Record<string, string | undefined>) {
    const p: Record<string, string> = {}
    if (query.marca)       p.marca       = query.marca
    if (query.condicao)    p.condicao    = query.condicao
    if (query.combustivel) p.combustivel = query.combustivel
    if (query.min)         p.min         = query.min
    if (query.max)         p.max         = query.max
    if (query.ordenar)     p.ordenar     = query.ordenar
    if (query.busca)       p.busca       = query.busca
    for (const [k, v] of Object.entries(overrides)) {
      if (v === undefined || v === '') delete p[k]
      else p[k] = v
    }
    const qs = new URLSearchParams(p).toString()
    return `/${slug}${qs ? '?' + qs : ''}`
  }

  return (
    <>
      {/* Hero */}
      <section className="border-b border-gray-100 bg-white py-8">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-6">
            {tenant.logo_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={tenant.logo_url}
                alt={`Logo ${tenant.name}`}
                className="h-16 w-16 rounded-xl object-contain border border-gray-100 bg-gray-50 p-1 sm:h-20 sm:w-20"
              />
            )}
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">{tenant.name}</h1>
              {tenant.description && (
                <p className="mt-1 text-sm text-gray-500">{tenant.description}</p>
              )}
              {publicContact?.location ? (
                <p className="mt-1 flex items-center gap-1 text-xs text-gray-400">
                  <LocationIcon />
                  {publicContact.location}
                </p>
              ) : (city || state) ? (
                <p className="mt-1 flex items-center gap-1 text-xs text-gray-400">
                  <LocationIcon />
                  {[city, state].filter(Boolean).join(', ')}
                </p>
              ) : null}

              {/* Extra contact links */}
              <div className="mt-2 flex flex-wrap items-center gap-3">
                {publicContact?.instagram && (
                  <a
                    href={`https://instagram.com/${publicContact.instagram.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
                  >
                    <InstagramIcon />
                    @{publicContact.instagram.replace('@', '')}
                  </a>
                )}
                {publicContact?.public_phone && (
                  <a
                    href={`tel:${publicContact.public_phone.replace(/\D/g, '')}`}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    {publicContact.public_phone}
                  </a>
                )}
                {publicContact?.public_email && (
                  <a
                    href={`mailto:${publicContact.public_email}`}
                    className="text-xs text-gray-500 hover:text-gray-700 truncate max-w-xs"
                  >
                    {publicContact.public_email}
                  </a>
                )}
              </div>
            </div>

            <div className="flex flex-col items-start gap-2 sm:ml-auto sm:items-end">
              <a
                href={buildWhatsAppUrl(contactWhatsApp, `Olá, ${tenant.name}! Estou acessando o site de vocês.`)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark transition-colors"
              >
                <WhatsAppIcon />
                Falar via WhatsApp
              </a>
              {publicContact?.groups_link && (
                <a
                  href={publicContact.groups_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <WhatsAppIcon />
                  Entrar no grupo de ofertas
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Filters + listing */}
      <div className="mx-auto max-w-7xl px-4 py-6">

        {/* Search + sort bar */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <form method="GET" action={`/${slug}`} className="flex flex-1 items-center gap-2">
            {/* preserve other filters */}
            {query.marca       && <input type="hidden" name="marca"       value={query.marca}       />}
            {query.condicao    && <input type="hidden" name="condicao"    value={query.condicao}    />}
            {query.combustivel && <input type="hidden" name="combustivel" value={query.combustivel} />}
            {query.min         && <input type="hidden" name="min"         value={query.min}         />}
            {query.max         && <input type="hidden" name="max"         value={query.max}         />}
            {query.ordenar     && <input type="hidden" name="ordenar"     value={query.ordenar}     />}
            <input
              type="search"
              name="busca"
              defaultValue={query.busca ?? ''}
              placeholder="Buscar por marca, modelo..."
              className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
            <button type="submit" className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary/90">
              Buscar
            </button>
          </form>

          <a
            href={filterUrl({ ordenar: query.ordenar === 'price_asc'  ? undefined : 'price_asc'  })}
            className={`hidden sm:flex items-center gap-1 rounded-xl border px-3 py-2 text-xs font-medium transition-colors ${query.ordenar === 'price_asc'  ? 'border-primary bg-primary/10 text-primary' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
          >Menor preço</a>
          <a
            href={filterUrl({ ordenar: query.ordenar === 'price_desc' ? undefined : 'price_desc' })}
            className={`hidden sm:flex items-center gap-1 rounded-xl border px-3 py-2 text-xs font-medium transition-colors ${query.ordenar === 'price_desc' ? 'border-primary bg-primary/10 text-primary' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
          >Maior preço</a>
          <a
            href={filterUrl({ ordenar: query.ordenar === 'year_desc'  ? undefined : 'year_desc'  })}
            className={`hidden sm:flex items-center gap-1 rounded-xl border px-3 py-2 text-xs font-medium transition-colors ${query.ordenar === 'year_desc'  ? 'border-primary bg-primary/10 text-primary' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
          >Mais novo</a>
        </div>

        {/* Filter chips */}
        <div className="mb-4 flex flex-wrap gap-2">
          {/* Condition */}
          {(['used', 'new'] as const).map(c => (
            <a
              key={c}
              href={filterUrl({ condicao: query.condicao === c ? undefined : c, pagina: undefined })}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${query.condicao === c ? 'border-primary bg-primary text-white' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'}`}
            >
              {c === 'used' ? 'Usado' : 'Novo'}
            </a>
          ))}

          {/* Fuel */}
          {(['flex', 'gasoline', 'diesel', 'electric', 'hybrid'] as const).map(f => (
            <a
              key={f}
              href={filterUrl({ combustivel: query.combustivel === f ? undefined : f, pagina: undefined })}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${query.combustivel === f ? 'border-primary bg-primary text-white' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'}`}
            >
              {FUEL_LABELS[f]}
            </a>
          ))}

          {/* Clear all filters */}
          {(query.marca || query.condicao || query.combustivel || query.min || query.max || query.ordenar || query.busca) && (
            <a
              href={`/${slug}`}
              className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-100"
            >
              Limpar filtros ✕
            </a>
          )}
        </div>

        {/* Results count */}
        <p className="mb-4 text-sm text-gray-500">
          {total} veículo{total !== 1 ? 's' : ''} encontrado{total !== 1 ? 's' : ''}
        </p>

        {/* Vehicle grid */}
        {vehicles.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 py-20 text-center">
            <div className="mb-4 text-5xl text-gray-200">
              <CarEmptyIcon />
            </div>
            <p className="text-base font-semibold text-gray-400">Nenhum veículo encontrado</p>
            <p className="mt-1 text-sm text-gray-400">Tente remover os filtros ou use outros termos de busca.</p>
            <a href={`/${slug}`} className="mt-4 rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
              Ver todos os veículos
            </a>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {vehicles.map((v) => (
              <VehicleCard
                key={v.id}
                vehicle={v}
                slug={slug}
                whatsapp={contactWhatsApp}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {pages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-2">
            {page > 1 && (
              <a href={filterUrl({ pagina: String(page - 1) })}
                 className="rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
                ← Anterior
              </a>
            )}
            <span className="text-sm text-gray-500">
              Página {page} de {pages}
            </span>
            {page < pages && (
              <a href={filterUrl({ pagina: String(page + 1) })}
                 className="rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
                Próxima →
              </a>
            )}
          </div>
        )}
      </div>
    </>
  )
}

// ─── Vehicle Card ─────────────────────────────────────────────────────────────

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
  condition: string
  transmission: string
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
    <article className="group overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-md">
      <a href={`/${slug}/${v.slug}`} className="block">
        <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
          {v.thumbnail_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={v.thumbnail_url}
              alt={v.title}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-gray-200">
              <CarEmptyIcon />
            </div>
          )}
          <span className={`absolute left-3 top-3 rounded-full px-2 py-0.5 text-xs font-medium ${v.condition === 'new' ? 'bg-green-500 text-white' : 'bg-gray-700 text-white'}`}>
            {v.condition === 'new' ? 'Novo' : 'Usado'}
          </span>
        </div>

        <div className="p-4">
          <p className="truncate text-sm font-semibold text-gray-900">{v.title}</p>
          <p className="mt-0.5 text-xs text-gray-500">
            {v.year_model} &bull; {v.mileage.toLocaleString('pt-BR')} km &bull; {FUEL_LABELS[v.fuel] ?? v.fuel}
          </p>
          <p className="mt-2 text-lg font-bold" style={{ color: 'var(--color-primary)' }}>{price}</p>
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
          className="flex w-full items-center justify-center gap-2 rounded-xl py-2 text-xs font-semibold text-white transition-colors hover:opacity-90"
          style={{ backgroundColor: 'var(--color-primary)' }}
        >
          <WhatsAppIcon />
          Tenho interesse
        </a>
      </div>
    </article>
  )
}

// ─── Data fetching ─────────────────────────────────────────────────────────────

async function fetchVehicles(
  tenantSlug: string,
  q: Record<string, string | undefined>,
) {
  const apiUrl = process.env.INTERNAL_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'
  const page   = Math.max(1, Number(q.pagina ?? '1'))
  const limit  = 12
  const params = new URLSearchParams({ limit: String(limit), offset: String((page - 1) * limit) })
  if (q.marca)       params.set('brand', q.marca)
  if (q.condicao)    params.set('condition', q.condicao)
  if (q.combustivel) params.set('fuel', q.combustivel)
  if (q.min)         params.set('min_price', q.min)
  if (q.max)         params.set('max_price', q.max)
  if (q.ordenar)     params.set('sort', q.ordenar)
  if (q.busca)       params.set('search', q.busca)

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

// ─── Constants ────────────────────────────────────────────────────────────────

const FUEL_LABELS: Record<string, string> = {
  flex: 'Flex', gasoline: 'Gasolina', diesel: 'Diesel',
  electric: 'Elétrico', hybrid: 'Híbrido', ethanol: 'Etanol',
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function LocationIcon() {
  return (
    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
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

function InstagramIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
    </svg>
  )
}

function CarEmptyIcon() {
  return (
    <svg className="h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
        d="M9 17a2 2 0 11-4 0 2 2 0 014 0zm10 0a2 2 0 11-4 0 2 2 0 014 0zM1 11l2-6h18l2 6M3 11h18M5 11V7h14v4" />
    </svg>
  )
}
