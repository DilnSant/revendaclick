'use client'

import { useState } from 'react'
import { formatCurrency } from '@/lib/billing-utils'
import type { Plan, Subscription } from '@/lib/billing-utils'

interface Props {
  plan: Plan
  cycle: 'monthly' | 'yearly'
  currentPlanName?: string
  subscription?: Subscription | null
}

type FeatureSection = { section: string; items: string[] }

const PLAN_HIGHLIGHTS: Record<string, FeatureSection[]> = {
  starter: [
    {
      section: 'Loja & Marketplace',
      items: [
        'Marketplace público de veículos',
        'Botão WhatsApp na loja',
        'Captura automática de leads',
        'Página pública SEO otimizada',
        'Personalização da loja',
      ],
    },
    {
      section: 'Gestão',
      items: [
        'Interessados e Clientes',
        'Vendedores e equipe',
        'Financeiro básico',
        'Pipeline de Vendas',
      ],
    },
  ],
  pro: [
    {
      section: 'Tudo do Starter, mais:',
      items: [
        'CRM de Atendimento completo',
        'Kanban de leads',
        'Analytics avançado',
        'Histórico de conversas',
        'Funil de vendas',
      ],
    },
  ],
  premium: [
    {
      section: 'Tudo do Pro, mais:',
      items: [
        'WhatsApp operacional (QR Code)',
        'IA: sugestão de resposta',
        'IA: recuperação de leads',
        'Automações e campanhas',
        'Multiatendimento',
      ],
    },
  ],
}

const PLAN_BADGE: Record<string, { label: string; className: string } | undefined> = {
  pro:     { label: 'Mais popular',          className: 'bg-primary text-white' },
  premium: { label: 'Melhor custo-benefício', className: 'bg-amber-500 text-white' },
}

