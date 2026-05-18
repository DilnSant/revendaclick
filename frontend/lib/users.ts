export type User = {
  id: string
  tenant_id: string
  role: 'owner' | 'admin' | 'seller' | 'viewer'
  name: string
  email: string
  phone: string | null
  avatar_url: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export const ROLE_LABELS: Record<string, string> = {
  owner:  'Proprietário',
  admin:  'Admin',
  seller: 'Vendedor',
  viewer: 'Visualizador',
}

export const ROLE_COLORS: Record<string, string> = {
  owner:  'bg-red-50 text-red-700',
  admin:  'bg-orange-50 text-orange-700',
  seller: 'bg-blue-50 text-blue-700',
  viewer: 'bg-gray-100 text-gray-600',
}

export function userInitials(name: string): string {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
}
