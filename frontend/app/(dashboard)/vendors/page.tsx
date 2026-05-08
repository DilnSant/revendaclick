import { notFound } from 'next/navigation'
import { getUserIdFromHeaders, getTenantForUser } from '@/lib/tenant'
import { createClient } from '@/lib/supabaseServer'
import type { User } from '@/lib/users'
import { ROLE_LABELS, ROLE_COLORS, userInitials } from '@/lib/users'

export const metadata = { title: 'Vendedores' }

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'

export default async function VendorsPage() {
  const userId = await getUserIdFromHeaders()
  if (!userId) notFound()

  const tenant = await getTenantForUser(userId)
  if (!tenant) notFound()

  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token ?? ''

  const users = await fetchUsers(token)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-graphite">Vendedores</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {users.length} usuário{users.length !== 1 ? 's' : ''} na equipe
          </p>
        </div>
        <a href="/settings?tab=users" className="btn-primary shrink-0">
          + Gerenciar equipe
        </a>
      </div>

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
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-sm text-gray-400">
                    Nenhum usuário cadastrado. Adicione membros em{' '}
                    <a href="/settings?tab=users" className="underline text-red-600">Configurações</a>.
                  </td>
                </tr>
              ) : (
                users.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="td">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-600">
                          {userInitials(u.name)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 leading-tight">{u.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="td">
                      <div className="space-y-0.5">
                        <p className="text-sm text-gray-700 truncate max-w-[200px]">{u.email}</p>
                        {u.phone && (
                          <p className="text-xs text-gray-400">{u.phone}</p>
                        )}
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
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium
                        ${u.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${u.is_active ? 'bg-green-500' : 'bg-gray-400'}`} />
                        {u.is_active ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

async function fetchUsers(token: string): Promise<User[]> {
  if (!token) return []
  try {
    const res = await fetch(`${API}/api/users`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
    if (!res.ok) return []
    const json = await res.json()
    return (json.data ?? []) as User[]
  } catch {
    return []
  }
}
