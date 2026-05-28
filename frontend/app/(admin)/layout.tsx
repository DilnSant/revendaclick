import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabaseServer'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) redirect('/login')

  const role = session.user?.app_metadata?.user_role as string | undefined
  if (role !== 'super_admin') redirect('/dashboard')

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <header className="border-b border-gray-800 px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-sm font-bold tracking-widest uppercase text-gray-400">
              RevendaClick Admin
            </span>
          </div>
          <span className="text-xs text-gray-600">super_admin</span>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-6 py-8">{children}</main>
    </div>
  )
}
