'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { Commission, Seller } from '../page'

interface Props {
  commissions: Commission[]
  sellers: Seller[]
}

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pendente',
  paid: 'Pago',
}

const STATUS_COLOR: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  paid: 'bg-green-100 text-green-700',
}

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function fmtDate(d?: string) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('pt-BR')
}

export default function CommissionsClient({ commissions, sellers }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [filterSeller, setFilterSeller] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [toast, setToast] = useState<string | null>(null)

  const sellerMap = Object.fromEntries(sellers.map(s => [s.id, s.name]))

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3500)
  }

  const filtered = commissions.filter(c => {
    if (filterSeller && c.seller_id !== filterSeller) return false
    if (filterStatus && c.status !== filterStatus) return false
    return true
  })

  const totalPending = filtered
    .filter(c => c.status === 'pending')
    .reduce((s, c) => s + c.amount, 0)

  const totalPaid = filtered
    .filter(c => c.status === 'paid')
    .reduce((s, c) => s + c.amount, 0)

  async function handlePay(id: string) {
    if (!confirm('Marcar esta comissão como paga?')) return
    startTransition(async () => {
      const res = await fetch(`/api/financial/commissions/${id}/pay`, { method: 'PATCH' })
      if (res.ok) {
        showToast('Comissão marcada como paga.')
        router.refresh()
      } else {
        const json = await res.json().catch(() => ({}))
        showToast(json.error?.message ?? 'Erro ao pagar comissão.')
      }
    })
  }

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed top-4 right-4 z-50 rounded-lg bg-gray-900 px-4 py-3 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Total pendente</p>
          <p className="mt-1 text-2xl font-bold text-yellow-600">{fmt(totalPending)}</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Total pago</p>
          <p className="mt-1 text-2xl font-bold text-green-600">{fmt(totalPaid)}</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Registros</p>
          <p className="mt-1 text-2xl font-bold text-graphite">{filtered.length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={filterSeller}
          onChange={e => setFilterSeller(e.target.value)}
          className="input w-auto text-sm"
        >
          <option value="">Todos os vendedores</option>
          {sellers.map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="input w-auto text-sm"
        >
          <option value="">Todos os status</option>
          <option value="pending">Pendente</option>
          <option value="paid">Pago</option>
        </select>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 p-12 text-center">
          <p className="text-gray-400">Nenhuma comissão encontrada.</p>
          <p className="mt-1 text-xs text-gray-400">
            Comissões são geradas automaticamente ao completar uma venda.
          </p>
          <Link href="/sales" className="mt-4 inline-block text-sm text-primary hover:underline">
            Ver vendas
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="border-b border-gray-100 bg-gray-50">
                <tr>
                  {['Vendedor', 'Tipo', 'Taxa', 'Valor', 'Status', 'Data', 'Ações'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(c => (
                  <tr key={c.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {sellerMap[c.seller_id] ?? c.seller_id.slice(0, 8)}
                    </td>
                    <td className="px-4 py-3 capitalize text-gray-600">{c.type}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {c.rate != null ? `${(c.rate * 100).toFixed(1)}%` : '—'}
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-900">{fmt(c.amount)}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLOR[c.status] ?? ''}`}>
                        {STATUS_LABEL[c.status] ?? c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {c.status === 'paid' ? fmtDate(c.paid_at) : fmtDate(c.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      {c.status === 'pending' && (
                        <button
                          onClick={() => handlePay(c.id)}
                          disabled={isPending}
                          className="rounded-lg bg-green-50 border border-green-200 px-3 py-1 text-xs font-medium text-green-700 hover:bg-green-100 disabled:opacity-50"
                        >
                          Marcar pago
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