export default function PlanCard({ plan, cycle, currentPlanName, subscription }: Props) {
  const [billingType, setBillingType] = useState<'BOLETO' | 'PIX' | 'CREDIT_CARD'>('BOLETO')
  const [loading, setLoading]         = useState(false)
  const [cpf, setCpf]                 = useState('')
  const [error, setError]             = useState<string | null>(null)
  const [success, setSuccess]         = useState<string | null>(null)
  const [devLoading, setDevLoading]   = useState(false)

  const isDevMode = process.env.NEXT_PUBLIC_DEV_BILLING === 'true'

  const isCurrent          = plan.name === currentPlanName
  const isTrialing         = subscription?.status === 'trialing'
  const isActiveSub        = subscription?.is_active === true
  const isActiveAndCurrent = isCurrent && !isTrialing
  const isUpgradeMode      = isActiveSub && !isCurrent

  const price          = cycle === 'yearly' ? plan.price_yearly / 12 : plan.price_monthly
  const yearlyDiscount = Math.round((1 - plan.price_yearly / (plan.price_monthly * 12)) * 100)

  const badge    = PLAN_BADGE[plan.name]
  const sections = PLAN_HIGHLIGHTS[plan.name] ?? []
  const isPro     = plan.name === 'pro'
  const isPremium = plan.name === 'premium'

  async function handleDevActivate() {
    setDevLoading(true)
    setError(null)
    setSuccess(null)
    try {
      const res = await fetch('/api/billing/dev-activate-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan_name: plan.name }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Erro ao ativar.'); return }
      setSuccess(`Plano ${plan.display_name} ativado! Recarregue a página.`)
    } catch { setError('Erro de conexão.') }
    finally { setDevLoading(false) }
  }

  async function handleSubscribe() {
    setLoading(true)
    setError(null)
    setSuccess(null)
    try {
      const res = await fetch('/api/billing/subscribe-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan_name:     plan.name,
          billing_cycle: cycle,
          billing_type:  billingType,
          cpf_or_cnpj:   cpf || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Erro ao processar. Tente novamente.'); return }
      if (data.asaas_payment_link) {
        setSuccess('Redirecionando para pagamento…')
        window.open(data.asaas_payment_link, '_blank')
      } else {
        setSuccess('Assinatura ativada! Recarregue a página.')
      }
    } catch { setError('Erro de conexão. Tente novamente.') }
    finally { setLoading(false) }
  }

  async function handleUpgrade() {
    setLoading(true)
    setError(null)
    setSuccess(null)
    try {
      const res = await fetch('/api/billing/upgrade-action', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan_name: plan.name, billing_cycle: cycle }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Erro ao alterar plano. Tente novamente.'); return }
      setSuccess('Plano alterado! A nova cobrança será aplicada no próximo ciclo.')
    } catch { setError('Erro de conexão. Tente novamente.') }
    finally { setLoading(false) }
  }

  function ctaLabel(): string {
    if (isActiveAndCurrent)      return 'Plano atual'
    if (loading)                 return 'Processando…'
    if (isUpgradeMode)           return 'Mudar para este plano'
    if (isCurrent && isTrialing) return 'Antecipar assinatura'
    return 'Começar agora'
  }

  return (
    <div
      className={`relative flex flex-col rounded-2xl border transition-shadow ${
        isPro
          ? 'border-primary shadow-lg shadow-primary/10 ring-2 ring-primary bg-white'
          : isPremium
          ? 'border-amber-200 shadow-md shadow-amber-100/50 bg-white'
          : 'border-gray-200 bg-white shadow-sm hover:shadow-md'
      }`}
    >
      {badge && (
        <div className="absolute -top-3.5 left-0 right-0 flex justify-center">
          <span className={`rounded-full px-3 py-1 text-xs font-bold shadow-sm ${badge.className}`}>
            {badge.label}
          </span>
        </div>
      )}

      <div className="flex flex-col flex-1 p-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-gray-900">{plan.display_name}</h3>
            {plan.tagline && (
              <p className="mt-0.5 text-xs text-gray-500 leading-snug">{plan.tagline}</p>
            )}
          </div>
          {isActiveAndCurrent && (
            <span className="shrink-0 rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
              Ativo
            </span>
          )}
          {isCurrent && isTrialing && (
            <span className="shrink-0 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
              Trial
            </span>
          )}
        </div>

        {/* Price */}
        <div className="mt-5">
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-extrabold tracking-tight text-gray-900">
              {formatCurrency(price)}
            </span>
            <span className="text-sm text-gray-400">/mês</span>
          </div>
          {cycle === 'yearly' && yearlyDiscount > 0 && (
            <p className="mt-0.5 text-xs text-green-600 font-medium">
              {formatCurrency(plan.price_yearly)}/ano · economize {yearlyDiscount}%
            </p>
          )}
          {cycle === 'monthly' && plan.price_yearly > 0 && (
            <p className="mt-0.5 text-xs text-gray-400">
              ou {formatCurrency(plan.price_yearly / 12)}/mês no plano anual
            </p>
          )}
        </div>

        {/* Limits pill grid */}
        <div className="mt-4 grid grid-cols-3 gap-0 rounded-xl bg-gray-50 divide-x divide-gray-200 px-1 py-3">
          <div className="text-center px-2">
            <p className="text-sm font-bold text-gray-900">
              {plan.max_vehicles === -1 ? '∞' : plan.max_vehicles}
            </p>
            <p className="text-[10px] text-gray-500 leading-tight">veículos</p>
          </div>
          <div className="text-center px-2">
            <p className="text-sm font-bold text-gray-900">
              {plan.max_users === -1 ? '∞' : plan.max_users}
            </p>
            <p className="text-[10px] text-gray-500 leading-tight">usuários</p>
          </div>
          <div className="text-center px-2">
            <p className="text-sm font-bold text-gray-900">
              {plan.max_leads === -1 ? '∞' : plan.max_leads}
            </p>
            <p className="text-[10px] text-gray-500 leading-tight">leads/mês</p>
          </div>
        </div>

        {/* Feature sections */}
        <div className="mt-5 flex-1 space-y-4">
          {sections.map((group) => (
            <div key={group.section}>
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                {group.section}
              </p>
              <ul className="space-y-1.5">
                {group.items.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <svg
                      className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-500"
                      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-xs text-gray-600 leading-snug">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Billing type + CPF — only for new subscriptions */}
        {!isActiveAndCurrent && !isUpgradeMode && (
          <div className="mt-5 space-y-2">
            <label className="text-xs font-medium text-gray-500">Forma de pagamento</label>
            <select
              value={billingType}
              onChange={(e) => setBillingType(e.target.value as 'BOLETO' | 'PIX' | 'CREDIT_CARD')}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="BOLETO">Boleto bancário</option>
              <option value="PIX">PIX</option>
              <option value="CREDIT_CARD">Cartão de crédito</option>
            </select>
            <input
              type="text"
              placeholder="CPF ou CNPJ (opcional)"
              value={cpf}
              onChange={(e) => setCpf(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        )}

        {error && (
          <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </div>
        )}
        {success && (
          <div className="mt-3 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-700">
            {success}
          </div>
        )}

        {/* CTA */}
        <button
          onClick={
            isActiveAndCurrent
              ? undefined
              : isUpgradeMode
              ? handleUpgrade
              : handleSubscribe
          }
          disabled={isActiveAndCurrent || loading}
          className={`mt-5 w-full rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
            isActiveAndCurrent
              ? 'cursor-default border border-gray-200 bg-gray-50 text-gray-400'
              : isPro
              ? 'bg-primary text-white shadow-sm hover:bg-primary/90 disabled:opacity-60'
              : isPremium
              ? 'bg-amber-500 text-white shadow-sm hover:bg-amber-600 disabled:opacity-60'
              : 'bg-gray-900 text-white hover:bg-gray-700 disabled:opacity-60'
          }`}
        >
          {ctaLabel()}
        </button>

        {/* Footer note */}
        <div className="mt-3 text-center text-xs text-gray-400">
          {isActiveAndCurrent && subscription?.current_period_end && (
            <p>Renova em {new Date(subscription.current_period_end).toLocaleDateString('pt-BR')}</p>
          )}
          {isCurrent && isTrialing && subscription?.trial_days_left != null && (
            <p className="text-blue-600 font-medium">
              {subscription.trial_days_left} dia
              {subscription.trial_days_left !== 1 ? 's' : ''} restante
              {subscription.trial_days_left !== 1 ? 's' : ''} no trial
            </p>
          )}
          {!isCurrent && !isTrialing && !isUpgradeMode && (
            <p>7 dias grátis · Cancele quando quiser</p>
          )}
          {isUpgradeMode && <p>Mudança aplicada no próximo ciclo</p>}
        </div>

        {isDevMode && (
          <button
            onClick={handleDevActivate}
            disabled={devLoading || isActiveAndCurrent}
            className="mt-3 w-full rounded-xl border border-dashed border-amber-400 px-4 py-2 text-xs font-medium text-amber-700 hover:bg-amber-50 transition-colors disabled:opacity-40"
          >
            {devLoading ? 'Ativando…' : `⚡ Ativar sem pagamento (dev)`}
          </button>
        )}
      </div>
    </div>
  )
}
