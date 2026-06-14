'use client'

import { Fragment, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

export type UserRow = {
  id: string
  tenant_id: string | null
  tenant_slug: string | null
  tenant_name: string | null
  role: string
  name: string
  email: string
  is_active: boolean
  last_seen_at: string | null
  created_at: string
}

const ROLES = ['owner', 'admin', 'staff', 'customer', 'super_admin']

const ROLE_COLOR: Record<string, string> = {
  owner:       'bg-purple-900/40 text-purple-300 border-purple-800',
  admin:       'bg-blue-900/40 text-blue-300 border-blue-800',
  staff:       'bg-gray-800 text-gray-400 border-gray-700',
  customer:    'bg-gray-800 text-gray-500 border-gray-700',
  super_admin: 'bg-red-900/40 text-red-300 border-red-800',
}

export function UsersTable({ rows }: { rows: UserRow[] }) {
  const router = useRouter()
  const [editing, setEditing]     = useState<UserRow | null>(null)
  const [editRole, setEditRole]   = useState('')
  const [editName, setEditName]   = useState('')
  const [msg, setMsg]             = useState<{ id: string; ok: boolean; text: string } | null>(null)
  const [search, setSearch]       = useState('')
  const [pending, start]          = useTransition()

  const filtered = rows.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    (u.tenant_slug ?? '').toLowerCase().includes(search.toLowerCase())
  )

  function openEdit(u: UserRow) {
    setEditing(u)
    setEditRole(u.role)
    setEditName(u.name)
    setMsg(null)
  }

  function closeEdit() { setEditing(null) }

  function callUpdate(id: string, body: Record<string, unknown>) {
    start(async () => {
      try {
        const res = await fetch(`/api/admin/users/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        const json = await res.json()
        if (!res.ok) {
          setMsg({ id, ok: false, text: json.error ?? 'Erro ao atualizar' })
        } else {
          setMsg({ id, ok: true, text: 'Atualizado!' })
          closeEdit()
          router.refresh()
        }
      } catch {
        setMsg({ id, ok: false, text: 'Erro de rede' })
      }
    })
  }

  function handleSaveEdit() {
    if (!editing) return
    const body: Record<string, unknown> = {}
    if (editRole !== editing.role) body.role = editRole
    if (editName.trim() && editName.trim() !== editing.name) body.name = editName.trim()
    if (Object.keys(body).length === 0) { closeEdit(); return }
    callUpdate(editing.id, body)
  }

  return (
    <>
      <div className="rounded-xl border border-gray-800 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-800 bg-gray-900/60">
          <h2 className="text-sm font-semibold text-gray-300">{rows.length} usuários</h2>
          <input
            type="search"
            placeholder="Buscar por nome, email, tenant…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-1.5 text-xs text-gray-300 placeholder-gray-600 focus:border-primary focus:outline-none w-56"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-900/80 text-left">
                {['Usuário', 'Tenant', 'Papel', 'Status', 'Último acesso', 'Ações'].map(h => (
                  <th key={h} className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-gray-600 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {filtered.map(u => (
                <Fragment key={u.id}>
                  <tr className="hover:bg-gray-900/30 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-200 whitespace-nowrap">{u.name}</p>
                      <p className="text-xs text-gray-600">{u.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      {u.tenant_name
                        ? <>
                            <p className="text-xs text-gray-300 whitespace-nowrap">{u.tenant_name}</p>
                            <p className="text-[10px] text-gray-600">{u.tenant_slug}</p>
                          </>
                        : <span className="text-xs text-gray-700">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap ${ROLE_COLOR[u.role] ?? 'bg-gray-800 text-gray-500 border-gray-700'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${u.is_active ? 'bg-green-900/40 text-green-400 border-green-800' : 'bg-red-900/40 text-red-400 border-red-800'}`}>
                        {u.is_active ? 'ativo' : 'inativo'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">
                      {u.last_seen_at ? new Date(u.last_seen_at).toLocaleString('pt-BR') : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEdit(u)}
                          className="rounded-md bg-gray-800 border border-gray-700 px-2.5 py-1 text-xs font-medium text-gray-300 hover:bg-gray-700 transition-colors whitespace-nowrap"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => callUpdate(u.id, { is_active: !u.is_active })}
                          disabled={pending}
                          className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-40 whitespace-nowrap ${
                            u.is_active
                              ? 'bg-red-900/20 border-red-800/60 text-red-400 hover:bg-red-900/40'
                              : 'bg-green-900/20 border-green-800/60 text-green-400 hover:bg-green-900/40'
                          }`}
                        >
                          {u.is_active ? 'Desativar' : 'Ativar'}
                        </button>
                      </div>
                    </td>
                  </tr>
                  {msg?.id === u.id && (
                    <tr>
                      <td colSpan={6} className="px-4 py-1.5">
                        <p className={`text-xs ${msg.ok ? 'text-green-400' : 'text-red-400'}`}>{msg.text}</p>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="py-12 text-center text-sm text-gray-700">
              {search ? 'Nenhum usuário encontrado.' : 'Nenhum usuário cadastrado.'}
            </div>
          )}
        </div>
      </div>

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={closeEdit}>
          <div
            className="w-full max-w-sm rounded-2xl border border-gray-700 bg-gray-900 shadow-2xl p-6 space-y-5"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Editar Usuário</h3>
                <p className="text-xs text-gray-500 mt-0.5">{editing.email}</p>
              </div>
              <button onClick={closeEdit} className="text-gray-600 hover:text-gray-400">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-400">Nome</label>
                <input
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-400">Papel (role)</label>
                <select
                  value={editRole}
                  onChange={e => setEditRole(e.target.value)}
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none"
                >
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                {editRole === 'super_admin' && (
                  <p className="text-[10px] text-yellow-500">Atenção: super_admin tem acesso total à plataforma.</p>
                )}
              </div>
            </div>

            {msg && msg.id === editing.id && (
              <p className={`text-xs ${msg.ok ? 'text-green-400' : 'text-red-400'}`}>{msg.text}</p>
            )}

            <div className="flex items-center gap-3 pt-1">
              <button
                onClick={handleSaveEdit}
                disabled={pending}
                className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-40 transition-colors"
              >
                {pending ? 'Salvando...' : 'Salvar'}
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
