import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabaseServer'
import { resolveUserRole } from '@/lib/tenant'

// FC059: server-side helper for the login page to resolve the user's effective
// role (JWT-first + DB-fallback) before deciding where to redirect.
// The login page is a client component and cannot use createServiceClient()
// directly — this endpoint gives it a safe, authenticated lookup.
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ role: null }, { status: 200 })
    }

    const role = await resolveUserRole(user, user.id)
    return NextResponse.json({ role }, { status: 200 })
  } catch (err) {
    console.error('[api/me/role] unexpected error:', err)
    return NextResponse.json({ role: null }, { status: 200 })
  }
}
