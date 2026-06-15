import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabaseServer'
import { getTenantStatusForUser } from '@/lib/tenant'
import { SupportContact } from './_components/SupportContact'

export const metadata = { title: 'Conta Suspensa — RevendaClick', robots: 'noindex' }

const MOTIVOS = {
  bloqueado: {
    titulo:     'Conta bloqueada',
    badge:      'Bloqueada',
    badgeColor: 'border-red-800 bg-red-900/30 text-red-400',
    icone:      '🔒',
    descricao:  'O acesso à sua conta foi temporariamente suspenso pelo administrador da plataforma.',
    hint:       'Entre em contato com o suporte para regularizar sua situação.',
    showSub:    true,
  },
  quarentena: {
    titulo:     'Conta em quarentena',
    badge:      'Quarentena',
    badgeColor: 'border-amber-700 bg-amber-900/30 text-amber-400',
    icone:      '⚠️',
    descricao:  'Sua conta foi colocada em quarentena pelo administrador da plataforma.',
    hint:       'Todos os seus dados foram preservados. Entre em contato com o suporte para mais informações.',
    showSub:    false,
  },
  excluido: {
    titulo:     'Conta encerrada',
    badge:      'Encerrada',
    badgeColor: 'border-gray-700 bg-gray-800/60 text-gray-400',
    icone:      '🗑',
    descricao:  'Esta conta foi encerrada.',
    hint:       'Se acredita que isso foi um engano, entre em contato com o suporte.',
    showSub:    false,
  },
} as const

type Motivo = keyof typeof MOTIVOS

function isValidMotivo(m: string | undefined): m is Motivo {
  return !!m && m in MOTIVOS
}

async function getSubscriptionInfo(tenantId: string) {
  try {
    const admin = createServiceClient()
    const { data } = await admin
      .from('subscriptions')
      .select('status, plan_id, trial_ends_at, grace_until, canceled_at, current_period_end')
      .eq('tenant_id', tenantId)
      .maybeSingle()
    if (!data) return null

    const { data: plan } = await admin
      .from('plans')
      .select('display_name, price_monthly')
      .eq('id', data.plan_id)
      .maybeSingle()

    return {
      status:         data.status,
      planName:       plan?.display_name ?? '—',
      priceMonthly:   plan?.price_monthly ?? null,
      currentPeriodEnd: data.current_period_end,
      gracePeriodEnd: data.grace_until,
      canceledAt:     data.canceled_at,
    }
  } catch {
    return null
  }
}

export default async function ContaSuspensaPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>
}) {
  const params = await searchParams
  const raw = params.motivo

  if (!isValidMotivo(raw)) redirect('/dashboard')

  const motivo = raw
  const cfg = MOTIVOS[motivo]

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const status = await getTenantStatusForUser(user.id)

  // Tenant active again (admin unblocked) — return to dashboard
  if (status?.is_active && !status.quarantined_at && !status.deleted_at) {
    redirect('/dashboard')
  }

  const sub = cfg.showSub && status ? await getSubscriptionInfo(status.id) : null

  const detailRows: { label: string; value: string }[] = []

  if (motivo === 'quarentena' && status?.quarantine_reason) {
    detailRows.push({ label: 'Motivo', value: status.quarantine_reason })
  }
  if (motivo === 'quarentena' && status?.quarantined_at) {
    detailRows.push({
      label: 'Data',
      value: new Date(status.quarantined_at).toLocaleString('pt-BR'),
    })
  }
  if (motivo === 'excluido' && status?.deleted_at) {
    detailRows.push({
      label: 'Encerrada em',
      value: new Date(status.deleted_at).toLocaleString('pt-BR'),
    })
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-6">

        {/* Brand */}
        <div className="text-center">
          <p className="text-2xl font-bold text-white tracking-tight">RevendaClick</p>
          <p className="text-xs text-gray-600 mt-0.5">A plataforma que acelera sua revenda</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-gray-800 bg-gray-900 p-8 shadow-2xl space-y-6">

          {/* Header */}
          <div className="flex flex-col items-center gap-3 text-center">
            <span className="text-5xl select-none">{cfg.icone}</span>
            <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold tracking-wide ${cfg.badgeColor}`}>
              {cfg.badge}
            </span>
            <h1 className="text-xl font-bold text-white">{cfg.titulo}</h1>
            {status?.name && (
              <p className="text-sm text-gray-400 font-mono">{status.name}</p>
            )}
          </div>

          {/* Description */}
          <div className="rounded-xl border border-gray-800 bg-gray-950/50 p-4 space-y-1.5 text-sm text-center">
            <p className="text-gray-300">{cfg.descricao}</p>
            <p className="text-gray-500 text-xs">{cfg.hint}</p>
          </div>

          {/* Detail rows (reason, date) */}
          {detailRows.length > 0 && (
            <div className="rounded-xl border border-gray-800 bg-gray-950/30 p-4 space-y-2 text-sm">
              {detailRows.map(r => (
                <div key={r.label} className="flex gap-3">
                  <span className="text-gray-500 shrink-0 w-20 text-xs font-medium pt-0.5">{r.label}</span>
                  <span className="text-gray-300 text-xs">{r.value}</span>
                </div>
              ))}
            </div>
          )}

          {/* Subscription info — BLOQUEADO only */}
          {sub && (
            <div className="rounded-xl border border-gray-800 bg-gray-950/30 p-4 space-y-2 text-sm">
              <p className="text-xs font-semibold text-gray-400 mb-2">Sua assinatura</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                <span className="text-gray-500 text-xs">Plano</span>
                <span className="text-gray-200 text-xs font-medium">{sub.planName}</span>
                <span className="text-gray-500 text-xs">Status</span>
                <span className="text-gray-200 text-xs font-medium capitalize">{sub.status}</span>
                {sub.priceMonthly && (
                  <>
                    <span className="text-gray-500 text-xs">Mensalidade</span>
                    <span className="text-gray-200 text-xs font-medium">
                      {Number(sub.priceMonthly).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  </>
                )}
                {sub.currentPeriodEnd && (
                  <>
                    <span className="text-gray-500 text-xs">Período atual</span>
                    <span className="text-gray-200 text-xs font-mono">
                      {new Date(sub.currentPeriodEnd).toLocaleDateString('pt-BR')}
                    </span>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3">
            <a
              href="mailto:suporte@revendaclick.com.br"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white hover:bg-primary/90 transition-colors"
            >
              <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Contato com suporte
            </a>

            <SupportContact />

            <form action="/api/auth/logout" method="POST">
              <button
                type="submit"
                className="w-full rounded-xl border border-gray-800 px-4 py-2.5 text-xs text-gray-600 hover:text-gray-400 hover:border-gray-700 transition-colors"
              >
                Sair da conta
              </button>
            </form>
          </div>
        </div>

        <p className="text-center text-xs text-gray-700">
          RevendaClick © {new Date().getFullYear()} · suporte@revendaclick.com.br
        </p>
      </div>
    </div>
  )
}
