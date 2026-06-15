import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabaseServer'

const API = process.env.INTERNAL_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'

async function proxyAdmin(request: Request, path: string[], method: string) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session?.access_token) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  // Use getUser() instead of session claims — always returns current app_metadata
  // from Supabase Auth server, avoiding stale JWT claims after role changes.
  const { data: { user } } = await supabase.auth.getUser()
  const role = user?.app_metadata?.user_role as string | undefined
  if (role !== 'super_admin') {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }

  const joinedPath = path.join('/')
  const url = new URL(request.url)
  const queryString = url.search

  let body: string | undefined
  if (method !== 'GET') {
    try {
      body = await request.text()
    } catch {
      body = undefined
    }
  }

  const res = await fetch(`${API}/api/admin/${joinedPath}${queryString}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: body || undefined,
  })

  const json = await res.json()
  return NextResponse.json(json, { status: res.status })
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  return proxyAdmin(request, path, 'GET')
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  return proxyAdmin(request, path, 'POST')
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  return proxyAdmin(request, path, 'PUT')
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  return proxyAdmin(request, path, 'DELETE')
}
