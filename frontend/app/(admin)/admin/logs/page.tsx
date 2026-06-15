import { createServiceClient } from '@/lib/supabaseServer'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Logs — Admin RevendaClick' }

const ACTION_COLOR: Record<string, string> = {
  create: 'bg-green-900/40 text-green-400 border-green-800',
  update: 'bg-blue-900/40 text-blue-400 border-blue-800',
  delete: 'bg-red-900/40 text-red-400 border-red-800',
  login:  'bg-purple-900/40 text-purple-400 border-purple-800',
  logout: 'bg-gray-800 text-gray-500 border-gray-700',
}

export default async function AdminLogsPage() {
  const db = createServiceClient()

  const [{ data: logs }, { data: allUsers }] = await Promise.all([
    db
      .from('audit_logs')
      .select('id, action, entity_type, entity_id, ip_address, created_at, tenant_id, user_id, tenants(slug, name)')
      .order('created_at', { ascending: false })
      .limit(300),
    db.from('users').select('id, name, email'),
  ])

  const userMap = (allUsers ?? []).reduce<Record<string, { name: string; email: string }>>((acc, u) => {
    acc[u.id] = { name: u.name, email: u.email }
    return acc
  }, {})

  const rows = (logs ?? []).map((l: any) => ({
    ...l,
    userInfo: userMap[l.user_id] ?? null,
  })) as Array<{
    id: string
    action: string
    entity_type: string | null
    entity_id: string | null
    ip_address: string | null
    created_at: string
    tenants: { slug: string; name: string } | null
    userInfo: { name: string; email: string } | null
  }>

  const stats = {
    total:   rows.length,
    creates: rows.filter(l => l.action === 'create').length,
    updates: rows.filter(l => l.action === 'update').length,
    deletes: rows.filter(l => l.action === 'delete').length,
  }

  // Agrupar por entity_type
  const byEntity = rows.reduce<Record<string, number>>((acc, l) => {
    const key = l.entity_type ?? 'unknown'
    acc[key] = (acc[key] ?? 0) + 1
    return acc
  }, {})

  const topEntities = Object.entries(byEntity)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold text-white">Logs</h1>
        <p className="mt-0.5 text-sm text-gray-500">Audit logs da plataforma (últimos 300 registros)</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total" value={stats.total} />
        <StatCard label="Creates" value={stats.creates} color="text-green-400" />
        <StatCard label="Updates" value={stats.updates} color="text-blue-400" />
        <StatCard label="Deletes" value={stats.deletes} color="text-red-400" />
      </div>

      {topEntities.length > 0 && (
        <div className="rounded-xl border border-gray-800 bg-gray-900 px-5 py-4">
          <h2 className="text-sm font-semibold text-gray-400 mb-3">Entidades mais auditadas</h2>
          <div className="flex flex-wrap gap-2">
            {topEntities.map(([entity, count]) => (
              <div key={entity} className="flex items-center gap-1.5 rounded-lg bg-gray-800 border border-gray-700 px-3 py-1.5">
                <span className="font-mono text-xs text-gray-300">{entity}</span>
                <span className="text-[10px] text-gray-600">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-xl border border-gray-800 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-800 bg-gray-900/60">
          <h2 className="text-sm font-semibold text-gray-300">{rows.length} registros recentes</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-900/80 text-left">
                {['Ação', 'Entidade', 'Usuário', 'Tenant', 'IP', 'Data'].map(h => (
                  <th key={h} className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-gray-600 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {rows.map(log => (
                <tr key={log.id} className="hover:bg-gray-900/30 transition-colors">
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap ${ACTION_COLOR[log.action] ?? 'bg-gray-800 text-gray-500 border-gray-700'}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-mono text-xs text-gray-300">{log.entity_type ?? '—'}</p>
                    {log.entity_id && (
                      <p className="text-[10px] text-gray-700 font-mono">{log.entity_id.slice(0, 8)}…</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-xs text-gray-300 whitespace-nowrap">{log.userInfo?.name ?? '—'}</p>
                    <p className="text-[10px] text-gray-600">{log.userInfo?.email ?? ''}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-xs text-gray-400 whitespace-nowrap">{log.tenants?.name ?? '—'}</p>
                    <p className="text-[10px] text-gray-600">{log.tenants?.slug ?? ''}</p>
                  </td>
                  <td className="px-4 py-3 text-xs font-mono text-gray-600 whitespace-nowrap">
                    {String(log.ip_address ?? '—')}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString('pt-BR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 && (
            <div className="py-12 text-center text-sm text-gray-700">Nenhum log encontrado.</div>
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
