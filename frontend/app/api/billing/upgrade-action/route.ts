import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabaseServer'

const API = process.env.INTERNAL_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'

export async function PUT(request: Request) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session?.access_token) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const body = await request.json()
  const { plan_name, billing_cycle } = body

  if (!plan_name) {
    return NextResponse.json({ error: 'plan_name é obrigatório' }, { status: 400 })
  }

  const res = await fetch(`${API}/api/billing/subscription`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ plan_name, billing_cycle }),
  })

  const json = await res.json()

  if (!res.ok) {
    const msg = json.error?.message ?? json.error ?? 'Erro ao alterar plano'
    return NextResponse.json({ error: typeof msg === 'string' ? msg : JSON.stringify(msg) }, { status: res.status })
  }

  return NextResponse.json(json.data ?? json)
}
