import { createServiceClient } from '@/lib/supabaseServer'

export const metadata = { title: 'WhatsApps — Admin RevendaClick' }

const CONN_COLOR: Record<string, string> = {
  open:  'bg-green-900/40 text-green-400 border-green-800',
  close: 'bg-red-900/40 text-red-400 border-red-800',
  connecting: 'bg-yellow-900/40 text-yellow-400 border-yellow-800',
}

export default async function AdminWhatsappsPage() {
  const db = createServiceClient()

  const { data: instances } = await db
    .from('Instance')
    .select('id, name, connectionStatus, ownerJid, profileName, number, clientName, createdAt, updatedAt, disconnectionAt')
    .order('createdAt', { ascending: false })

  const { data: sessions } = await db
    .from('Session')
    .select('id, sessionId, createdAt')

  // Contagem de mensagens por instância
  const { data: msgCounts } = await db
    .from('Message')
    .select('instanceId')

  const msgByInstance = (msgCounts ?? []).reduce<Record<string, number>>((acc, m) => {
    const id = (m as { instanceId: string }).instanceId
    acc[id] = (acc[id] ?? 0) + 1
    return acc
  }, {})

  const rows = (instances ?? []) as Array<{
    id: string
    name: string
    connectionStatus: string
    ownerJid: string | null
    profileName: string | null
    number: string | null
    clientName: string | null
    createdAt: string
    updatedAt: string | null
    disconnectionAt: string | null
  }>

  const stats = {
    total:      rows.length,
    connected:  rows.filter(i => i.connectionStatus === 'open').length,
    disconnected: rows.filter(i => i.connectionStatus === 'close').length,
    sessions:   (sessions ?? []).length,
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold text-white">WhatsApps</h1>
        <p className="mt-0.5 text-sm text-gray-500">Instâncias Evolution API v2.3.7</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Instâncias" value={stats.total} />
        <StatCard label="Conectadas" value={stats.connected} color="text-green-400" />
        <StatCard label="Desconectadas" value={stats.disconnected} color="text-red-400" />
        <StatCard label="Sessions" value={stats.sessions} color="text-blue-400" />
      </div>

      <div className="rounded-xl border border-gray-800 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-800 bg-gray-900/60">
          <h2 className="text-sm font-semibold text-gray-300">{rows.length} instâncias Evolution</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-900/80 text-left">
                {['Instância', 'Status', 'Número', 'Profile', 'Mensagens', 'Última atualização', 'Desconectado em'].map(h => (
                  <th key={h} className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-gray-600 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {rows.map(inst => (
                <tr key={inst.id} className="hover:bg-gray-900/30 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-200 whitespace-nowrap">{inst.name}</p>
                    <p className="text-[10px] font-mono text-gray-700">{inst.id.slice(0, 12)}…</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap ${CONN_COLOR[inst.connectionStatus] ?? 'bg-gray-800 text-gray-500 border-gray-700'}`}>
                      {inst.connectionStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                    {inst.number ?? inst.ownerJid?.split('@')[0] ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                    {inst.profileName ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-center text-sm font-medium text-gray-400">
                    {msgByInstance[inst.id] ?? 0}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">
                    {inst.updatedAt ? new Date(inst.updatedAt).toLocaleString('pt-BR') : '—'}
                  </td>
                  <td className="px-4 py-3 text-xs whitespace-nowrap">
                    {inst.disconnectionAt
                      ? <span className="text-red-500">{new Date(inst.disconnectionAt).toLocaleString('pt-BR')}</span>
                      : <span className="text-gray-700">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 && (
            <div className="py-12 text-center text-sm text-gray-700">Nenhuma instância Evolution encontrada.</div>
          )}
        </div>
      </div>

      {/* Sessions */}
      {(sessions ?? []).length > 0 && (
        <div className="rounded-xl border border-gray-800 bg-gray-900 px-5 py-4">
          <h2 className="text-sm font-semibold text-gray-400 mb-3">Sessions ativas ({(sessions ?? []).length})</h2>
          <div className="space-y-1.5">
            {(sessions ?? []).map((s: any) => (
              <div key={s.id} className="flex items-center justify-between text-xs">
                <span className="font-mono text-gray-500">{s.sessionId}</span>
                <span className="text-gray-700">{new Date(s.createdAt).toLocaleDateString('pt-BR')}</span>
              </div>
            ))}
          </div>
        </div>
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
