// Server-side billing functions — only import in Server Components
import { createClient } from '@/lib/supabaseServer'

const API = process.env.INTERNAL_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'

export type {
  Subscription,
  Invoice,
  Plan,
} from '@/lib/billing-utils'

export {
  statusLabel,
  statusColor,
  invoiceStatusLabel,
  invoiceStatusColor,
  formatCurrency,
  formatDate,
} from '@/lib/billing-utils'

async function getAccessToken(): Promise<string> {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token ?? ''
}

export async function getSubscription() {
  const token = await getAccessToken()
  if (!token) return null

  try {
    const res = await fetch(`${API}/api/billing/subscription`, {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 0 },
    })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export async function getInvoices() {
  const token = await getAccessToken()
  if (!token) return []

  try {
    const res = await fetch(`${API}/api/billing/invoices`, {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 0 },
    })
    if (!res.ok) return []
    const data = await res.json()
    return data.invoices ?? []
  } catch {
    return []
  }
}

export async function getPlans() {
  try {
    const res = await fetch(`${API}/api/plans`, { next: { revalidate: 3600 } })
    if (!res.ok) return []
    return res.json()
  } catch {
    return []
  }
}
