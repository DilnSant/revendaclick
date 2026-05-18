'use client'

import { useState, useTransition } from 'react'
import { createEntry } from '@/app/(dashboard)/financial/actions'

const CATEGORIES_INCOME  = ['vehicle_sale','commission','service','financing','other']
const CATEGORIES_EXPENSE = ['operational','marketing','salary','rent','tax','other']
const CATEGORY_LABELS: Record<string, string> = {
  vehicle_sale: 'Venda de veículo', commission: 'Comissão', service: 'Serviço',
  financing: 'Financiamento', operational: 'Operacional', marketing: 'Marketing',
  salary: 'Salário', rent: 'Aluguel', tax: 'Impostos', other: 'Outros',
}

export default function NewEntryModal() {
  const [open, setOpen] = useState(false)
  const [type, setType] = useState<'income' | 'expense'>('income')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const categories = type === 'income' ? CATEGORIES_INCOME : CATEGORIES_EXPENSE

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await createEntry(fd)
      if (result.error) {
        setError(result.error)
      } else {
        setOpen(false)
        setError(null)
      }
    })
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-primary shrink-0">
        + Novo lançamento
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h2 className="text-base font-semibold text-gray-900">Novo lançamento</h2>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
              {/* Type toggle */}
              <div className="flex rounded-lg border border-gray-200 overflow-hidden">
                {(['income', 'expense'] as const).map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={`flex-1 py-2 text-sm font-medium transition-colors
                      ${type === t
                        ? t === 'income' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                        : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                  >
                    {t === 'income' ? 'Entrada' : 'Saída'}
                  </button>
                ))}
              </div>
              <input type="hidden" name="type" value={type} />

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label">Descrição *</label>
                  <input name="description" required className="input" placeholder="Ex: Venda Honda Civic" />
                </div>
                <div>
                  <label className="label">Valor *</label>
                  <input name="amount" type="number" step="0.01" min="0.01" required className="input" placeholder="0,00" />
                </div>
                <div>
                  <label className="label">Categoria *</label>
                  <select name="category" required className="input">
                    {categories.map(c => (
                      <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Forma de pagamento</label>
                  <select name="payment_method" className="input">
                    <option value="cash">Dinheiro</option>
                    <option value="pix">PIX</option>
                    <option value="credit_card">Cartão de crédito</option>
                    <option value="debit_card">Cartão de débito</option>
                    <option value="bank_transfer">Transferência</option>
                    <option value="financing">Financiamento</option>
                    <option value="other">Outro</option>
                  </select>
                </div>
                <div>
                  <label className="label">Status</label>
                  <select name="status" className="input">
                    <option value="paid">Pago</option>
                    <option value="pending">Pendente</option>
                  </select>
                </div>
                <div>
                  <label className="label">Data de vencimento</label>
                  <input name="due_date" type="date" className="input" />
                </div>
              </div>

              <div>
                <label className="label">Observações</label>
                <textarea name="notes" rows={2} className="input resize-none" placeholder="Opcional" />
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setOpen(false)} className="btn-secondary">
                  Cancelar
                </button>
                <button type="submit" disabled={pending} className="btn-primary">
                  {pending ? 'Salvando…' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
