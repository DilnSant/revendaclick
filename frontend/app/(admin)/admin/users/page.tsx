import { createClient } from '@/lib/supabaseServer'
import { UsersTable, type UserRow } from './_components/UsersTable'

export const metadata = { title: 'Usuários — Admin RevendaClick' }
export const revalidate = 0

const API = process.env.INTERNAL_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'

export default async function AdminUsersPage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token ?? ''

  let rows: UserRow[] = []
  let fetchError = ''

  try {
    const res = await fetch(`${API}/api/admin/users`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
    if (!res.ok) {
      fetchError = `Erro ${res.status}`
    } else {
      const json = await res.json()
      rows = (json.users ?? []) as UserRow[]
    }
  } catch {
    fetchError = 'Erro de conexão com o backend'
  }

  const stats = {
    total:      rows.length,
    active:     rows.filter(u => u.is_active).length,
    inactive:   rows.filter(u => !u.is_active).length,
    superAdmin: rows.filter(u => u.role === 'super_admin').length,
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold text-white">Usuários</h1>
        <p className="mt-0.5 text-sm text-gray-500">Todos os usuários da plataforma</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total"        value={stats.total} />
        <StatCard label="Ativos"       value={stats.active}     color="text-green-400" />
        <StatCard label="Inativos"     value={stats.inactive}   color="text-red-400" />
        <StatCard label="Super Admin"  value={stats.superAdmin} color="text-red-400" />
      </div>

      {fetchError ? (
        <div className="rounded-xl border border-red-800 bg-red-900/20 p-6 text-sm text-red-400">{fetchError}</div>
      ) : (
        <UsersTable rows={rows} />
      )}
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-600">{label}</p>
      <p className={`mt-1.5 text-3xl font-bold ${color ?? 'text-white'}`}>{value}</p>
    </div>
  )
}
