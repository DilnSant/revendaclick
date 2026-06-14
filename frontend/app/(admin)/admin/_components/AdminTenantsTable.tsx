'use client'

import { Fragment, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

export interface TenantSummary {
  id: string
  slug: string
  name: string
  email: string
  is_active: boolean
  created_at: string
  quarantined_at?: string
  quarantine_reason?: string
  sub_status: string
  plan_name: string
  plan_display: string
  trial_ends_at?: string
  period_end?: string
  vehicle_count: number
  user_count: number
  lead_count: number
}

interface DeleteSummary {
  name: string
  slug: string
  email: string
  plan_display: string
  sub_status: string
  user_count: number
  vehicle_count: number
  lead_count: number
  customer_count: number
}

const STATUS_COLOR: Record<string, string> = {
  active:   'bg-green-900/40 text-green-400 border-green-800',
  trialing: 'bg-blue-900/40 text-blue-400 border-blue-800',
  past_due: 'bg-orange-900/40 text-orange-400 border-orange-800',
  canceled: 'bg-red-900/40 text-red-400 border-red-800',
  paused:   'bg-gray-700 text-gray-400 border-gray-600',
  none:     'bg-gray-800 text-gray-500 border-gray-700',
}

// ── Tooltip wrapper ───────────────────────────────────────────────────────────
function Tip({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <span className="group relative inline-flex">
      {children}
      <span className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded bg-gray-700 px-2 py-1 text-[10px] text-gray-100 opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
        {label}
      </span>
    </span>
  )
}

// ── Trash icon ────────────────────────────────────────────────────────────────
function TrashIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  )
}

