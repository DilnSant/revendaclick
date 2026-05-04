import { notFound } from 'next/navigation'
import { getUserIdFromHeaders, getTenantForUser } from '@/lib/tenant'
import { createClient } from '@/lib/supabaseServer'

export const metadata = { title: 'Financeiro' }

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'

interface Entry {
  id: string
  type: 'income' | 'expense'
  category: string
  description: string
  amount: number
  payment_method: string
  status: string
  due_date?: string
  paid_at?: string
  created_at: string
}

interface Sale {
  id: string
  vehicle_id: string
  sale_price: number
  status: string
  payment_method: string
  sold_at?: string
  created_at: string
}

interface CashFlowMonth {
  month: string
  total_income: number
  total_expense: number
  net_balance: number
}

const CATEGORY_LABELS: Record<string, string> = {
  vehicle_sale: 'Venda de veículo',
  commission:   'Comissão',
  service:      'Serviço',
  financing:    'Financiamento',
  operational:  'Operacional',
  marketing:    'Marketing',
  salary:       'Salário',
  rent:         'Aluguel',
  tax:          'Impostos',
  other:        'Outros',
}

const STATUS_STYLE: Record<string, string> = {
  paid:    'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  overdue: 'bg-red-100 text-red-700',
  canceled:'bg-gray-100 text-gray-500',
}

export default async function FinancialPage() {
  const userId = await getUserIdFromHeaders()
  if (!userId) notFound()

  const tenant = await getTenantForUser(userId)
  if (!tenant) notFound()

  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token ?? ''

  const [entries, sales, cashFlow] = await Promise.all([
    fetchEntries(token),
    fetchSales(token),
    fetchCashFlow(token),
  ])

  const totalIncome  = entries.filter(e => e.type === 'income'  && e.status === 'paid').reduce((s, e) => s + e.amount, 0)
  const totalExpense = entries.filter(e => e.type === 'expense' && e.status === 'paid').reduce((s, e) => s + e.amount, 0)
  const netBalance   = totalIncome - totalExpense
  const pending      = entries.filter(e => e.status === 'pending').length

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Financeiro</h1>
          <p className="mt-0.5 text-sm text-gray-500">Entradas, saídas e fluxo de caixa</p>
        </div>
        <a href="/sales" className="btn-primary shrink-0">+ Registrar venda</a>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard label="Entradas (mês)"  value={fmt(totalIncome)}  color="text-green-600" />
        <KPICard label="Saídas (mês)"    value={fmt(totalExpense)} color="text-red-600" />
        <KPICard label="Saldo líquido"   value={fmt(netBalance)}   color={netBalance >= 0 ? 'text-green-700' : 'text-red-700'} />
        <KPICard label="A receber"       value={String(pending)}   color="text-yellow-600" isCount />
      </div>

      {/* Cash flow chart (text) */}
      {cashFlow.length > 0 && (
        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-gray-900">Fluxo de caixa — últimos meses</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-400">
                  <th className="pb-2 pr-6">Mês</th>
                  <th className="pb-2 pr-6 text-right text-green-600">Entradas</th>
                  <th className="pb-2 pr-6 text-right text-red-600">Saídas</th>
                  <th className="pb-2 text-right">Saldo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {cashFlow.map(row => (
                  <tr key={row.month}>
                    <td className="py-2 pr-6 font-medium text-gray-700">{formatMonth(row.month)}</td>
                    <td className="py-2 pr-6 text-right text-green-600">{fmt(row.total_income)}</td>
                    <td className="py-2 pr-6 text-right text-red-500">{fmt(row.total_expense)}</td>
                    <td className={`py-2 text-right font-semibold ${row.net_balance >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                      {fmt(row.net_balance)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent entries */}
        <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3.5">
            <h2 className="text-base font-semibold text-gray-900">Lançamentos recentes</h2>
          </div>
          {entries.length === 0 ? (
            <p className="py-10 text-center text-sm text-gray-400">Nenhum lançamento ainda.</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {entries.slice(0, 10).map(e => (
                <div key={e.id} className="flex items-center gap-3 px-5 py-3">
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold
                    ${e.type === 'income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {e.type === 'income' ? '+' : '-'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{e.description}</p>
                    <p className="text-xs text-gray-400">{CATEGORY_LABELS[e.category] ?? e.category}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-sm font-semibold ${e.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                      {e.type === 'income' ? '+' : '-'}{fmt(e.amount)}
                    </p>
                    <span className={`inline-block rounded-full px-1.5 py-0.5 text-xs font-medium ${STATUS_STYLE[e.status] ?? 'bg-gray-100 text-gray-500'}`}>
                      {statusLabel(e.status)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent sales */}
        <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3.5">
            <h2 className="text-base font-semibold text-gray-900">Vendas recentes</h2>
            <a href="/sales" className="text-xs font-medium text-red-600 hover:text-red-700">Ver todas →</a>
          </div>
          {sales.length === 0 ? (
            <p className="py-10 text-center text-sm text-gray-400">Nenhuma venda registrada.</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {sales.slice(0, 8).map(s => (
                <div key={s.id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{fmt(s.sale_price)}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(s.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium
                    ${s.status === 'completed' ? 'bg-green-100 text-green-700'
                      : s.status === 'canceled' ? 'bg-gray-100 text-gray-500'
                      : 'bg-yellow-100 text-yellow-700'}`}>
                    {s.status === 'completed' ? 'Concluída' : s.status === 'canceled' ? 'Cancelada' : 'Pendente'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function KPICard({ label, value, color, isCount }: { label: string; value: string; color?: string; isCount?: boolean }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
      <p className={`mt-1 font-bold text-gray-900 ${isCount ? 'text-3xl' : 'text-2xl'} ${color ?? ''}`}>{value}</p>
    </div>
  )
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(v: number): string {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatMonth(isoDate: string): string {
  const d = new Date(isoDate + 'T00:00:00')
  return d.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
}

function statusLabel(s: string) {
  const map: Record<string, string> = { paid: 'Pago', pending: 'Pendente', overdue: 'Vencido', canceled: 'Cancelado' }
  return map[s] ?? s
}

// ─── Data fetching ─────────────────────────────────────────────────────────────

async function fetchEntries(token: string): Promise<Entry[]> {
  if (!token) return []
  try {
    const res = await fetch(`${API}/api/financial/entries?limit=50`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
    if (!res.ok) return []
    const json = await res.json()
    return (json.data ?? []) as Entry[]
  } catch { return [] }
}

async function fetchSales(token: string): Promise<Sale[]> {
  if (!token) return []
  try {
    const res = await fetch(`${API}/api/sales?limit=20`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
    if (!res.ok) return []
    const json = await res.json()
    return (json.data ?? []) as Sale[]
  } catch { return [] }
}

async function fetchCashFlow(token: string): Promise<CashFlowMonth[]> {
  if (!token) return []
  try {
    const res = await fetch(`${API}/api/financial/cash-flow?months=6`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
    if (!res.ok) return []
    const json = await res.json()
    return (json.data ?? json ?? []) as CashFlowMonth[]
  } catch { return [] }
}
