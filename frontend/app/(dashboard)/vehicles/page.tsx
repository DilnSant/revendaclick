import { notFound } from 'next/navigation'
import { getUserIdFromHeaders, getTenantForUser, getUsageFromAPI } from '@/lib/tenant'
import { createClient } from '@/lib/supabaseServer'
import type { Vehicle } from '@/lib/vehicles'
import VehicleGrid from '@/components/vehicles/VehicleGrid'

export const metadata = { title: 'Veículos' }

interface Props {
  searchParams: Promise<{ status?: string; brand?: string; condition?: string }>
}

export default async function VehiclesPage({ searchParams }: Props) {
  const query = await searchParams

  const userId = await getUserIdFromHeaders()
  if (!userId) notFound()

  const tenant = await getTenantForUser(userId)
  if (!tenant) notFound()

  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token ?? ''

  const [{ vehicles, total }, usage] = await Promise.all([
    fetchVehicles(token, query),
    getUsageFromAPI(token),
  ])

  return (
    <div className="flex h-full flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-graphite">Veículos</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {total} veículo{total !== 1 ? 's' : ''} cadastrado{total !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <VehicleGrid vehicles={vehicles} total={total} usage={usage} />
    </div>
  )
}

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'

async function fetchVehicles(
  token: string,
  filter: { status?: string; brand?: string; condition?: string },
): Promise<{ vehicles: Vehicle[]; total: number }> {
  const params = new URLSearchParams({ limit: '100' })
  if (filter.status) params.set('status', filter.status)
  if (filter.brand) params.set('brand', filter.brand)
  if (filter.condition) params.set('condition', filter.condition)

  try {
    const res = await fetch(`${API}/api/vehicles?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
    if (!res.ok) return { vehicles: [], total: 0 }
    const json = await res.json()
    return {
      vehicles: (json.data ?? []) as Vehicle[],
      total: (json.meta?.total ?? 0) as number,
    }
  } catch {
    return { vehicles: [], total: 0 }
  }
}
