export type Customer = {
  id: string
  tenant_id: string
  name: string
  email: string | null
  phone: string | null
  cpf_cnpj: string | null
  address_city: string | null
  address_state: string | null
  notes: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export type CreateCustomerPayload = {
  name: string
  email?: string | null
  phone?: string | null
  cpf_cnpj?: string | null
  address_city?: string | null
  address_state?: string | null
  notes?: string | null
}

export type UpdateCustomerPayload = Partial<CreateCustomerPayload> & {
  is_active?: boolean
}

export const BR_STATES = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO',
  'MA','MT','MS','MG','PA','PB','PR','PE','PI',
  'RJ','RN','RS','RO','RR','SC','SP','SE','TO',
]

export function formatPhone(phone: string): string {
  const d = phone.replace(/\D/g, '')
  if (d.length === 11) return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`
  if (d.length === 10) return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`
  return phone
}

export function formatCpfCnpj(value: string): string {
  const d = value.replace(/\D/g, '')
  if (d.length === 11) return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  if (d.length === 14) return d.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
  return value
}

export function initials(name: string): string {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
}
