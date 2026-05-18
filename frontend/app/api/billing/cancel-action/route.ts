import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabaseServer'

const API = process.env.INTERNAL_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'

export async function POST() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session?.access_token) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const res = await fetch(`${API}/api/billing/subscription`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${session.access_token}` },
  })

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    return NextResponse.json({ error: data.error ?? 'Erro ao cancelar' }, { status: res.status })
  }

  return NextResponse.json({ ok: true })
}
