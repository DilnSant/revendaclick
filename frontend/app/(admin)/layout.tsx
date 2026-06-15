import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabaseServer'
import AdminShell from './_components/AdminShell'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const role = user.app_metadata?.user_role as string | undefined
  if (role !== 'super_admin') redirect('/dashboard')

  const userEmail = user.email ?? ''

  return (
    <AdminShell userEmail={userEmail}>
      {children}
    </AdminShell>
  )
}
