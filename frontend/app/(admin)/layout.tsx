import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabaseServer'
import { resolveUserRole } from '@/lib/tenant'
import AdminShell from './_components/AdminShell'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // FC059: defense-in-depth — JWT-first + DB-fallback for role resolution.
  // Required for super_admin whose app_metadata.user_role is missing in JWT
  // (e.g. users promoted via SQL without syncing auth.users).
  const role = await resolveUserRole(user, user.id)
  if (role !== 'super_admin') redirect('/dashboard')

  const userEmail = user.email ?? ''

  return (
    <AdminShell userEmail={userEmail}>
      {children}
    </AdminShell>
  )
}
