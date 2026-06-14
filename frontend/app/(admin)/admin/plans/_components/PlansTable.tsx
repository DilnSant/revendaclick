'use client'

import { Fragment, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

export type PlanRow = {
  id: string
  name: string
  display_name: string
  tagline: string
  max_vehicles: number
  max_users: number
  max_leads: number
  price_monthly: number
  price_yearly: number
  features: string[]
  is_active: boolean
}

const ALL_FEATURES = [
  'financial', 'vendors', 'crm', 'analytics', 'whatsapp_button',
  'kanban', 'automation', 'campaigns', 'central_atendimento',
  'whatsapp_qr', 'ai_assistance', 'lead_recovery', 'api_access',
  'white_label', 'multi_store',
]

export function PlansTable({ rows }: { rows: PlanRow[] }) {
  const router = useRouter()
  const [editing, setEditing]   = useState<PlanRow | null>(null)
  const [form, setForm]         = useState<Partial<PlanRow>>({})
  const [featSet, setFeatSet]   = useState<Set<string>>(new Set())
  const [msg, setMsg]           = useState<{ id: string; ok: boolean; text: string } | null>(null)
  const [pending, start]        = useTransition()

  function openEdit(p: PlanRow) {
    setEditing(p)
    setForm({ ...p })
    setFeatSet(new Set(p.features))
    setMsg(null)
  }

  function closeEdit() { setEditing(null) }

  function toggleFeat(f: string) {
    setFeatSet(prev => {
      const next = new Set(prev)
      next.has(f) ? next.delete(f) : next.add(f)
      return next
    })
  }

  function handleSave() {
    if (!editing) return
    start(async () => {
      const body: Record<string, unknown> = {}
      if (form.display_name !== editing.display_name) body.display_name = form.display_name
      if (form.tagline !== editing.tagline)           body.tagline       = form.tagline
      if (form.max_vehicles !== editing.max_vehicles) body.max_vehicles  = Number(form.max_vehicles)
      if (form.max_users !== editing.max_users)       body.max_users     = Number(form.max_users)
      if (form.max_leads !== editing.max_leads)       body.max_leads     = Number(form.max_leads)
      if (form.price_monthly !== editing.price_monthly) body.price_monthly = Number(form.price_monthly)
      if (form.price_yearly !== editing.price_yearly)   body.price_yearly  = Number(form.price_yearly)
      if (form.is_active !== editing.is_active)         body.is_active     = form.is_active
      const newFeats = [...featSet].sort()
      const oldFeats = [...editing.features].sort()
      if (JSON.stringify(newFeats) !== JSON.stringify(oldFeats)) body.features = newFeats

      if (Object.keys(body).length === 0) { closeEdit(); return }

      try {
        const res = await fetch(`/api/admin/plans/${editing.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        const json = await res.json()
        if (!res.ok) {
          setMsg({ id: editing.id, ok: false, text: json.error ?? 'Erro ao atualizar' })
        } else {
          setMsg({ id: editing.id, ok: true, text: 'Plano atualizado com sucesso!' })
          closeEdit()
          router.refresh()
        }
      } catch {
        setMsg({ id: editing.id, ok: false, text: 'Erro de rede' })
      }
    })
  }

  return (
    <>
      <div className="rounded-xl border border-gray-800 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-800 bg-gray-900/60">
          <h2 className="text-sm font-semibold text-gray-300">Planos cadastrados</h2>
        </div>
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 bg-gray-900/80 text-left">
              {['Nome DB', 'Display', 'Preço/mês', 'Preço/ano', 'Veículos', 'Usuários', 'Status', 'Features', 'Ações'].map(h => (
                <th key={h} className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-gray-600 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/60">
            {rows.map(p => (
              <Fragment key={p.id}>
                <tr className="hover:bg-gray-900/30 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-red-300">{p.name}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-200">{p.display_name}</td>
                  <td className="px-4 py-3 text-sm text-gray-300 whitespace-nowrap">
                    {p.price_monthly.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-400 whitespace-nowrap">
                    {p.price_yearly.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </td>
                  <td className="px-4 py-3 text-center text-sm text-gray-400">
                    {p.max_vehicles === -1 ? '∞' : p.max_vehicles}
                  </td>
                  <td className="px-4 py-3 text-center text-sm text-gray-400">
                    {p.max_users === -1 ? '∞' : p.max_users}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${p.is_active ? 'bg-green-900/40 text-green-400 border-green-800' : 'bg-gray-800 text-gray-500 border-gray-700'}`}>
                      {p.is_active ? 'ativo' : 'inativo'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                      {p.features.map(f => (
                        <span key={f} className="inline-flex rounded bg-gray-800 border border-gray-700 px-1.5 py-0.5 text-[10px] text-gray-400">
                          {f}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => openEdit(p)}
                      className="rounded-md bg-gray-800 border border-gray-700 px-2.5 py-1 text-xs font-medium text-gray-300 hover:bg-gray-700 transition-colors"
                    >
                      Editar
                    </button>
                  </td>
                </tr>
                {msg?.id === p.id && (
                  <tr>
                    <td colSpan={9} className="px-4 py-1.5">
                      <p className={`text-xs ${msg.ok ? 'text-green-400' : 'text-red-400'}`}>{msg.text}</p>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={closeEdit}>
          <div
            className="w-full max-w-2xl rounded-2xl border border-gray-700 bg-gray-900 shadow-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Editar Plano</h3>
                <p className="text-xs text-gray-500 mt-0.5 font-mono">{editing.name}</p>
              </div>
              <button onClick={closeEdit} className="text-gray-600 hover:text-gray-400">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Display name">
                <input
                  type="text"
                  value={form.display_name ?? ''}
                  onChange={e => setForm(f => ({ ...f, display_name: e.target.value }))}
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none"
                />
              </Field>
              <Field label="Tagline">
                <input
                  type="text"
                  value={form.tagline ?? ''}
                  onChange={e => setForm(f => ({ ...f, tagline: e.target.value }))}
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none"
                />
              </Field>
              <Field label="Preço mensal (R$)">
                <input
                  type="number"
                  step="0.01"
                  value={form.price_monthly ?? ''}
                  onChange={e => setForm(f => ({ ...f, price_monthly: Number(e.target.value) }))}
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none"
                />
              </Field>
              <Field label="Preço anual (R$)">
                <input
                  type="number"
                  step="0.01"
                  value={form.price_yearly ?? ''}
                  onChange={e => setForm(f => ({ ...f, price_yearly: Number(e.target.value) }))}
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none"
                />
              </Field>
              <Field label="Máx veículos (-1 = ilimitado)">
                <input
                  type="number"
                  value={form.max_vehicles ?? ''}
                  onChange={e => setForm(f => ({ ...f, max_vehicles: Number(e.target.value) }))}
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none"
                />
              </Field>
              <Field label="Máx usuários (-1 = ilimitado)">
                <input
                  type="number"
                  value={form.max_users ?? ''}
                  onChange={e => setForm(f => ({ ...f, max_users: Number(e.target.value) }))}
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none"
                />
              </Field>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-400">Status</label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_active ?? false}
                  onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
                  className="rounded border-gray-600 bg-gray-900"
                />
                <span className="text-sm text-gray-300">Ativo (visível no pricing)</span>
              </label>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-400">Features ({featSet.size} selecionadas)</label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {ALL_FEATURES.map(f => (
                  <label key={f} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={featSet.has(f)}
                      onChange={() => toggleFeat(f)}
                      className="rounded border-gray-600 bg-gray-900 text-primary focus:ring-primary"
                    />
                    <span className="text-xs text-gray-400 font-mono">{f}</span>
                  </label>
                ))}
              </div>
              <p className="text-[10px] text-yellow-500">
                Atenção: alterar features afeta todos os tenants neste plano imediatamente.
              </p>
            </div>

            {msg && msg.id === editing.id && (
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
