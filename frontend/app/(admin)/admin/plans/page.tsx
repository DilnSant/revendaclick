import { createClient } from '@/lib/supabaseServer'
import { PlansTable, type PlanRow } from './_components/PlansTable'

export const metadata = { title: 'Planos — Admin RevendaClick' }
export const revalidate = 0

const API = process.env.INTERNAL_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'

export default async function AdminPlansPage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token ?? ''

  let rows: PlanRow[] = []
  let fetchError = ''

  try {
    const res = await fetch(`${API}/api/admin/plans`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
    if (!res.ok) {
      fetchError = `Erro ${res.status}`
    } else {
      const json = await res.json()
      rows = (json.plans ?? []) as PlanRow[]
    }
  } catch {
    fetchError = 'Erro de conexão com o backend'
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold text-white">Planos</h1>
        <p className="mt-0.5 text-sm text-gray-500">
          Configuração global dos planos da plataforma — alterações afetam todos os tenants do plano.
        </p>
      </div>

      <div className="rounded-xl border border-yellow-800/50 bg-yellow-900/10 px-5 py-3">
        <p className="text-sm text-yellow-400">
          <span className="font-semibold">Atenção:</span> Alterar features de um plano reflete imediatamente para todos os tenants ativos nele. Nomes de plano (coluna &quot;Nome DB&quot;) não são editáveis — use display_name para mudanças comerciais.
        </p>
      </div>

      {fetchError ? (
        <div className="rounded-xl border border-red-800 bg-red-900/20 p-6 text-sm text-red-400">{fetchError}</div>
      ) : (
        <PlansTable rows={rows} />
      )}
    </div>
  )
}
