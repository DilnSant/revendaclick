'use server'

import { revalidatePath } from 'next/cache'
import { createClient, createServiceClient } from '@/lib/supabaseServer'

const API = process.env.INTERNAL_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'

async function getToken(): Promise<string> {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token ?? ''
}

export async function inviteVendor(
  email: string,
  name: string,
  role: string,
  phone?: string,
): Promise<{ success?: true; error?: string }> {
  if (!email || !name || !role) return { error: 'Preencha todos os campos obrigatórios.' }

  // APP_URL is a server-only runtime var; fallback to production URL
  const appUrl = process.env.APP_URL ?? 'https://app.revendaclick.com.br'
  const redirectTo = `${appUrl}/auth/callback`

  const admin = createServiceClient()
  const { data, error: inviteErr } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo,
    data: { name },
  })
  if (inviteErr || !data?.user) {
    return { error: inviteErr?.message ?? 'Falha ao convidar usuário no Supabase.' }
  }

  const token = await getToken()
  const res = await fetch(`${API}/api/users`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: data.user.id, email, name, role, phone: phone || null }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    return { error: err.error?.message ?? 'Falha ao registrar usuário no sistema.' }
  }

  revalidatePath('/vendors')
  return { success: true }
}

export async function updateVendor(
  id: string,
  payload: { name?: string; role?: string; phone?: string | null; is_active?: boolean },
): Promise<{ success?: true; error?: string }> {
  const token = await getToken()
  const res = await fetch(`${API}/api/users/${id}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    return { error: err.error?.message ?? 'Falha ao atualizar usuário.' }
  }
  revalidatePath('/vendors')
  return { success: true }
}

export async function deleteVendor(id: string): Promise<{ success?: true; error?: string }> {
  const token = await getToken()
  const res = await fetch(`${API}/api/users/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    return { error: err.error?.message ?? 'Falha ao remover usuário.' }
  }
  revalidatePath('/vendors')
  return { success: true }
}
