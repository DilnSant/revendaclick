'use client'

import { Fragment, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

export type SubRow = {
  id: string
  tenant_id: string
  status: string
  billing_cycle: string
  current_period_end: string | null
  trial_ends_at: string | null
  grace_until: string | null
  canceled_at: string | null
  asaas_subscription_id: string | null
  created_at: string
  tenant_slug: string
  tenant_name: string
  tenant_email: string
  plan_name: string
  plan_display: string
  price_monthly: number
  active_addons: string[]
}

const STATUS_COLOR: Record<string, string> = {
  active:   'bg-green-900/40 text-green-400 border-green-800',
  trialing: 'bg-blue-900/40 text-blue-400 border-blue-800',
  past_due: 'bg-orange-900/40 text-orange-400 border-orange-800',
  canceled: 'bg-red-900/40 text-red-400 border-red-800',
  paused:   'bg-gray-700 text-gray-400 border-gray-600',
}

const PLANS  = ['starter', 'pro', 'premium', 'scale']
const STATUSES = ['active', 'trialing', 'past_due', 'canceled', 'paused']

function toDateInput(iso: string | null | undefined) {
  if (!iso) return ''
  return iso.slice(0, 10)
}

export function SubscriptionsTable({ rows }: { rows: SubRow[] }) {
  const router = useRouter()
  const [editing, setEditing] = useState<SubRow | null>(null)
  const [form, setForm]       = useState<EditForm>({})
  const [msg, setMsg]         = useState<{ id: string; ok: boolean; text: string } | null>(null)
  const [pending, start]      = useTransition()

  function openEdit(row: SubRow) {
    setEditing(row)
    setForm({
      plan_name:          row.plan_name,
      status:             row.status,
      current_period_end: toDateInput(row.current_period_end),
      trial_ends_at:      toDateInput(row.trial_ends_at),
      grace_until:        toDateInput(row.grace_until),
      clear_trial:        false,
      clear_grace:        false,
    })
    setMsg(null)
  }

  function closeEdit() {
    setEditing(null)
    setForm({})
  }

  function handleSave() {
    if (!editing) return
    start(async () => {
      const body: Record<string, unknown> = {}
      if (form.plan_name && form.plan_name !== editing.plan_name)
        body.plan_name = form.plan_name
      if (form.status && form.status !== editing.status)
        body.status = form.status
      if (form.current_period_end)
        body.current_period_end = new Date(form.current_period_end).toISOString()
      if (form.clear_trial) {
        body.clear_trial_end = true
      } else if (form.trial_ends_at) {
        body.trial_ends_at = new Date(form.trial_ends_at).toISOString()
      }
      if (form.clear_grace) {
        body.clear_grace_until = true
      } else if (form.grace_until) {
        body.grace_until = new Date(form.grace_until).toISOString()
      }

      try {
        const res = await fetch(`/api/admin/subscriptions/${editing.tenant_id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        const json = await res.json()
        if (!res.ok) {
          setMsg({ id: editing.tenant_id, ok: false, text: json.error ?? 'Erro ao atualizar' })
        } else {
          setMsg({ id: editing.tenant_id, ok: true, text: 'Atualizado com sucesso!' })
          closeEdit()
          router.refresh()
        }
      } catch {
        setMsg({ id: editing.tenant_id, ok: false, text: 'Erro de rede' })
      }
    })
  }

  function handleCancel(row: SubRow) {
    start(async () => {
      const now = new Date().toISOString()
      const res = await fetch(`/api/admin/subscriptions/${row.tenant_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'canceled', canceled_at: now }),
      })
      const json = await res.json()
      if (!res.ok) {
        setMsg({ id: row.tenant_id, ok: false, text: json.error ?? 'Erro' })
      } else {
        setMsg({ id: row.tenant_id, ok: true, text: 'Cancelada!' })
        router.refresh()
      }
    })
  }

  return (
    <>
      <div className="rounded-xl border border-gray-800 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-800 bg-gray-900/60">
          <h2 className="text-sm font-semibold text-gray-300">{rows.length} assinaturas</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-900/80 text-left">
                {['Tenant', 'Plano', 'Valor/mês', 'Status', 'Add-ons', 'Fim período', 'Trial até', 'Ações'].map(h => (
                  <th key={h} className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-gray-600 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {rows.map(row => (
                <Fragment key={row.id}>
                  <tr className="hover:bg-gray-900/30 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-200 whitespace-nowrap">{row.tenant_name}</p>
                      <p className="text-xs text-gray-600">{row.tenant_email}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-300 whitespace-nowrap">
                      {row.plan_display || row.plan_name}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                      {row.price_monthly.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap ${STATUS_COLOR[row.status] ?? 'bg-gray-800 text-gray-500 border-gray-700'}`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {row.active_addons.length > 0 ? row.active_addons.join(', ') : '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">
                      {row.current_period_end ? new Date(row.current_period_end).toLocaleDateString('pt-BR') : '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">
                      {row.trial_ends_at ? new Date(row.trial_ends_at).toLocaleDateString('pt-BR') : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEdit(row)}
                          className="rounded-md bg-gray-800 border border-gray-700 px-2.5 py-1 text-xs font-medium text-gray-300 hover:bg-gray-700 transition-colors whitespace-nowrap"
                        >
                          Editar
                        </button>
                        {row.status !== 'canceled' && (
                          <button
                            onClick={() => handleCancel(row)}
                            disabled={pending}
                            className="rounded-md bg-red-900/30 border border-red-800/60 px-2.5 py-1 text-xs font-medium text-red-400 hover:bg-red-900/50 transition-colors disabled:opacity-40 whitespace-nowrap"
                          >
                            Cancelar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>

                  {/* Inline result message */}
                  {msg?.id === row.tenant_id && (
                    <tr>
                      <td colSpan={8} className="px-4 py-2">
                        <p className={`text-xs ${msg.ok ? 'text-green-400' : 'text-red-400'}`}>{msg.text}</p>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
          {rows.length === 0 && (
            <div className="py-12 text-center text-sm text-gray-700">Nenhuma assinatura encontrada.</div>
          )}
        </div>
      </div>

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={closeEdit}>
          <div
            className="w-full max-w-md rounded-2xl border border-gray-700 bg-gray-900 shadow-2xl p-6 space-y-5"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Editar Assinatura</h3>
                <p className="text-xs text-gray-500 mt-0.5">{editing.tenant_name} · {editing.tenant_slug}</p>
              </div>
              <button onClick={closeEdit} className="text-gray-600 hover:text-gray-400">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <Field label="Plano">
                <select
                  value={form.plan_name ?? ''}
                  onChange={e => setForm(f => ({ ...f, plan_name: e.target.value }))}
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none"
                >
                  {PLANS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </Field>

              <Field label="Status">
                <select
                  value={form.status ?? ''}
                  onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none"
                >
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>

              <Field label="Fim do período">
                <input
                  type="date"
                  value={form.current_period_end ?? ''}
                  onChange={e => setForm(f => ({ ...f, current_period_end: e.target.value }))}
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none"
                />
              </Field>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-gray-400">Trial até</label>
                  <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.clear_trial ?? false}
                      onChange={e => setForm(f => ({ ...f, clear_trial: e.target.checked }))}
                      className="rounded border-gray-600 bg-gray-900"
                    />
                    Limpar
                  </label>
                </div>
                <input
                  type="date"
                  value={form.trial_ends_at ?? ''}
                  disabled={form.clear_trial}
                  onChange={e => setForm(f => ({ ...f, trial_ends_at: e.target.value }))}
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none disabled:opacity-40"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-gray-400">Grace until</label>
                  <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.clear_grace ?? false}
                      onChange={e => setForm(f => ({ ...f, clear_grace: e.target.checked }))}
                      className="rounded border-gray-600 bg-gray-900"
                    />
                    Limpar
                  </label>
                </div>
                <input
                  type="date"
                  value={form.grace_until ?? ''}
                  disabled={form.clear_grace}
                  onChange={e => setForm(f => ({ ...f, grace_until: e.target.value }))}
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none disabled:opacity-40"
                />
              </div>
            </div>

            {msg && msg.id === editing.tenant_id && (
              <p className={`text-xs ${msg.ok ? 'text-green-400' : 'text-red-400'}`}>{msg.text}</p>
            )}

            <div className="flex items-center gap-3 pt-1">
              <button
                onClick={handleSave}
                disabled={pending}
                className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-40 transition-colors"
              >
                {pending ? 'Salvando...' : 'Salvar alterações'}
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-gray-400">{label}</label>
      {children}
    </div>
  )
}

interface EditForm {
  plan_name?: string
  status?: string
  current_period_end?: string
  trial_ends_at?: string
  grace_until?: string
  clear_trial?: boolean
  clear_grace?: boolean
}
