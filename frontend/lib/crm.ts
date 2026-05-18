// ─── Lead types ───────────────────────────────────────────────────────────────

export type LeadStatus =
  | 'new'
  | 'in_progress'
  | 'proposal'
  | 'closed_won'
  | 'closed_lost'

export type LeadSource =
  | 'marketplace'
  | 'whatsapp'
  | 'referral'
  | 'direct'
  | 'social'
  | 'crm'
  | 'other'

export type Lead = {
  id: string
  tenant_id: string
  vehicle_id: string | null
  seller_id: string | null
  name: string
  phone: string
  email: string | null
  message: string | null
  status: LeadStatus
  source: LeadSource
  notes: string | null
  utm_source: string | null
  utm_medium: string | null
  utm_campaign: string | null
  kanban_position: number
  contacted_at: string | null
  closed_at: string | null
  follow_up_at: string | null
  follow_up_note: string | null
  created_at: string
  updated_at: string
}

export type LeadActivity = {
  id: string
  tenant_id: string
  lead_id: string
  user_id: string | null
  type: ActivityType
  description: string
  metadata?: Record<string, unknown>
  created_at: string
}

export type Seller = {
  id: string
  tenant_id: string
  user_id: string
  display_name: string
  phone_whatsapp: string
  bio: string | null
  photo_url: string | null
  is_active: boolean
}

export type ActivityType = 'note' | 'call' | 'whatsapp' | 'email' | 'status_change' | 'other'

// ─── Status config ────────────────────────────────────────────────────────────

export const STATUS_CONFIG: Record<
  LeadStatus,
  { label: string; columnBg: string; columnBorder: string; badge: string; dot: string }
> = {
  new: {
    label: 'Novo',
    columnBg: 'bg-blue-50/60',
    columnBorder: 'border-blue-200',
    badge: 'bg-blue-100 text-blue-700',
    dot: 'bg-blue-500',
  },
  in_progress: {
    label: 'Em atendimento',
    columnBg: 'bg-yellow-50/60',
    columnBorder: 'border-yellow-200',
    badge: 'bg-yellow-100 text-yellow-700',
    dot: 'bg-yellow-500',
  },
  proposal: {
    label: 'Proposta',
    columnBg: 'bg-purple-50/60',
    columnBorder: 'border-purple-200',
    badge: 'bg-purple-100 text-purple-700',
    dot: 'bg-purple-500',
  },
  closed_won: {
    label: 'Fechado',
    columnBg: 'bg-green-50/60',
    columnBorder: 'border-green-200',
    badge: 'bg-green-100 text-green-700',
    dot: 'bg-green-500',
  },
  closed_lost: {
    label: 'Perdido',
    columnBg: 'bg-gray-50/60',
    columnBorder: 'border-gray-200',
    badge: 'bg-gray-100 text-gray-500',
    dot: 'bg-gray-400',
  },
}

export const KANBAN_COLUMNS: LeadStatus[] = [
  'new',
  'in_progress',
  'proposal',
  'closed_won',
  'closed_lost',
]

// ─── Activity config ──────────────────────────────────────────────────────────

export const ACTIVITY_CONFIG: Record<ActivityType, { label: string; icon: string }> = {
  note:          { label: 'Nota',           icon: '📝' },
  call:          { label: 'Ligação',        icon: '📞' },
  whatsapp:      { label: 'WhatsApp',       icon: '💬' },
  email:         { label: 'Email',          icon: '📧' },
  status_change: { label: 'Status alterado', icon: '🔄' },
  other:         { label: 'Outro',          icon: '📌' },
}

// ─── Source labels ────────────────────────────────────────────────────────────

export const SOURCE_LABELS: Record<LeadSource, string> = {
  marketplace: 'Marketplace',
  whatsapp:    'WhatsApp',
  referral:    'Indicação',
  direct:      'Direto',
  social:      'Social',
  crm:         'CRM',
  other:       'Outro',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60_000)
  if (m < 1)  return 'agora'
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  const d = Math.floor(h / 24)
  if (d < 30) return `${d}d`
  return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

export function whatsAppUrl(phone: string, name: string): string {
  const clean = phone.replace(/\D/g, '')
  const msg = encodeURIComponent(
    `Olá ${name}, vimos seu interesse e gostaríamos de ajudar. Como podemos falar com você?`
  )
  return `https://wa.me/${clean}?text=${msg}`
}

export function sellerInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
}
