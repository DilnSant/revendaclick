'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

export interface TenantSummary {
  id: string
  slug: string
  name: string
  email: string
  is_active: boolean
  created_at: string
  sub_status: string
  plan_name: string
  plan_display: string
  trial_ends_at?: string
  period_end?: string
  vehicle_count: number
  user_count: number
  lead_count: number
}

const STATUS_COLOR: Record<string, string> = {
  active:   'bg-green-900/40 text-green-400 border-green-800',
  trialing: 'bg-blue-900/40 text-blue-400 border-blue-800',
  past_due: 'bg-orange-900/40 text-orange-400 border-orange-800',
  canceled: 'bg-red-900/40 text-red-400 border-red-800',
  paused:   'bg-gray-700 text-gray-400 border-gray-600',
  none:     'bg-gray-800 text-gray-500 border-gray-700',
}

export default function AdminTenantsTable({ tenants }: { tenants: TenantSummary[] }) {
  const router = useRouter()
  const [search, setSearch]     = useState('')
  const [loading, setLoading]   = useState<Record<string, boolean>>({})
  const [messages, setMessages] = useState<Record<string, string>>({})
  const [editing, setEditing]   = useState<TenantSummary | null>(null)
  const [editName, setEditName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editSlug, setEditSlug] = useState('')
  const [editMsg, setEditMsg]   = useState<{ ok: boolean; text: string } | null>(null)
  const [pending, start]        = useTransition()

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
      router.refresh()
    } catch (e) {
      setMessages(m => ({ ...m, [tenantId]: `✗ ${e instanceof Error ? e.message : 'Erro'}` }))
    } finally {
      setLoading(l => ({ ...l, [k]: false }))
    }
  }

  function openEdit(t: TenantSummary) {
    setEditing(t)
    setEditName(t.name)
    setEditEmail(t.email)
    setEditSlug(t.slug)
    setEditMsg(null)
  }

  function closeEdit() { setEditing(null) }

  function handleSaveEdit() {
    if (!editing) return
    start(async () => {
      const body: Record<string, string> = {}
      if (editName.trim() && editName.trim() !== editing.name)   body.name  = editName.trim()
      if (editEmail.trim() && editEmail.trim() !== editing.email) body.email = editEmail.trim()
      if (editSlug.trim() && editSlug.trim() !== editing.slug)   body.slug  = editSlug.trim()
      if (Object.keys(body).length === 0) { closeEdit(); return }

      try {
        const res = await fetch(`/api/admin/tenants/${editing.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        const json = await res.json()
        if (!res.ok) {
          setEditMsg({ ok: false, text: json.error ?? 'Erro ao atualizar' })
        } else {
          setEditMsg({ ok: true, text: 'Tenant atualizado!' })
          closeEdit()
          router.refresh()
        }
      } catch {
        setEditMsg({ ok: false, text: 'Erro de rede' })
      }
    })
  }

  return (
    <>
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
                  <th key={h} className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">{h}</th>
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
                        <button
                          onClick={() => openEdit(t)}
                          className="rounded px-2 py-1 text-xs font-medium bg-gray-800 text-gray-300 border border-gray-700 hover:bg-gray-700"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => action(t.id, 'activate', () => callAdmin(`/tenants/${t.id}/activate`, 'POST', { plan_name: 'pro' }))}
                          disabled={isLoading('activate')}
                          className="rounded px-2 py-1 text-xs font-medium bg-green-900/40 text-green-400 border border-green-800 hover:bg-green-900/60 disabled:opacity-40"
                        >
                          {isLoading('activate') ? '…' : 'Ativar Pro'}
                        </button>
                        <button
                          onClick={() => action(t.id, 'trial', () => callAdmin(`/tenants/${t.id}/extend-trial`, 'POST', { days: 7 }))}
                          disabled={isLoading('trial')}
                          className="rounded px-2 py-1 text-xs font-medium bg-blue-900/40 text-blue-400 border border-blue-800 hover:bg-blue-900/60 disabled:opacity-40"
                        >
                          {isLoading('trial') ? '…' : '+7 dias trial'}
                        </button>
                        <button
                          onClick={() => action(t.id, 'grant', () => callAdmin(`/tenants/${t.id}/features`, 'POST', { feature: 'central_atendimento', note: 'Admin grant' }))}
                          disabled={isLoading('grant')}
                          className="rounded px-2 py-1 text-xs font-medium bg-purple-900/40 text-purple-400 border border-purple-800 hover:bg-purple-900/60 disabled:opacity-40"
                        >
                          {isLoading('grant') ? '…' : '+ Atendimento'}
                        </button>
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
                        <p className={`mt-1 text-xs ${msg.startsWith('✓') ? 'text-green-400' : 'text-red-400'}`}>{msg}</p>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="py-8 text-center text-sm text-gray-600">Nenhum tenant encontrado.</div>
          )}
        </div>
      </div>

      {/* Edit Tenant Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={closeEdit}>
          <div
            className="w-full max-w-sm rounded-2xl border border-gray-700 bg-gray-900 shadow-2xl p-6 space-y-5"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Editar Tenant</h3>
                <p className="text-xs text-gray-500 mt-0.5 font-mono">{editing.slug}</p>
              </div>
              <button onClick={closeEdit} className="text-gray-600 hover:text-gray-400">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-400">Nome da revenda</label>
                <input
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-400">E-mail</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={e => setEditEmail(e.target.value)}
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-400">Slug (URL da loja)</label>
                <input
                  type="text"
                  value={editSlug}
                  onChange={e => setEditSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-200 font-mono focus:border-primary focus:outline-none"
                />
                {editSlug !== editing.slug && (
                  <p className="text-[10px] text-yellow-500">
                    Atenção: alterar slug muda a URL pública da loja e da vitrine.
                  </p>
                )}
              </div>
            </div>

            {editMsg && (
              <p className={`text-xs ${editMsg.ok ? 'text-green-400' : 'text-red-400'}`}>{editMsg.text}</p>
            )}

            <div className="flex items-center gap-3 pt-1">
              <button
                onClick={handleSaveEdit}
                disabled={pending}
                className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-40 transition-colors"
              >
                {pending ? 'Salvando...' : 'Salvar'}
              </button>
              <button
                onClick={closeEdit}
                className="rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-400 hover:bg-gray-800 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
