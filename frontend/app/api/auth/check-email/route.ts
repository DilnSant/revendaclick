import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabaseServer'

export async function POST(req: NextRequest) {
  let email: string
  try {
    const body = await req.json()
    email = (typeof body?.email === 'string' ? body.email : '').trim().toLowerCase()
  } catch {
    return NextResponse.json({ exists: false }, { status: 400 })
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ exists: false }, { status: 400 })
  }

  try {
    const supabase = createServiceClient()
    const { data, error } = await (supabase as any).rpc('check_email_registered', { p_email: email })
    if (error) {
      console.error('[check-email]', error.message)
      // Fail-open: transient DB error não bloqueia recuperação de senha
      return NextResponse.json({ exists: true })
    }
    return NextResponse.json({ exists: Boolean(data) })
  } catch (err) {
    console.error('[check-email] unexpected error:', err)
    return NextResponse.json({ exists: true })
  }
}
