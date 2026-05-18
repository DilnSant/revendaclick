'use client'

import { useState, useTransition } from 'react'
import type { User } from '@/lib/users'
import { ROLE_LABELS, ROLE_COLORS, userInitials } from '@/lib/users'
import { inviteVendor, updateVendor, deleteVendor } from '../actions'

type Role = 'admin' | 'seller' | 'viewer'

interface ModalState {
  mode: 'invite' | 'edit'
  user?: User
}

interface Props {
  users: User[]
  currentUserId: string
}

export default function VendorsClient({ users: initialUsers, currentUserId }: Props) {
  const [users, setUsers] = useState(initialUsers)
  const [modal, setModal] = useState<ModalState | null>(null)
  const [search, setSearch] = useState('')
  const [isPending, startTransition] = useTransition()
  const [formError, setFormError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  // Form fields
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [role, setRole] = useState<Role>('seller')

  const filtered = search.trim()
    ? users.filter(u =>
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())
      )
    : users

  function openInvite() {
    setName(''); setEmail(''); setPhone(''); setRole('seller')
    setFormError(null); setSuccessMsg(null)
    setModal({ mode: 'invite' })
  }

  function openEdit(u: User) {
    setName(u.name); setEmail(u.email)
    setPhone(u.phone ?? ''); setRole(u.role === 'owner' ? 'admin' : (u.role as Role))
    setFormError(null); setSuccessMsg(null)
    setModal({ mode: 'edit', user: u })
  }

  function closeModal() {
    setModal(null); setFormError(null); setSuccessMsg(null)
  }

  function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)
    startTransition(async () => {
      const res = await inviteVendor(email.trim(), name.trim(), role, phone.trim() || undefined)
      if (res.error) { setFormError(res.error); return }
      setSuccessMsg(`Convite enviado para ${email}. O usuário receberá um e-mail para configurar a senha.`)
    })
  }

  function handleUpdate(e: React.FormEvent) {
    e.preventDefault()
    if (!modal?.user) return
    setFormError(null)
    startTransition(async () => {
      const res = await updateVendor(modal.user!.id, {
        name: name.trim(),
        role,
        phone: phone.trim() || null,
      })
      if (res.error) { setFormError(res.error); return }
      setUsers(prev => prev.map(u => u.id === modal.user!.id ? { ...u, name: name.trim(), role, phone: phone.trim() || null } : u))
      closeModal()
    })
  }

  function handleDelete(id: string) {
    setDeleteConfirm(null)
    startTransition(async () => {
      const res = await deleteVendor(id)
      if (res.error) { alert(res.error); return }
      setUsers(prev => prev.filter(u => u.id !== id))
    })
  }

  function handleToggleActive(u: User) {
    startTransition(async () => {
      const res = await updateVendor(u.id, { is_active: !u.is_active })
      if (res.error) { alert(res.error); return }
      setUsers(prev => prev.map(x => x.id === u.id ? { ...x, is_active: !x.is_active } : x))
    })
  }

  return (
    <>
      {/* Header actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-graphite">Vendedores</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {users.length} usuário{users.length !== 1 ? 's' : ''} na equipe
          </p>
        </div>
        <button onClick={openInvite} className="btn-primary shrink-0">
          + Convidar membro
        </button>
      </div>

      {/* Search */}
      <div>
        <input
          type="search"
          placeholder="Buscar por nome ou e-mail…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input max-w-sm"
        />
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                <th className="th">Usuário</th>
                <th className="th">Contato</th>
                <th className="th hidden md:table-cell">Função</th>
                <th className="th hidden lg:table-cell">Cadastrado em</th>
                <th className="th">Status</th>
                <th className="th text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-sm text-gray-400">
                    {search ? 'Nenhum usuário encontrado.' : 'Nenhum usuário cadastrado. Convide membros com o botão acima.'}
                  </td>
                </tr>
              ) : (
                filtered.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="td">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-600">
                          {userInitials(u.name)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 leading-tight">{u.name}</p>
                          {u.id === currentUserId && (
                            <span className="text-[10px] text-gray-400">você</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="td">
                      <div className="space-y-0.5">
                        <p className="text-sm text-gray-700 truncate max-w-[200px]">{u.email}</p>
                        {u.phone && <p className="text-xs text-gray-400">{u.phone}</p>}
                      </div>
                    </td>
                    <td className="td hidden md:table-cell">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${ROLE_COLORS[u.role] ?? ROLE_COLORS.viewer}`}>
                        {ROLE_LABELS[u.role] ?? u.role}
                      </span>
                    </td>
                    <td className="td hidden lg:table-cell text-sm text-gray-500">
                      {new Date(u.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="td">
                      {u.role === 'owner' ? (
                        <span className="text-xs text-gray-400">—</span>
                      ) : (
                        <button
                          onClick={() => handleToggleActive(u)}
                          disabled={isPending}
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium transition-opacity disabled:opacity-50
                            ${u.is_active ? 'bg-green-50 text-green-700 hover:bg-green-100' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${u.is_active ? 'bg-green-500' : 'bg-gray-400'}`} />
                          {u.is_active ? 'Ativo' : 'Inativo'}
                        </button>
                      )}
                    </td>
                    <td className="td text-right">
                      {u.role !== 'owner' && (
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEdit(u)}
                            className="rounded px-2 py-1 text-xs text-gray-500 hover:bg-gray-100"
                          >
                            Editar
                          </button>
                          {u.id !== currentUserId && (
                            <button
                              onClick={() => setDeleteConfirm(u.id)}
                              className="rounded px-2 py-1 text-xs text-red-500 hover:bg-red-50"
                            >
                              Remover
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30" onClick={() => setDeleteConfirm(null)} />
          <div className="relative z-10 w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <h3 className="font-bold text-gray-900">Remover usuário?</h3>
            <p className="mt-1 text-sm text-gray-500">Esta ação não pode ser desfeita. O usuário perderá o acesso imediatamente.</p>
            <div className="mt-4 flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 rounded-lg border border-gray-200 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                disabled={isPending}
                className="flex-1 rounded-lg bg-red-600 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {isPending ? 'Removendo…' : 'Remover'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invite / Edit Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30" onClick={closeModal} />
          <div className="relative z-10 w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="font-bold text-gray-900">
              {modal.mode === 'invite' ? 'Convidar membro' : 'Editar usuário'}
            </h3>

            {successMsg ? (
              <div className="mt-4 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
                {successMsg}
                <div className="mt-3">
                  <button onClick={closeModal} className="rounded-lg bg-green-600 px-4 py-2 text-xs font-semibold text-white hover:bg-green-700">
                    Fechar
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={modal.mode === 'invite' ? handleInvite : handleUpdate} className="mt-4 space-y-3">
                <div>
                  <label className="label">Nome completo <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="input"
                    placeholder="João Silva"
                  />
                </div>

                {modal.mode === 'invite' && (
                  <div>
                    <label className="label">E-mail <span className="text-red-500">*</span></label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="input"
                      placeholder="joao@revenda.com.br"
                    />
                  </div>
                )}

                <div>
                  <label className="label">Telefone</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="input"
                    placeholder="(11) 99999-0000"
                  />
                </div>

                <div>
                  <label className="label">Função <span className="text-red-500">*</span></label>
                  <select value={role} onChange={e => setRole(e.target.value as Role)} className="input">
                    <option value="admin">Admin</option>
                    <option value="seller">Vendedor</option>
                    <option value="viewer">Visualizador</option>
                  </select>
                </div>

                {formError && (
                  <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
                    {formError}
                  </div>
                )}

                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={closeModal} className="flex-1 rounded-lg border border-gray-200 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50">
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="flex-1 rounded-lg bg-primary py-2.5 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50"
                  >
                    {isPending
                      ? modal.mode === 'invite' ? 'Enviando…' : 'Salvando…'
                      : modal.mode === 'invite' ? 'Enviar convite' : 'Salvar'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}
