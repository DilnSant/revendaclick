'use client'

import { useEffect, useRef, useTransition } from 'react'
import type { Customer, CreateCustomerPayload } from '@/lib/customers'
import { BR_STATES } from '@/lib/customers'
import { createCustomer, updateCustomer } from '@/app/(dashboard)/customers/actions'
import type { ToastMessage } from '@/components/ui/Toast'

interface Props {
  customer: Customer | null
  onClose: () => void
  onToast: (t: Omit<ToastMessage, 'id'>) => void
}

export default function CustomerModal({ customer, onClose, onToast }: Props) {
  const isEdit = customer !== null
  const [pending, startTransition] = useTransition()
  const firstInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    firstInputRef.current?.focus()
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)

    const payload: CreateCustomerPayload = {
      name:          (fd.get('name') as string).trim(),
      email:         (fd.get('email') as string).trim() || null,
      phone:         (fd.get('phone') as string).trim() || null,
      cpf_cnpj:      (fd.get('cpf_cnpj') as string).trim() || null,
      address_city:  (fd.get('address_city') as string).trim() || null,
      address_state: (fd.get('address_state') as string) || null,
      notes:         (fd.get('notes') as string).trim() || null,
    }

    startTransition(async () => {
      const result = isEdit
        ? await updateCustomer(customer.id, payload)
        : await createCustomer(payload)

      if (result.error) {
        onToast({ type: 'error', text: result.error.message })
        return
      }
      onToast({ type: 'success', text: isEdit ? 'Cliente atualizado.' : 'Cliente cadastrado.' })
      onClose()
    })
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-base font-semibold text-gray-900">
            {isEdit ? 'Editar cliente' : 'Novo cliente'}
          </h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="label">Nome *</label>
            <input
              ref={firstInputRef}
              name="name"
              defaultValue={customer?.name ?? ''}
              required
              maxLength={120}
              className="input"
              placeholder="Nome completo ou razão social"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">E-mail</label>
              <input
                name="email"
                type="email"
                defaultValue={customer?.email ?? ''}
                className="input"
                placeholder="email@exemplo.com"
              />
            </div>
            <div>
              <label className="label">Telefone</label>
              <input
                name="phone"
                type="tel"
                defaultValue={customer?.phone ?? ''}
                className="input"
                placeholder="(11) 99999-9999"
              />
            </div>
          </div>

          <div>
            <label className="label">CPF / CNPJ</label>
            <input
              name="cpf_cnpj"
              defaultValue={customer?.cpf_cnpj ?? ''}
              className="input"
              placeholder="000.000.000-00 ou 00.000.000/0001-00"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Cidade</label>
              <input
                name="address_city"
                defaultValue={customer?.address_city ?? ''}
                className="input"
                placeholder="São Paulo"
              />
            </div>
            <div>
              <label className="label">UF</label>
              <select
                name="address_state"
                defaultValue={customer?.address_state?.trim() ?? ''}
                className="input"
              >
                <option value="">Selecione</option>
                {BR_STATES.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="label">Observações</label>
            <textarea
              name="notes"
              rows={3}
              defaultValue={customer?.notes ?? ''}
              className="input resize-none"
              placeholder="Informações adicionais sobre o cliente..."
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-ghost">
              Cancelar
            </button>
            <button type="submit" disabled={pending} className="btn-primary">
              {pending ? 'Salvando…' : isEdit ? 'Salvar alterações' : 'Cadastrar cliente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
