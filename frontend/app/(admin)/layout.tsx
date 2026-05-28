import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabaseServer'
import AdminShell from './_components/AdminShell'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) redirect('/login')

  const role = session.user?.app_metadata?.user_role as string | undefined
  if (role !== 'super_admin') redirect('/dashboard')

  const userEmail = session.user?.email ?? ''

  return (
    <AdminShell userEmail={userEmail}>
      {children}
    </AdminShell>
  )
}
