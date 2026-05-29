import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabaseServer'

const API =
  process.env.INTERNAL_API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  'http://localhost:8080'
const BASE = API.startsWith('http') ? API : `https://${API}`

type Params = { params: Promise<{ type: string }> }

export async function POST(_req: Request, { params }: Params) {
  const { type } = await params
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const res = await fetch(`${BASE}/api/billing/addons/${type}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${session.access_token}` },
  })
  const body = await res.json()
  return NextResponse.json(body, { status: res.status })
}

export async function DELETE(_req: Request, { params }: Params) {
  const { type } = await params
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const res = await fetch(`${BASE}/api/billing/addons/${type}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${session.access_token}` },
  })
  const body = await res.json()
  return NextResponse.json(body, { status: res.status })
}
