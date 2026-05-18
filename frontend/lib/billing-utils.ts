// Pure utility functions for billing — safe to import in client components

export function statusLabel(status: string): string {
  const map: Record<string, string> = {
    active: 'Ativa',
    trialing: 'Trial',
    past_due: 'Pagamento atrasado',
    canceled: 'Cancelada',
    paused: 'Pausada',
  }
  return map[status] ?? status
}

export function statusColor(status: string): string {
  switch (status) {
    case 'active':   return 'text-green-700 bg-green-100'
    case 'trialing': return 'text-blue-700 bg-blue-100'
    case 'past_due': return 'text-orange-700 bg-orange-100'
    case 'canceled':
    case 'paused':   return 'text-red-700 bg-red-100'
    default:         return 'text-gray-700 bg-gray-100'
  }
}

export function invoiceStatusLabel(status: string): string {
  const map: Record<string, string> = {
    pending:   'Pendente',
    confirmed: 'Confirmado',
    received:  'Recebido',
    overdue:   'Atrasado',
    refunded:  'Reembolsado',
    canceled:  'Cancelado',
  }
  return map[status] ?? status
}

export function invoiceStatusColor(status: string): string {
  switch (status) {
    case 'received':
    case 'confirmed':  return 'text-green-700 bg-green-100'
    case 'pending':    return 'text-yellow-700 bg-yellow-100'
    case 'overdue':    return 'text-orange-700 bg-orange-100'
    case 'refunded':   return 'text-purple-700 bg-purple-100'
    case 'canceled':   return 'text-red-700 bg-red-100'
    default:           return 'text-gray-700 bg-gray-100'
  }
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

export function formatDate(dateStr?: string): string {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleDateString('pt-BR')
}

export type Plan = {
  id: string
  name: string
  display_name: string
  max_vehicles: number
  max_users: number
  max_leads: number
  price_monthly: number
  price_yearly: number
  features: string[]
  is_active: boolean
}

export type Subscription = {
  id: string
  tenant_id: string
  plan_id: string
  plan_name: string
  plan_display: string
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'paused'
  billing_cycle: 'monthly' | 'yearly'
  current_period_end: string
  trial_ends_at?: string
  grace_until?: string
  asaas_subscription_id?: string
  asaas_payment_link?: string
  price_monthly: number
  price_yearly: number
  trial_days_left?: number
  is_trialing: boolean
  is_active: boolean
  is_past_due: boolean
  is_canceled: boolean
  is_blocked: boolean
}

export type Invoice = {
  id: string
  asaas_payment_id: string
  value: number
  status: 'pending' | 'confirmed' | 'received' | 'overdue' | 'refunded' | 'canceled'
  billing_type?: string
  due_date?: string
  paid_at?: string
  invoice_url?: string
  description?: string
}
