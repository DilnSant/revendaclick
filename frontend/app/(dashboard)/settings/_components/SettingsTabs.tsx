'use client'

import { useState, useTransition } from 'react'
import { updateTenantProfile } from '../actions'
import type { User } from '@/lib/users'
import { ROLE_LABELS, ROLE_COLORS, userInitials } from '@/lib/users'
import type { ToastMessage } from '@/components/ui/Toast'
import ToastContainer from '@/components/ui/Toast'
import { useRef } from 'react'

interface TenantData {
  id: string
  slug: string
  name: string
  email: string
  phone_whatsapp: string
  description: string | null
  seo_title: string | null
  seo_description: string | null
}

interface Props {
  tab: string
  tenant: TenantData
  users: User[]
}

export default function SettingsTabs({ tab, tenant, users }: Props) {
  const [toasts, setToasts]         = useState<ToastMessage[]>([])
  const toastIdRef                  = useRef(0)

  function addToast(t: Omit<ToastMessage, 'id'>) {
    setToasts(prev => [...prev, { ...t, id: ++toastIdRef.current }])
  }

  return (
    <>
      {/* Tabs nav */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex gap-1">
          {[
            { key: 'store',  label: 'Loja' },
            { key: 'users',  label: 'Usuários' },
            { key: 'plan',   label: 'Plano' },
          ].map(({ key, label }) => (
            <a
              key={key}
              href={`/settings?tab=${key}`}
              className={`px-4 pb-3 text-sm font-medium border-b-2 transition-colors ${
                tab === key
                  ? 'border-red-600 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {label}
            </a>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      {tab === 'store'  && <StoreTab tenant={tenant} onToast={addToast} />}
      {tab === 'users'  && <UsersTab users={users} />}
      {tab === 'plan'   && <PlanTab />}

      <ToastContainer toasts={toasts} onDismiss={id => setToasts(p => p.filter(t => t.id !== id))} />
    </>
  )
}

// ─── Store Tab ────────────────────────────────────────────────────────────────

function StoreTab({ tenant, onToast }: { tenant: TenantData; onToast: (t: Omit<ToastMessage, 'id'>) => void }) {
  const [form, setForm] = useState({
    name:            tenant.name,
    phone_whatsapp:  tenant.phone_whatsapp,
    description:     tenant.description ?? '',
    seo_title:       tenant.seo_title ?? '',
    seo_description: tenant.seo_description ?? '',
  })
  const [pending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const result = await updateTenantProfile({
        name:            form.name.trim() || undefined,
        phone_whatsapp:  form.phone_whatsapp.trim() || undefined,
        description:     form.description.trim() || undefined,
        seo_title:       form.seo_title.trim() || undefined,
        seo_description: form.seo_description.trim() || undefined,
      })
      if (result.error) {
        onToast({ type: 'error', text: result.error.message })
      } else {
        onToast({ type: 'success', text: 'Loja atualizada com sucesso.' })
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
        <h2 className="text-base font-semibold text-gray-900">Dados da loja</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Nome da loja *</label>
            <input
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              required maxLength={80}
              className="input"
            />
          </div>
          <div>
            <label className="label">WhatsApp *</label>
            <input
              value={form.phone_whatsapp}
              onChange={e => setForm(f => ({ ...f, phone_whatsapp: e.target.value }))}
              required
              className="input"
              placeholder="(11) 99999-9999"
            />
          </div>
        </div>

        <div>
          <label className="label">Endereço da loja</label>
          <div className="flex items-center rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500">
            revendaclick.app/<span className="font-medium text-gray-700">{tenant.slug}</span>
          </div>
          <p className="mt-1 text-xs text-gray-400">O slug não pode ser alterado.</p>
        </div>

        <div>
          <label className="label">Descrição da loja</label>
          <textarea
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            rows={3} maxLength={500}
            className="input resize-none"
            placeholder="Descreva sua loja para os clientes..."
          />
        </div>
      </div>

      <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
        <h2 className="text-base font-semibold text-gray-900">SEO</h2>
        <div>
          <label className="label">Título SEO <span className="text-gray-400">({form.seo_title.length}/70)</span></label>
          <input
            value={form.seo_title}
            onChange={e => setForm(f => ({ ...f, seo_title: e.target.value }))}
            maxLength={70}
            className="input"
            placeholder={`${tenant.name} — Veículos`}
          />
        </div>
        <div>
          <label className="label">Meta description <span className="text-gray-400">({form.seo_description.length}/160)</span></label>
          <textarea
            value={form.seo_description}
            onChange={e => setForm(f => ({ ...f, seo_description: e.target.value }))}
            rows={2} maxLength={160}
            className="input resize-none"
            placeholder="Descrição breve para mecanismos de busca..."
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button type="submit" disabled={pending} className="btn-primary">
          {pending ? 'Salvando…' : 'Salvar alterações'}
        </button>
      </div>
    </form>
  )
}

// ─── Users Tab ────────────────────────────────────────────────────────────────

function UsersTab({ users }: { users: User[] }) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3.5">
          <h2 className="text-base font-semibold text-gray-900">
            Equipe
            <span className="ml-2 text-sm font-normal text-gray-400">{users.length} usuário{users.length !== 1 ? 's' : ''}</span>
          </h2>
          <a href="/vendors" className="text-xs font-medium text-red-600 hover:text-red-700">
            Gerenciar vendedores →
          </a>
        </div>

        {users.length === 0 ? (
          <p className="py-12 text-center text-sm text-gray-400">Nenhum usuário cadastrado.</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {users.map(u => (
              <div key={u.id} className="flex items-center gap-3 px-5 py-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-600">
                  {userInitials(u.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{u.name}</p>
                  <p className="text-xs text-gray-400 truncate">{u.email}</p>
                </div>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${ROLE_COLORS[u.role] ?? ROLE_COLORS.viewer}`}>
                  {ROLE_LABELS[u.role] ?? u.role}
                </span>
                <span className={`h-2 w-2 shrink-0 rounded-full ${u.is_active ? 'bg-green-400' : 'bg-gray-300'}`} />
              </div>
            ))}
          </div>
        )}
      </div>
      <p className="text-xs text-gray-400">
        Convidar e remover usuários disponível em breve.
      </p>
    </div>
  )
}

// ─── Plan Tab ─────────────────────────────────────────────────────────────────

function PlanTab() {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
      <h2 className="text-base font-semibold text-gray-900">Plano e assinatura</h2>
      <p className="text-sm text-gray-500">
        Gerencie seu plano, histórico de pagamentos e dados de faturamento.
      </p>
      <div className="rounded-lg bg-gray-50 border border-dashed border-gray-200 p-4 text-sm text-gray-500 text-center">
        Integração com pagamentos disponível em breve.
      </div>
    </div>
  )
}
