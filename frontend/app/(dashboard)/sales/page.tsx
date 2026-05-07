import { notFound } from 'next/navigation'
import { getUserIdFromHeaders, getTenantForUser } from '@/lib/tenant'
import { createClient } from '@/lib/supabaseServer'
import SalesView from '@/components/sales/SalesView'
import type { Sale } from './actions'

export const metadata = { title: 'Vendas' }

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'

interface Vehicle { id: string; title: string; brand: string; model: string; price: number; status: string }
interface User    { id: string; name: string; role: string }
interface Customer { id: string; name: string }

export default async function SalesPage() {
  const userId = await getUserIdFromHeaders()
  if (!userId) notFound()

  const tenant = await getTenantForUser(userId)
  if (!tenant) notFound()

  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token ?? ''

  const [sales, vehicles, sellers, customers] = await Promise.all([
    fetchSales(token),
    fetchVehicles(token),
    fetchSellers(token),
    fetchCustomers(token),
  ])

  return (
    <SalesView
      sales={sales}
      vehicles={vehicles}
      sellers={sellers}
      customers={customers}
    />
  )
}

async function fetchSales(token: string): Promise<Sale[]> {
  if (!token) return []
  try {
    const res = await fetch(`${API}/api/sales?limit=100`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
    if (!res.ok) return []
    const json = await res.json()
    return (json.data ?? []) as Sale[]
  } catch { return [] }
}

async function fetchVehicles(token: string): Promise<Vehicle[]> {
  if (!token) return []
  try {
    const res = await fetch(`${API}/api/vehicles?limit=500`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
    if (!res.ok) return []
    const json = await res.json()
    return (json.data ?? []) as Vehicle[]
  } catch { return [] }
}

async function fetchSellers(token: string): Promise<User[]> {
  if (!token) return []
  try {
    const res = await fetch(`${API}/api/users/sellers`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
    if (!res.ok) return []
    const json = await res.json()
    return (json.data ?? []) as User[]
  } catch { return [] }
}

async function fetchCustomers(token: string): Promise<Customer[]> {
  if (!token) return []
  try {
    const res = await fetch(`${API}/api/customers?limit=500`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
    if (!res.ok) return []
    const json = await res.json()
    return (json.data ?? []) as Customer[]
  } catch { return [] }
}