export default function AdminTenantsTable({ tenants }: { tenants: TenantSummary[] }) {
  const router = useRouter()
  const [search, setSearch]     = useState('')
  const [loading, setLoading]   = useState<Record<string, boolean>>({})
  const [messages, setMessages] = useState<Record<string, string>>({})
  const [pending, start]        = useTransition()

  // Edit modal state
  const [editing, setEditing]   = useState<TenantSummary | null>(null)
  const [editName, setEditName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editSlug, setEditSlug] = useState('')
  const [editMsg, setEditMsg]   = useState<{ ok: boolean; text: string } | null>(null)

  // Quarantine modal state
  const [quarantining, setQuarantining] = useState<TenantSummary | null>(null)
  const [quarantineReason, setQuarantineReason] = useState('')
  const [quarantineMsg, setQuarantineMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [quarantinePending, startQuarantine] = useTransition()

  // Delete modal state
  const [deleting, setDeleting]         = useState<TenantSummary | null>(null)
  const [deleteMode, setDeleteMode]     = useState<'soft' | 'hard'>('soft')
  const [deleteReason, setDeleteReason] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [hardConfirm, setHardConfirm]   = useState('')
  const [deleteSummary, setDeleteSummary] = useState<DeleteSummary | null>(null)
  const [deleteMsg, setDeleteMsg]       = useState<{ ok: boolean; text: string } | null>(null)
  const [deletePending, startDelete]    = useTransition()

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
      setMessages(m => ({ ...m, [tenantId]: '✓ Feito.' }))
      router.refresh()
    } catch (e) {
      setMessages(m => ({ ...m, [tenantId]: `✗ ${e instanceof Error ? e.message : 'Erro'}` }))
    } finally {
      setLoading(l => ({ ...l, [k]: false }))
    }
  }

  // ── Edit ──────────────────────────────────────────────────────────────────
  function openEdit(t: TenantSummary) {
    setEditing(t); setEditName(t.name); setEditEmail(t.email); setEditSlug(t.slug); setEditMsg(null)
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
          method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
        })
        const json = await res.json()
        if (!res.ok) { setEditMsg({ ok: false, text: json.error ?? 'Erro ao atualizar' }) }
        else { setEditMsg({ ok: true, text: 'Tenant atualizado!' }); closeEdit(); router.refresh() }
      } catch { setEditMsg({ ok: false, text: 'Erro de rede' }) }
    })
  }

  // ── Quarantine ────────────────────────────────────────────────────────────
  function openQuarantine(t: TenantSummary) {
    setQuarantining(t); setQuarantineReason(''); setQuarantineMsg(null)
  }
  function closeQuarantine() { setQuarantining(null) }

  function handleQuarantine() {
    if (!quarantining || !quarantineReason.trim()) return
    startQuarantine(async () => {
      try {
        await callAdmin(`/tenants/${quarantining.id}/quarantine`, 'POST', { reason: quarantineReason.trim() })
        setQuarantineMsg({ ok: true, text: 'Tenant colocado em quarentena.' })
        router.refresh()
        setTimeout(closeQuarantine, 1500)
      } catch (e) {
        setQuarantineMsg({ ok: false, text: e instanceof Error ? e.message : 'Erro' })
      }
    })
  }

  // ── Delete ────────────────────────────────────────────────────────────────
  async function openDelete(t: TenantSummary) {
    setDeleting(t); setDeleteMode('soft'); setDeleteReason(''); setDeleteConfirm('')
    setHardConfirm(''); setDeleteMsg(null); setDeleteSummary(null)
    try {
      const res = await fetch(`/api/admin/tenants/${t.id}/delete-summary`)
      if (res.ok) setDeleteSummary(await res.json())
    } catch { /* summary optional */ }
  }
  function closeDelete() { setDeleting(null) }

  function handleDelete() {
    if (!deleting) return
    if (deleteConfirm !== 'EXCLUIR') return
    if (deleteMode === 'hard' && hardConfirm !== 'SIM, EXCLUIR TUDO') return

    startDelete(async () => {
      try {
        const url = deleteMode === 'hard'
          ? `/tenants/${deleting.id}?hard=true`
          : `/tenants/${deleting.id}`
        await callAdmin(url, 'DELETE', { reason: deleteReason.trim() || 'Exclusão via admin' })
        setDeleteMsg({ ok: true, text: deleteMode === 'hard' ? 'Tenant excluído permanentemente.' : 'Tenant marcado como excluído.' })
        router.refresh()
        setTimeout(closeDelete, 2000)
      } catch (e) {
        setDeleteMsg({ ok: false, text: e instanceof Error ? e.message : 'Erro' })
      }
    })
  }

  const canDelete = deleteConfirm === 'EXCLUIR' &&
    (deleteMode === 'soft' || hardConfirm === 'SIM, EXCLUIR TUDO')

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
                const isQuarantined = !!t.quarantined_at
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
                      <div className="flex flex-wrap gap-1">
                        <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[t.sub_status] ?? STATUS_COLOR.none}`}>
                          {t.sub_status}
                        </span>
                        {isQuarantined && (
                          <Tip label={t.quarantine_reason ?? 'Em quarentena'}>
                            <span className="inline-flex rounded-full border border-amber-700 bg-amber-900/40 px-2 py-0.5 text-xs font-medium text-amber-400">
                              quarentena
                            </span>
                          </Tip>
                        )}
                        {!t.is_active && !isQuarantined && (
                          <span className="inline-flex rounded-full border border-red-800 bg-red-900/40 px-2 py-0.5 text-xs font-medium text-red-400">
                            bloqueado
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center text-gray-400">{t.vehicle_count}</td>
                    <td className="px-4 py-3 text-center text-gray-400">{t.user_count}</td>
                    <td className="px-4 py-3 text-center text-gray-400">{t.lead_count}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-1">
                        {/* Editar */}
                        <Tip label="Editar nome, e-mail e slug do tenant">
                          <button
                            onClick={() => openEdit(t)}
                            className="rounded px-2 py-1 text-xs font-medium bg-gray-800 text-gray-300 border border-gray-700 hover:bg-gray-700"
                          >
                            Editar
                          </button>
                        </Tip>

                        {/* Ativar Pro */}
                        <Tip label="Converte imediatamente para o plano Pro (30 dias, sem cobrança Asaas)">
                          <button
                            onClick={() => action(t.id, 'activate', () => callAdmin(`/tenants/${t.id}/activate`, 'POST', { plan_name: 'pro' }))}
                            disabled={isLoading('activate')}
                            className="rounded px-2 py-1 text-xs font-medium bg-green-900/40 text-green-400 border border-green-800 hover:bg-green-900/60 disabled:opacity-40"
                          >
                            {isLoading('activate') ? '…' : 'Ativar Pro'}
                          </button>
                        </Tip>

                        {/* +7 dias trial */}
                        <Tip label="Adiciona 7 dias ao período de avaliação (acumulativo)">
                          <button
                            onClick={() => action(t.id, 'trial', () => callAdmin(`/tenants/${t.id}/extend-trial`, 'POST', { days: 7 }))}
                            disabled={isLoading('trial')}
                            className="rounded px-2 py-1 text-xs font-medium bg-blue-900/40 text-blue-400 border border-blue-800 hover:bg-blue-900/60 disabled:opacity-40"
                          >
                            {isLoading('trial') ? '…' : '+7 dias trial'}
                          </button>
                        </Tip>

                        {/* + Atendimento */}
                        <Tip label="Ativa o módulo Central de Atendimento (WhatsApp CRM) sem cobrança">
                          <button
                            onClick={() => action(t.id, 'grant', () => callAdmin(`/tenants/${t.id}/features`, 'POST', { feature: 'central_atendimento', note: 'Admin grant' }))}
                            disabled={isLoading('grant')}
                            className="rounded px-2 py-1 text-xs font-medium bg-purple-900/40 text-purple-400 border border-purple-800 hover:bg-purple-900/60 disabled:opacity-40"
                          >
                            {isLoading('grant') ? '…' : '+ Atendimento'}
                          </button>
                        </Tip>

                        {/* Quarentena / Sair Quarentena */}
                        {isQuarantined ? (
                          <Tip label="Remove da quarentena e restaura acesso ao sistema">
                            <button
                              onClick={() => action(t.id, 'unquarantine', () => callAdmin(`/tenants/${t.id}/unquarantine`, 'POST'))}
                              disabled={isLoading('unquarantine')}
                              className="rounded px-2 py-1 text-xs font-medium bg-amber-900/40 text-amber-300 border border-amber-700 hover:bg-amber-900/60 disabled:opacity-40"
                            >
                              {isLoading('unquarantine') ? '…' : 'Sair Quarentena'}
                            </button>
                          </Tip>
                        ) : (
                          <Tip label="Suspende todo acesso (API, painel, WhatsApp) com registro de motivo. Dados preservados.">
                            <button
                              onClick={() => openQuarantine(t)}
                              className="rounded px-2 py-1 text-xs font-medium bg-amber-900/40 text-amber-400 border border-amber-800 hover:bg-amber-900/60"
                            >
                              Quarentena
                            </button>
                          </Tip>
                        )}

                        {/* Bloquear / Desbloquear */}
                        {!isQuarantined && (
                          t.is_active ? (
                            <Tip label="Impede acesso ao sistema sem excluir dados. Billing continua normalmente.">
                              <button
                                onClick={() => action(t.id, 'block', () => callAdmin(`/tenants/${t.id}/block`, 'POST'))}
                                disabled={isLoading('block')}
                                className="rounded px-2 py-1 text-xs font-medium bg-red-900/40 text-red-400 border border-red-800 hover:bg-red-900/60 disabled:opacity-40"
                              >
                                {isLoading('block') ? '…' : 'Bloquear'}
                              </button>
                            </Tip>
                          ) : (
                            <Tip label="Restaura acesso completo ao sistema">
                              <button
                                onClick={() => action(t.id, 'unblock', () => callAdmin(`/tenants/${t.id}/unblock`, 'POST'))}
                                disabled={isLoading('unblock')}
                                className="rounded px-2 py-1 text-xs font-medium bg-gray-700 text-gray-300 border border-gray-600 hover:bg-gray-600 disabled:opacity-40"
                              >
                                {isLoading('unblock') ? '…' : 'Desbloquear'}
                              </button>
                            </Tip>
                          )
                        )}

                        {/* Excluir */}
                        <Tip label="Excluir tenant (lógico ou físico). Requer confirmação.">
                          <button
                            onClick={() => openDelete(t)}
                            className="rounded px-2 py-1 text-xs font-medium bg-red-950/60 text-red-500 border border-red-900 hover:bg-red-900/40"
                          >
                            <TrashIcon />
                          </button>
                        </Tip>
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

      {/* ── Edit Tenant Modal ─────────────────────────────────────────────────── */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={closeEdit}>
          <div className="w-full max-w-sm rounded-2xl border border-gray-700 bg-gray-900 shadow-2xl p-6 space-y-5" onClick={e => e.stopPropagation()}>
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
                <input type="text" value={editName} onChange={e => setEditName(e.target.value)}
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-400">E-mail</label>
                <input type="email" value={editEmail} onChange={e => setEditEmail(e.target.value)}
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-400">Slug (URL da loja)</label>
                <input type="text" value={editSlug}
                  onChange={e => setEditSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-200 font-mono focus:border-primary focus:outline-none" />
                {editSlug !== editing.slug && (
                  <p className="text-[10px] text-yellow-500">Atenção: alterar slug muda a URL pública da loja e da vitrine.</p>
                )}
              </div>
            </div>
            {editMsg && <p className={`text-xs ${editMsg.ok ? 'text-green-400' : 'text-red-400'}`}>{editMsg.text}</p>}
            <div className="flex items-center gap-3 pt-1">
              <button onClick={handleSaveEdit} disabled={pending}
                className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-40 transition-colors">
                {pending ? 'Salvando...' : 'Salvar'}
              </button>
              <button onClick={closeEdit}
                className="rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-400 hover:bg-gray-800 transition-colors">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Quarantine Modal ──────────────────────────────────────────────────── */}
      {quarantining && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={closeQuarantine}>
          <div className="w-full max-w-sm rounded-2xl border border-amber-800/50 bg-gray-900 shadow-2xl p-6 space-y-5" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-900/40 border border-amber-700">
                <svg className="h-5 w-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Quarentena</h3>
                <p className="text-xs text-gray-500 mt-0.5">{quarantining.name} · {quarantining.slug}</p>
              </div>
            </div>

            <div className="rounded-lg border border-amber-800/40 bg-amber-900/10 px-4 py-3 text-xs text-amber-300 space-y-1">
              <p className="font-semibold">O que esta ação faz:</p>
              <p>• Bloqueia todo acesso ao sistema (API, painel, WhatsApp)</p>
              <p>• Registra data, hora e motivo da quarentena</p>
              <p>• Mantém todos os dados, histórico e clientes intactos</p>
              <p>• Billing Asaas não é afetado</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-400">Motivo <span className="text-red-400">*</span></label>
              <textarea
                rows={3}
                value={quarantineReason}
                onChange={e => setQuarantineReason(e.target.value)}
                placeholder="Ex: Suspeita de fraude, chargeback em análise..."
                className="w-full resize-none rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-200 focus:border-amber-600 focus:outline-none"
              />
            </div>

            {quarantineMsg && (
              <p className={`text-xs ${quarantineMsg.ok ? 'text-green-400' : 'text-red-400'}`}>{quarantineMsg.text}</p>
            )}

            <div className="flex items-center gap-3 pt-1">
              <button
                onClick={handleQuarantine}
                disabled={quarantinePending || !quarantineReason.trim()}
                className="flex-1 rounded-lg bg-amber-700 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600 disabled:opacity-40 transition-colors"
              >
                {quarantinePending ? 'Aplicando...' : 'Colocar em Quarentena'}
              </button>
              <button onClick={closeQuarantine}
                className="rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-400 hover:bg-gray-800 transition-colors">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Tenant Modal ───────────────────────────────────────────────── */}
      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={closeDelete}>
          <div className="w-full max-w-md rounded-2xl border border-red-900/60 bg-gray-950 shadow-2xl p-6 space-y-5" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-900/40 border border-red-800">
                <TrashIcon />
              </div>
              <div>
                <h3 className="text-base font-bold text-red-400">Excluir Tenant</h3>
                <p className="text-xs text-gray-500 mt-0.5">{deleting.name} · {deleting.slug}</p>
              </div>
            </div>

            {/* Resumo */}
            {deleteSummary && (
              <div className="rounded-lg border border-gray-800 bg-gray-900 p-4 space-y-2 text-xs">
                <p className="font-semibold text-gray-300 mb-2">Resumo do tenant</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-gray-400">
                  <span>Plano:</span><span className="text-gray-200">{deleteSummary.plan_display}</span>
                  <span>Status:</span><span className="text-gray-200">{deleteSummary.sub_status}</span>
                  <span>Usuários:</span><span className="text-gray-200">{deleteSummary.user_count}</span>
                  <span>Veículos:</span><span className="text-gray-200">{deleteSummary.vehicle_count}</span>
                  <span>Leads:</span><span className="text-gray-200">{deleteSummary.lead_count}</span>
                  <span>Clientes:</span><span className="text-gray-200">{deleteSummary.customer_count}</span>
                </div>
              </div>
            )}

            {/* Modo de exclusão */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-400">Modo de exclusão</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setDeleteMode('soft')}
                  className={`rounded-lg border p-3 text-left transition-colors ${
                    deleteMode === 'soft'
                      ? 'border-orange-700 bg-orange-900/20 text-orange-300'
                      : 'border-gray-700 bg-gray-900 text-gray-400 hover:border-gray-600'
                  }`}
                >
                  <p className="text-xs font-semibold">Exclusão Lógica</p>
                  <p className="text-[10px] mt-1 opacity-80">Oculta o tenant. Dados preservados. Reversível.</p>
                </button>
                <button
                  onClick={() => setDeleteMode('hard')}
                  className={`rounded-lg border p-3 text-left transition-colors ${
                    deleteMode === 'hard'
                      ? 'border-red-700 bg-red-900/20 text-red-300'
                      : 'border-gray-700 bg-gray-900 text-gray-400 hover:border-gray-600'
                  }`}
                >
                  <p className="text-xs font-semibold">Exclusão Física</p>
                  <p className="text-[10px] mt-1 opacity-80">Remove permanentemente todos os dados. Irreversível.</p>
                </button>
              </div>
            </div>

            {/* Motivo */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-400">Motivo</label>
              <input
                type="text"
                value={deleteReason}
                onChange={e => setDeleteReason(e.target.value)}
                placeholder="Ex: Solicitação LGPD, chargeback confirmado..."
                className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-200 focus:border-red-700 focus:outline-none"
              />
            </div>

            {/* Confirmação primária */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-400">
                Digite <span className="font-mono text-red-400 font-bold">EXCLUIR</span> para confirmar
              </label>
              <input
                type="text"
                value={deleteConfirm}
                onChange={e => setDeleteConfirm(e.target.value)}
                placeholder="EXCLUIR"
                className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm font-mono text-red-300 focus:border-red-700 focus:outline-none"
              />
            </div>

            {/* Confirmação dupla para exclusão física */}
            {deleteMode === 'hard' && (
              <div className="space-y-1.5 rounded-lg border border-red-900 bg-red-950/30 p-3">
                <p className="text-xs text-red-400 font-semibold">⚠ Exclusão física é irreversível</p>
                <p className="text-[10px] text-red-400/80">
                  Todos os dados ({deleteSummary ? `${deleteSummary.vehicle_count} veículos, ${deleteSummary.lead_count} leads, ${deleteSummary.user_count} usuários` : 'todos os registros'}) serão permanentemente removidos do banco de dados.
                </p>
                <label className="text-xs font-medium text-gray-400 block mt-2">
                  Digite <span className="font-mono text-red-400 font-bold">SIM, EXCLUIR TUDO</span>
                </label>
                <input
                  type="text"
                  value={hardConfirm}
                  onChange={e => setHardConfirm(e.target.value)}
                  placeholder="SIM, EXCLUIR TUDO"
                  className="w-full rounded-lg border border-red-900 bg-red-950/50 px-3 py-2 text-sm font-mono text-red-300 focus:border-red-700 focus:outline-none"
                />
              </div>
            )}

            {deleteMsg && (
              <p className={`text-xs ${deleteMsg.ok ? 'text-green-400' : 'text-red-400'}`}>{deleteMsg.text}</p>
            )}

            <div className="flex items-center gap-3 pt-1">
              <button
                onClick={handleDelete}
                disabled={deletePending || !canDelete}
                className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-40 transition-colors ${
                  deleteMode === 'hard'
                    ? 'bg-red-700 hover:bg-red-600'
                    : 'bg-orange-700 hover:bg-orange-600'
                }`}
              >
                {deletePending ? 'Excluindo...' : deleteMode === 'hard' ? 'Excluir Permanentemente' : 'Excluir (Lógico)'}
              </button>
              <button onClick={closeDelete}
                className="rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-400 hover:bg-gray-800 transition-colors">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
