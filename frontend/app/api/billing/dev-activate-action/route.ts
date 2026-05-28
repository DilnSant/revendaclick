import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabaseServer'

const API = process.env.INTERNAL_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'

export async function POST(request: Request) {
  if (process.env.NEXT_PUBLIC_DEV_BILLING !== 'true') {
    return NextResponse.json({ error: 'Not available' }, { status: 404 })
  }

  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const body = await request.json()
  const { plan_name } = body
  if (!plan_name) {
    return NextResponse.json({ error: 'plan_name é obrigatório' }, { status: 400 })
  }

  const res = await fetch(`${API}/api/billing/dev/activate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ plan_name }),
  })

  const json = await res.json()
  if (!res.ok) {
    const msg = json.error?.message ?? json.error ?? 'Erro ao ativar assinatura'
    return NextResponse.json(
      { error: typeof msg === 'string' ? msg : JSON.stringify(msg) },
      { status: res.status }
    )
  }

  return NextResponse.json(json.data ?? json)
}
