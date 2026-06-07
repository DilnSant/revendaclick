import { createServiceClient } from '@/lib/supabaseServer'

export const metadata = { title: 'Usuários — Admin RevendaClick' }

const ROLE_COLOR: Record<string, string> = {
  owner:       'bg-red-900/40 text-red-400 border-red-800',
  admin:       'bg-orange-900/40 text-orange-400 border-orange-800',
  seller:      'bg-blue-900/40 text-blue-400 border-blue-800',
  super_admin: 'bg-purple-900/40 text-purple-400 border-purple-800',
}

export default async function AdminUsersPage() {
  const db = createServiceClient()

  const { data: users } = await db
    .from('users')
    .select(`
      id, name, email, role, is_active, last_seen_at, created_at,
      tenants!inner(slug, name)
    `)
    .order('created_at', { ascending: false })

  const rows = (users ?? []) as Array<{
    id: string
    name: string
    email: string
    role: string
    is_active: boolean
    last_seen_at: string | null
    created_at: string
    tenants: { slug: string; name: string }
  }>

  const stats = {
    total:   rows.length,
    active:  rows.filter(u => u.is_active).length,
    owners:  rows.filter(u => u.role === 'owner').length,
    admins:  rows.filter(u => u.role === 'admin').length,
    sellers: rows.filter(u => u.role === 'seller').length,
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold text-white">Usuários</h1>
        <p className="mt-0.5 text-sm text-gray-500">Todos os usuários da plataforma</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        <StatCard label="Total" value={stats.total} />
        <StatCard label="Ativos" value={stats.active} color="text-green-400" />
        <StatCard label="Owners" value={stats.owners} color="text-red-400" />
        <StatCard label="Admins" value={stats.admins} color="text-orange-400" />
        <StatCard label="Sellers" value={stats.sellers} color="text-blue-400" />
      </div>

      <div className="rounded-xl border border-gray-800 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-800 bg-gray-900/60">
          <h2 className="text-sm font-semibold text-gray-300">{rows.length} usuários</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-900/80 text-left">
                {['Nome', 'Email', 'Role', 'Tenant', 'Status', 'Último acesso', 'Criado'].map(h => (
                  <th key={h} className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-gray-600 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {rows.map(u => (
                <tr key={u.id} className="hover:bg-gray-900/30 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-200 whitespace-nowrap">{u.name || '—'}</p>
                    <p className="text-[10px] text-gray-600 font-mono">{u.id.slice(0, 8)}…</p>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap ${ROLE_COLOR[u.role] ?? 'bg-gray-800 text-gray-400 border-gray-700'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-xs text-gray-300 whitespace-nowrap">{u.tenants?.name ?? '—'}</p>
                    <p className="text-[10px] text-gray-600">{u.tenants?.slug ?? ''}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${u.is_active ? 'bg-green-900/40 text-green-400' : 'bg-red-900/40 text-red-400'}`}>
                      {u.is_active ? '●' : '○'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">
                    {u.last_seen_at ? new Date(u.last_seen_at).toLocaleDateString('pt-BR') : '—'}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">
                    {new Date(u.created_at).toLocaleDateString('pt-BR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 && (
            <div className="py-12 text-center text-sm text-gray-700">Nenhum usuário encontrado.</div>
          )}
        </div>
      </div>
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
