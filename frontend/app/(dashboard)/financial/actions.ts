'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabaseServer'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'

export async function createEntry(formData: FormData) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token
  if (!token) return { error: 'Não autenticado' }

  const body = {
    type:           formData.get('type') as string,
    category:       formData.get('category') as string,
    description:    formData.get('description') as string,
    amount:         parseFloat(formData.get('amount') as string),
    payment_method: formData.get('payment_method') as string,
    status:         formData.get('status') as string,
    due_date:       formData.get('due_date') as string || null,
    notes:          formData.get('notes') as string || null,
  }

  const res = await fetch(`${API}/api/financial/entries`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    return { error: (err as { error?: { message?: string } })?.error?.message ?? 'Erro ao criar lançamento' }
  }

  revalidatePath('/financial')
  return { error: null }
}
