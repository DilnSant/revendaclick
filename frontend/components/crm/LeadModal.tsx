'use client'

import { useState, useTransition, useEffect } from 'react'
import { type Lead, type Seller } from '@/lib/crm'
import { createLead } from '@/app/(dashboard)/leads/actions'

interface Props {
  sellers: Seller[]
  onClose: () => void
  onCreated: (lead: Lead) => void
}

export default function LeadModal({ sellers, onClose, onCreated }: Props) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    message: '',
    seller_id: '',
  })

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function set(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim() || !form.phone.trim()) return
    setError(null)

    startTransition(async () => {
      const result = await createLead({
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || undefined,
        message: form.message.trim() || undefined,
        seller_id: form.seller_id || undefined,
        source: 'crm',
      })

      if (result.error) {
        setError(result.error.message)
        return
      }
      onCreated(result.data!)
    })
  }

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />

      {/* Dialog */}
      <div
        role="dialog"
        aria-modal
        className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2
                   -translate-y-1/2 rounded-2xl border border-gray-200 bg-white
                   p-6 shadow-2xl"
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900">Novo lead</h2>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Nome <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={set('name')}
              placeholder="Nome do lead"
              required
              className="input w-full"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Telefone <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={form.phone}
              onChange={set('phone')}
              placeholder="(99) 99999-9999"
              required
              className="input w-full"
            />
          </div>

          {/* Email */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">E-mail</label>
            <input
              type="email"
              value={form.email}
              onChange={set('email')}
              placeholder="email@exemplo.com"
              className="input w-full"
            />
          </div>

          {/* Seller */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Vendedor</label>
            <select
              value={form.seller_id}
              onChange={set('seller_id')}
              className="input w-full"
            >
              <option value="">Sem vendedor</option>
              {sellers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.display_name}
                </option>
              ))}
            </select>
          </div>

          {/* Message */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Mensagem</label>
            <textarea
              value={form.message}
              onChange={set('message')}
              placeholder="Interesse do lead…"
              rows={3}
              className="input w-full resize-none"
            />
          </div>

          {error && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-gray-200 py-2 text-sm font-medium
                         text-gray-600 transition-colors hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending || !form.name.trim() || !form.phone.trim()}
              className="btn-primary flex-1 text-sm disabled:opacity-50"
            >
              {isPending ? 'Criando…' : 'Criar lead'}
            </button>
          </div>
        </form>
      </div>
    </>
  )
}
