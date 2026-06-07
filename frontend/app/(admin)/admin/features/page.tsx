import { createServiceClient } from '@/lib/supabaseServer'

export const metadata = { title: 'Features — Admin RevendaClick' }

export default async function AdminFeaturesPage() {
  const db = createServiceClient()

  const { data: features } = await db
    .from('tenant_features')
    .select(`
      id, feature, enabled, expires_at, note, created_at,
      tenants!inner(slug, name)
    `)
    .order('created_at', { ascending: false })

  const rows = (features ?? []) as Array<{
    id: string
    feature: string
    enabled: boolean
    expires_at: string | null
    note: string | null
    created_at: string
    tenants: { slug: string; name: string }
  }>

  // Agrupar por tenant para exibir overview
  const byTenant = rows.reduce<Record<string, { name: string; slug: string; features: string[] }>>((acc, f) => {
    const key = f.tenants?.slug ?? 'unknown'
    if (!acc[key]) acc[key] = { name: f.tenants?.name, slug: f.tenants?.slug, features: [] }
    if (f.enabled) acc[key].features.push(f.feature)
    return acc
  }, {})

  const tenantList = Object.values(byTenant)

  const now = new Date()

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold text-white">Features</h1>
        <p className="mt-0.5 text-sm text-gray-500">Feature flags concedidas manualmente por tenant</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard label="Overrides totais" value={rows.length} />
        <StatCard label="Ativos" value={rows.filter(f => f.enabled).length} color="text-green-400" />
        <StatCard label="Tenants c/ overrides" value={tenantList.length} color="text-blue-400" />
      </div>

      {/* Por tenant */}
      {tenantList.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Por tenant</h2>
          {tenantList.map(t => (
            <div key={t.slug} className="rounded-xl border border-gray-800 bg-gray-900 px-5 py-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-medium text-gray-200">{t.name}</p>
                  <p className="text-xs text-gray-600">{t.slug}</p>
                </div>
                <span className="text-xs text-gray-600">{t.features.length} features ativas</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {t.features.map(f => (
                  <span key={f} className="inline-flex rounded-md bg-red-900/30 border border-red-800/50 px-2.5 py-1 text-xs font-medium text-red-300">
                    {f}
                  </span>
                ))}
                {t.features.length === 0 && (
                  <span className="text-xs text-gray-700">Nenhuma feature ativa</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tabela completa */}
      <div className="rounded-xl border border-gray-800 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-800 bg-gray-900/60">
          <h2 className="text-sm font-semibold text-gray-300">{rows.length} registros</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-900/80 text-left">
                {['Tenant', 'Feature', 'Ativo', 'Expira em', 'Nota', 'Concedido em'].map(h => (
                  <th key={h} className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-gray-600 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {rows.map(f => {
                const expired = f.expires_at && new Date(f.expires_at) < now
                return (
                  <tr key={f.id} className="hover:bg-gray-900/30 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-200 whitespace-nowrap">{f.tenants?.name}</p>
                      <p className="text-xs text-gray-600">{f.tenants?.slug}</p>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-red-300">{f.feature}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${f.enabled && !expired ? 'bg-green-900/40 text-green-400 border-green-800' : 'bg-red-900/40 text-red-400 border-red-800'}`}>
                        {f.enabled && !expired ? 'ativo' : 'inativo'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs whitespace-nowrap">
                      {f.expires_at
                        ? <span className={expired ? 'text-red-500' : 'text-gray-500'}>
                            {new Date(f.expires_at).toLocaleDateString('pt-BR')}
                            {expired ? ' (expirado)' : ''}
                          </span>
                        : <span className="text-gray-700">permanente</span>}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600 max-w-[180px] truncate">{f.note ?? '—'}</td>
                    <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">
                      {new Date(f.created_at).toLocaleDateString('pt-BR')}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {rows.length === 0 && (
            <div className="py-12 text-center text-sm text-gray-700">Nenhum override de feature encontrado.</div>
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
