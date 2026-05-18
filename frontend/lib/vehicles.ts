// ─── Vehicle types ─────────────────────────────────────────────────────────────

export type VehicleStatus = 'available' | 'reserved' | 'sold' | 'inactive'
export type VehicleCondition = 'new' | 'used' | 'certified'
export type FuelType = 'flex' | 'gasoline' | 'diesel' | 'electric' | 'hybrid' | 'ethanol'
export type TransmissionType = 'manual' | 'automatic' | 'cvt' | 'automated'

export type Vehicle = {
  id: string
  tenant_id: string
  seller_id: string | null
  title: string
  brand: string
  model: string
  version: string | null
  year_model: number
  year_manufacture: number
  color: string | null
  mileage: number
  fuel: FuelType
  transmission: TransmissionType
  doors: number | null
  engine: string | null
  horsepower: number | null
  features: string[]
  price: number
  price_negotiable: boolean
  fipe_price: number | null
  status: VehicleStatus
  condition: VehicleCondition
  is_featured: boolean
  images: string[]
  thumbnail_url: string | null
  video_url: string | null
  slug: string
  description: string | null
  plate_last_digits: string | null
  views_count: number
  leads_count: number
  created_at: string
  updated_at: string
}

export type CreateVehiclePayload = {
  title: string
  brand: string
  model: string
  version?: string
  year_model: number
  year_manufacture: number
  color?: string
  mileage: number
  fuel: FuelType
  transmission: TransmissionType
  doors?: number
  engine?: string
  horsepower?: number
  features?: string[]
  price: number
  price_negotiable?: boolean
  fipe_price?: number
  condition: VehicleCondition
  images?: string[]
  thumbnail_url?: string
  video_url?: string
  slug: string
  description?: string
  plate_last_digits?: string
  seller_id?: string
}

// ─── Labels ────────────────────────────────────────────────────────────────────

export const STATUS_LABELS: Record<VehicleStatus, string> = {
  available: 'Disponível',
  reserved:  'Reservado',
  sold:      'Vendido',
  inactive:  'Inativo',
}

export const STATUS_BADGE: Record<VehicleStatus, string> = {
  available: 'bg-green-100 text-green-700',
  reserved:  'bg-yellow-100 text-yellow-700',
  sold:      'bg-gray-100 text-gray-500',
  inactive:  'bg-red-100 text-red-500',
}

export const CONDITION_LABELS: Record<VehicleCondition, string> = {
  new:       'Novo',
  used:      'Usado',
  certified: 'Certificado',
}

export const FUEL_LABELS: Record<FuelType, string> = {
  flex:      'Flex',
  gasoline:  'Gasolina',
  diesel:    'Diesel',
  electric:  'Elétrico',
  hybrid:    'Híbrido',
  ethanol:   'Etanol',
}

export const TRANSMISSION_LABELS: Record<TransmissionType, string> = {
  manual:    'Manual',
  automatic: 'Automático',
  cvt:       'CVT',
  automated: 'Automatizado',
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

export function formatPrice(price: number): string {
  return price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

export function vehicleTitle(v: Pick<Vehicle, 'brand' | 'model' | 'year_model'>): string {
  return `${v.brand} ${v.model} ${v.year_model}`
}
