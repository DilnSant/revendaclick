'use client'

import { useState, useTransition } from 'react'
import { completeSale, cancelSale, createSale, type Sale } from '@/app/(dashboard)/sales/actions'

interface Vehicle { id: string; title: string; brand: string; model: string; price: number; status: string }
interface User    { id: string; name: string; role: string }
interface Customer { id: string; name: string }

interface Props {
  sales: Sale[]
  vehicles: Vehicle[]
  sellers: User[]
  customers: Customer[]
}

const STATUS_STYLE: Record<string, string> = {
  pending:   'bg-yellow-100 text-yellow-700',
  completed: 'bg-green-100 text-green-700',
  canceled:  'bg-gray-100 text-gray-500',
}

const STATUS_LABEL: Record<string, string> = {
  pending:   'Pendente',
  completed: 'Concluída',
  canceled:  'Cancelada',
}

const PM_LABELS: Record<string, string> = {
  cash: 'Dinheiro', pix: 'PIX', bank_transfer: 'Transferência',
  credit_card: 'Cartão crédito', debit_card: 'Cartão débito',
  financing: 'Financiamento', check: 'Cheque', other: 'Outro',
}

const FT_LABELS: Record<string, string> = {
  none: 'Sem financiamento', own: 'Financiamento próprio',
  bank: 'Banco', consortium: 'Consórcio',
}

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function SalesView({ sales: initialSales, vehicles, sellers, customers }: Props) {
  const [sales, setSales] = useState(initialSales)
  const [showModal, setShowModal] = useState(false)
  const [pending, startTransition] = useTransition()
  const [toast, setToast] = useState<string | null>(null)

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3500)
  }

  function handleComplete(saleId: string) {
    if (!confirm('Confirmar conclusão da venda? O veículo será marcado como vendido e a receita será lançada.')) return
    startTransition(async () => {
      const result = await completeSale(saleId)
      if (result.error) { showToast(result.error.message); return }
      setSales(prev => prev.map(s => s.id === saleId ? { ...s, status: 'completed' } : s))
      showToast('Venda concluída com sucesso!')
    })
  }

  function handleCancel(saleId: string) {
    if (!confirm('Cancelar esta venda?')) return
    startTransition(async () => {
      const result = await cancelSale(saleId)
      if (result.error) { showToast(result.error.message); return }
      setSales(prev => prev.map(s => s.id === saleId ? { ...s, status: 'canceled' } : s))
      showToast('Venda cancelada.')
    })
  }

  function handleCreated(sale: Sale) {
    setSales(prev => [sale, ...prev])
    setShowModal(false)
    showToast('Venda registrada!')
  }

  const completed = sales.filter(s => s.status === 'completed')
  const pending_  = sales.filter(s => s.status === 'pending')
  const revenue   = completed.reduce((s, x) => s + x.sale_price, 0)

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 rounded-lg bg-gray-900 px-4 py-3 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vendas</h1>
          <p className="mt-0.5 text-sm text-gray-500">Controle de vendas e comissões</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary shrink-0"
          disabled={vehicles.filter(v => v.status === 'available').length === 0}
        >
          + Registrar venda
        </button>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Receita total</p>
          <p className="mt-1 text-2xl font-bold text-green-600">{fmt(revenue)}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Concluídas</p>
          <p className="mt-1 text-3xl font-bold text-gray-900">{completed.length}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Pendentes</p>
          <p className="mt-1 text-3xl font-bold text-yellow-600">{pending_.length}</p>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                <th className="th">Veículo</th>
                <th className="th text-right">Valor</th>
                <th className="th hidden md:table-cell">Pagamento</th>
                <th className="th hidden lg:table-cell">Data</th>
                <th className="th">Status</th>
                <th className="th">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {sales.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-sm text-gray-400">
                    Nenhuma venda registrada ainda.
                  </td>
                </tr>
              ) : (
                sales.map(s => {
                  const vehicle = vehicles.find(v => v.id === s.vehicle_id)
                  return (
                    <tr key={s.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="td">
                        <p className="font-medium text-gray-900 text-sm">
                          {vehicle ? `${vehicle.brand} ${vehicle.model}` : s.vehicle_id.slice(0, 8) + '…'}
                        </p>
                        {vehicle && (
                          <p className="text-xs text-gray-400">{vehicle.title}</p>
                        )}
                      </td>
                      <td className="td text-right font-semibold text-gray-900 text-sm">
                        {fmt(s.sale_price)}
                        {s.discount > 0 && (
                          <p className="text-xs text-gray-400">-{fmt(s.discount)} desconto</p>
                        )}
                      </td>
                      <td className="td hidden md:table-cell text-sm text-gray-600">
                        {PM_LABELS[s.payment_method] ?? s.payment_method}
                      </td>
                      <td className="td hidden lg:table-cell text-sm text-gray-500">
                        {s.sold_at
                          ? new Date(s.sold_at).toLocaleDateString('pt-BR')
                          : new Date(s.created_at).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="td">
                        <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLE[s.status] ?? 'bg-gray-100 text-gray-500'}`}>
                          {STATUS_LABEL[s.status] ?? s.status}
                        </span>
                      </td>
                      <td className="td">
                        {s.status === 'pending' && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleComplete(s.id)}
                              disabled={pending}
                              className="rounded-md bg-green-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
                            >
                              Concluir
                            </button>
                            <button
                              onClick={() => handleCancel(s.id)}
                              disabled={pending}
                              className="rounded-md bg-gray-200 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-300 disabled:opacity-50"
                            >
                              Cancelar
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create modal */}
      {showModal && (
        <SaleModal
          vehicles={vehicles.filter(v => v.status === 'available')}
          sellers={sellers}
          customers={customers}
          onClose={() => setShowModal(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  )
}

// ─── Sale creation modal ──────────────────────────────────────────────────────

function SaleModal({
  vehicles, sellers, customers, onClose, onCreated,
}: {
  vehicles: Vehicle[]
  sellers: User[]
  customers: Customer[]
  onClose: () => void
  onCreated: (s: Sale) => void
}) {
  const [form, setForm] = useState({
    vehicle_id: '',
    seller_id: '',
    customer_id: '',
    sale_price: '',
    list_price: '',
    discount: '0',
    financing_type: 'none',
    financing_amount: '',
    payment_method: 'pix',
    notes: '',
  })
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  function set(k: string, v: string) {
    setForm(prev => ({ ...prev, [k]: v }))
  }

  // Auto-fill list_price from selected vehicle
  function handleVehicleChange(id: string) {
    const v = vehicles.find(x => x.id === id)
    setForm(prev => ({
      ...prev,
      vehicle_id: id,
      list_price: v ? String(v.price) : prev.list_price,
      sale_price: v ? String(v.price) : prev.sale_price,
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!form.vehicle_id) { setError('Selecione um veículo'); return }
    const salePrice = parseFloat(form.sale_price)
    const listPrice = parseFloat(form.list_price)
    if (isNaN(salePrice) || salePrice <= 0) { setError('Valor de venda inválido'); return }
    if (isNaN(listPrice) || listPrice <= 0) { setError('Preço de tabela inválido'); return }

    setSubmitting(true)
    const result = await createSale({
      vehicle_id: form.vehicle_id,
      seller_id: form.seller_id || undefined,
      customer_id: form.customer_id || undefined,
      sale_price: salePrice,
      list_price: listPrice,
      discount: parseFloat(form.discount) || 0,
      financing_type: form.financing_type,
      financing_amount: form.financing_amount ? parseFloat(form.financing_amount) : undefined,
      payment_method: form.payment_method,
      notes: form.notes || undefined,
    })
    setSubmitting(false)

    if (result.error) { setError(result.error.message); return }
    onCreated(result.data)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-base font-semibold text-gray-900">Registrar venda</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          {error && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 border border-red-200">
              {error}
            </div>
          )}

          {/* Vehicle */}
          <div>
            <label className="label">Veículo *</label>
            <select
              value={form.vehicle_id}
              onChange={e => handleVehicleChange(e.target.value)}
              className="input"
              required
            >
              <option value="">Selecione um veículo disponível</option>
              {vehicles.map(v => (
                <option key={v.id} value={v.id}>
                  {v.brand} {v.model} — {v.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </option>
              ))}
            </select>
          </div>

          {/* Prices */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Preço de tabela *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.list_price}
                onChange={e => set('list_price', e.target.value)}
                className="input"
                required
                placeholder="0,00"
              />
            </div>
            <div>
              <label className="label">Valor de venda *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.sale_price}
                onChange={e => set('sale_price', e.target.value)}
                className="input"
                required
                placeholder="0,00"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Desconto (R$)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.discount}
                onChange={e => set('discount', e.target.value)}
                className="input"
                placeholder="0,00"
              />
            </div>
            <div>
              <label className="label">Forma de pagamento</label>
              <select value={form.payment_method} onChange={e => set('payment_method', e.target.value)} className="input">
                {Object.entries(PM_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>

          {/* Financing */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Tipo de financiamento</label>
              <select value={form.financing_type} onChange={e => set('financing_type', e.target.value)} className="input">
                {Object.entries(FT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            {form.financing_type !== 'none' && (
              <div>
                <label className="label">Valor financiado</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.financing_amount}
                  onChange={e => set('financing_amount', e.target.value)}
                  className="input"
                  placeholder="0,00"
                />
              </div>
            )}
          </div>

          {/* Seller + Customer */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Vendedor</label>
              <select value={form.seller_id} onChange={e => set('seller_id', e.target.value)} className="input">
                <option value="">Sem vendedor</option>
                {sellers.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Cliente</label>
              <select value={form.customer_id} onChange={e => set('customer_id', e.target.value)} className="input">
                <option value="">Sem cliente</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="label">Observações</label>
            <textarea
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              className="input min-h-[72px] resize-none"
              placeholder="Notas sobre a venda (opcional)"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 rounded-lg border border-gray-200 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              Cancelar
            </button>
            <button type="submit" disabled={submitting} className="flex-1 btn-primary disabled:opacity-60">
              {submitting ? 'Salvando…' : 'Registrar venda'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
