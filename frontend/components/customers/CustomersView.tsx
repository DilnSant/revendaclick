'use client'

import { useCallback, useRef, useState, useTransition } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import type { Customer } from '@/lib/customers'
import { formatPhone, formatCpfCnpj, initials, BR_STATES } from '@/lib/customers'
import { deleteCustomer } from '@/app/(dashboard)/customers/actions'
import CustomerModal from './CustomerModal'
import ToastContainer, { type ToastMessage } from '@/components/ui/Toast'

const PAGE_SIZE = 20

interface Props {
  customers: Customer[]
  total: number
  page: number
  search: string
  filterState: string
  filterActive: string
}

export default function CustomersView({
  customers,
  total,
  page,
  search: initialSearch,
  filterState: initialState,
  filterActive: initialActive,
}: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Customer | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<Customer | null>(null)
  const [toasts, setToasts] = useState<ToastMessage[]>([])
  const [deletePending, startDeleteTransition] = useTransition()
  const toastId = useRef(0)

  const [search, setSearch]           = useState(initialSearch)
  const [filterState, setFilterState] = useState(initialState)
  const [filterActive, setFilterActive] = useState(initialActive)

  const addToast = useCallback((t: Omit<ToastMessage, 'id'>) => {
    setToasts(prev => [...prev, { ...t, id: ++toastId.current }])
  }, [])

  const dismissToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  // Debounced URL push for filters
  const debounce = useRef<ReturnType<typeof setTimeout>>(null)
  function pushFilters(overrides: Record<string, string>) {
    if (debounce.current) clearTimeout(debounce.current)
    debounce.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())
      const merged = { search, state: filterState, active: filterActive, page: '1', ...overrides }
      Object.entries(merged).forEach(([k, v]) => {
        if (v) params.set(k, v)
        else params.delete(k)
      })
      router.push(`${pathname}?${params.toString()}`)
    }, 300)
  }

  function handleSearchChange(v: string) {
    setSearch(v)
    pushFilters({ search: v, page: '1' })
  }
  function handleStateChange(v: string) {
    setFilterState(v)
    pushFilters({ state: v, page: '1' })
  }
  function handleActiveChange(v: string) {
    setFilterActive(v)
    pushFilters({ active: v, page: '1' })
  }
  function goPage(p: number) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', String(p))
    router.push(`${pathname}?${params.toString()}`)
  }

  function openCreate() { setEditTarget(null); setModalOpen(true) }
  function openEdit(c: Customer) { setEditTarget(c); setModalOpen(true) }
  function closeModal() { setModalOpen(false); setEditTarget(null) }

  function handleDelete() {
    if (!confirmDelete) return
    const id = confirmDelete.id
    setConfirmDelete(null)
    startDeleteTransition(async () => {
      const result = await deleteCustomer(id)
      if (result.error) {
        addToast({ type: 'error', text: result.error.message })
      } else {
        addToast({ type: 'success', text: 'Cliente excluído.' })
      }
    })
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)
  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const to   = Math.min(page * PAGE_SIZE, total)

  return (
    <>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {total} cliente{total !== 1 ? 's' : ''} cadastrado{total !== 1 ? 's' : ''}
          </p>
        </div>
        <button onClick={openCreate} className="btn-primary shrink-0">
          + Novo cliente
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <svg className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
            fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={e => handleSearchChange(e.target.value)}
            placeholder="Buscar por nome, e-mail, telefone ou CPF/CNPJ…"
            className="input pl-9"
          />
        </div>
        <select
          value={filterState}
          onChange={e => handleStateChange(e.target.value)}
          className="input sm:w-28"
        >
          <option value="">Todos estados</option>
          {BR_STATES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select
          value={filterActive}
          onChange={e => handleActiveChange(e.target.value)}
          className="input sm:w-36"
        >
          <option value="">Todos</option>
          <option value="true">Ativos</option>
          <option value="false">Inativos</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                <th className="th">Cliente</th>
                <th className="th">Contato</th>
                <th className="th hidden md:table-cell">CPF / CNPJ</th>
                <th className="th hidden lg:table-cell">Cidade / UF</th>
                <th className="th">Status</th>
                <th className="th text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {customers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-sm text-gray-400">
                    {search || filterState || filterActive
                      ? 'Nenhum cliente encontrado com os filtros aplicados.'
                      : 'Nenhum cliente cadastrado ainda. Clique em "Novo cliente" para começar.'}
                  </td>
                </tr>
              ) : (
                customers.map(c => (
                  <tr key={c.id} className="group hover:bg-gray-50/60 transition-colors">
                    {/* Name + avatar */}
                    <td className="td">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-semibold text-primary">
                          {initials(c.name)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 leading-tight">{c.name}</p>
                          {c.notes && (
                            <p className="max-w-xs truncate text-xs text-gray-400 mt-0.5">{c.notes}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    {/* Contato */}
                    <td className="td">
                      <div className="space-y-0.5">
                        {c.email && (
                          <p className="text-sm text-gray-700 truncate max-w-[180px]">{c.email}</p>
                        )}
                        {c.phone && (
                          <p className="text-xs text-gray-400">{formatPhone(c.phone)}</p>
                        )}
                        {!c.email && !c.phone && (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </div>
                    </td>
                    {/* CPF/CNPJ */}
                    <td className="td hidden md:table-cell text-sm text-gray-600">
                      {c.cpf_cnpj ? formatCpfCnpj(c.cpf_cnpj) : <span className="text-gray-300">—</span>}
                    </td>
                    {/* Cidade/UF */}
                    <td className="td hidden lg:table-cell text-sm text-gray-600">
                      {c.address_city || c.address_state
                        ? [c.address_city, c.address_state?.trim()].filter(Boolean).join(' / ')
                        : <span className="text-gray-300">—</span>}
                    </td>
                    {/* Status */}
                    <td className="td">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium
                        ${c.is_active
                          ? 'bg-green-50 text-green-700'
                          : 'bg-gray-100 text-gray-500'}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${c.is_active ? 'bg-green-500' : 'bg-gray-400'}`} />
                        {c.is_active ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    {/* Ações */}
                    <td className="td text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEdit(c)}
                          title="Editar"
                          className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setConfirmDelete(c)}
                          title="Excluir"
                          className="rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50/50 px-5 py-3">
            <p className="text-xs text-gray-500">
              Exibindo <span className="font-medium">{from}–{to}</span> de{' '}
              <span className="font-medium">{total}</span> clientes
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => goPage(page - 1)}
                disabled={page <= 1}
                className="rounded-md px-2.5 py-1.5 text-xs font-medium text-gray-600
                  hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                ← Anterior
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const p = totalPages <= 5 ? i + 1 : Math.max(1, page - 2) + i
                if (p > totalPages) return null
                return (
                  <button
                    key={p}
                    onClick={() => goPage(p)}
                    className={`min-w-[32px] rounded-md px-2 py-1.5 text-xs font-medium transition-colors
                      ${p === page
                        ? 'bg-primary text-white'
                        : 'text-gray-600 hover:bg-gray-200'}`}
                  >
                    {p}
                  </button>
                )
              })}
              <button
                onClick={() => goPage(page + 1)}
                disabled={page >= totalPages}
                className="rounded-md px-2.5 py-1.5 text-xs font-medium text-gray-600
                  hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Próxima →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal criar/editar */}
      {modalOpen && (
        <CustomerModal
          customer={editTarget}
          onClose={closeModal}
          onToast={t => { addToast(t); closeModal() }}
        />
      )}

      {/* Modal confirmar exclusão */}
      {confirmDelete && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-base font-semibold text-gray-900">Excluir cliente</h3>
            <p className="mt-2 text-sm text-gray-500">
              Tem certeza que deseja excluir{' '}
              <span className="font-medium text-gray-700">{confirmDelete.name}</span>?
              Esta ação não pode ser desfeita.
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button onClick={() => setConfirmDelete(null)} className="btn-ghost">
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={deletePending}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white
                  hover:bg-red-700 disabled:opacity-60 transition-colors"
              >
                {deletePending ? 'Excluindo…' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </>
  )
}
