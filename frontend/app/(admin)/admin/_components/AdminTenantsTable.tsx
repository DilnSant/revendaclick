'use client'

import { useState } from 'react'
import type { TenantSummary } from '../page'

const STATUS_COLOR: Record<string, string> = {
  active:   'bg-green-900/40 text-green-400 border-green-800',
  trialing: 'bg-blue-900/40 text-blue-400 border-blue-800',
  past_due: 'bg-orange-900/40 text-orange-400 border-orange-800',
  canceled: 'bg-red-900/40 text-red-400 border-red-800',
  paused:   'bg-gray-700 text-gray-400 border-gray-600',
  none:     'bg-gray-800 text-gray-500 border-gray-700',
}

interface Props {
  tenants: TenantSummary[]
}

export default function AdminTenantsTable({ tenants }: Props) {
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState<Record<string, boolean>>({})
  const [messages, setMessages] = useState<Record<string, string>>({})

  const filtered = tenants.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.slug.toLowerCase().includes(search.toLowerCase()) ||
    t.email.toLowerCase().includes(search.toLowerCase())
  )

  async function callAdmin(path: string, method: string, body?: object) {
    const res = await fetch(`/api/admin${path}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error?.message ?? json.error ?? 'Erro')
    return json
  }

  async function action(tenantId: string, key: string, fn: () => Promise<void>) {
    const k = `${tenantId}:${key}`
    setLoading(l => ({ ...l, [k]: true }))
    setMessages(m => ({ ...m, [tenantId]: '' }))
    try {
      await fn()
      setMessages(m => ({ ...m, [tenantId]: '✓ Feito. Recarregue para atualizar.' }))
    } catch (e) {
      setMessages(m => ({ ...m, [tenantId]: `✗ ${e instanceof Error ? e.message : 'Erro'}` }))
    } finally {
      setLoading(l => ({ ...l, [k]: false }))
    }
  }

  return (
    <div className="space-y-4">
      <input
        type="text"
        placeholder="Buscar por nome, slug ou e-mail…"
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full max-w-sm rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-100 placeholder-gray-600 focus:border-gray-500 focus:outline-none"
      />

      <div className="overflow-x-auto rounded-xl border border-gray-800">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 bg-gray-900/80 text-left">
              {['Tenant', 'Plano', 'Status', 'Veículos', 'Usuários', 'Leads', 'Ações'].map(h => (
                <th key={h} className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/60">
            {filtered.map(t => {
              const isLoading = (key: string) => loading[`${t.id}:${key}`]
              const msg = messages[t.id]
              return (
                <tr key={t.id} className="hover:bg-gray-900/40 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-100">{t.name}</p>
                    <p className="text-xs text-gray-500">{t.slug} · {t.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-semibold text-gray-300">{t.plan_display || '—'}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[t.sub_status] ?? STATUS_COLOR.none}`}>
                      {t.sub_status}
                    </span>
                    {!t.is_active && (
                      <span className="ml-1 inline-flex rounded-full border border-red-800 bg-red-900/40 px-2 py-0.5 text-xs font-medium text-red-400">
                        bloqueado
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center text-gray-400">{t.vehicle_count}</td>
                  <td className="px-4 py-3 text-center text-gray-400">{t.user_count}</td>
                  <td className="px-4 py-3 text-center text-gray-400">{t.lead_count}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-1">
                      {/* Activate Pro */}
                      <button
                        onClick={() => action(t.id, 'activate', () => callAdmin(`/tenants/${t.id}/activate`, 'POST', { plan_name: 'pro' }))}
                        disabled={isLoading('activate')}
                        className="rounded px-2 py-1 text-xs font-medium bg-green-900/40 text-green-400 border border-green-800 hover:bg-green-900/60 disabled:opacity-40"
                      >
                        {isLoading('activate') ? '…' : 'Ativar Pro'}
                      </button>

                      {/* Extend trial */}
                      <button
                        onClick={() => action(t.id, 'trial', () => callAdmin(`/tenants/${t.id}/extend-trial`, 'POST', { days: 7 }))}
                        disabled={isLoading('trial')}
                        className="rounded px-2 py-1 text-xs font-medium bg-blue-900/40 text-blue-400 border border-blue-800 hover:bg-blue-900/60 disabled:opacity-40"
                      >
                        {isLoading('trial') ? '…' : '+7 dias trial'}
                      </button>

                      {/* Grant central_atendimento */}
                      <button
                        onClick={() => action(t.id, 'grant', () => callAdmin(`/tenants/${t.id}/features`, 'POST', { feature: 'central_atendimento', note: 'Admin grant' }))}
                        disabled={isLoading('grant')}
                        className="rounded px-2 py-1 text-xs font-medium bg-purple-900/40 text-purple-400 border border-purple-800 hover:bg-purple-900/60 disabled:opacity-40"
                      >
                        {isLoading('grant') ? '…' : '+ Atendimento'}
                      </button>

                      {/* Block / Unblock */}
                      {t.is_active ? (
                        <button
                          onClick={() => action(t.id, 'block', () => callAdmin(`/tenants/${t.id}/block`, 'POST'))}
                          disabled={isLoading('block')}
                          className="rounded px-2 py-1 text-xs font-medium bg-red-900/40 text-red-400 border border-red-800 hover:bg-red-900/60 disabled:opacity-40"
                        >
                          {isLoading('block') ? '…' : 'Bloquear'}
                        </button>
                      ) : (
                        <button
                          onClick={() => action(t.id, 'unblock', () => callAdmin(`/tenants/${t.id}/unblock`, 'POST'))}
                          disabled={isLoading('unblock')}
                          className="rounded px-2 py-1 text-xs font-medium bg-gray-700 text-gray-300 border border-gray-600 hover:bg-gray-600 disabled:opacity-40"
                        >
                          {isLoading('unblock') ? '…' : 'Desbloquear'}
                        </button>
                      )}
                    </div>

                    {msg && (
                      <p className={`mt-1 text-xs ${msg.startsWith('✓') ? 'text-green-400' : 'text-red-400'}`}>
                        {msg}
                      </p>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="py-8 text-center text-sm text-gray-600">
            Nenhum tenant encontrado.
          </div>
        )}
      </div>
    </div>
  )
}
