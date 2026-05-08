import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabaseServer'

const API = process.env.INTERNAL_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session?.access_token) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const body = await request.json()
  const { plan_name, billing_cycle, billing_type, cpf_or_cnpj } = body

  if (!plan_name) {
    return NextResponse.json({ error: 'plan_name é obrigatório' }, { status: 400 })
  }

  const res = await fetch(`${API}/api/billing/subscribe`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ plan_name, billing_cycle, billing_type, cpf_or_cnpj }),
  })

  const data = await res.json()

  if (!res.ok) {
    return NextResponse.json({ error: data.error ?? 'Erro ao processar' }, { status: res.status })
  }

  return NextResponse.json(data)
}
