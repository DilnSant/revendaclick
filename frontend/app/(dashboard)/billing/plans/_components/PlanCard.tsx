'use client'

import { useState } from 'react'
import { formatCurrency } from '@/lib/billing-utils'
import type { Plan, Subscription } from '@/lib/billing-utils'

interface Props {
  plan: Plan
  currentPlanName?: string
  currentCycle: string
  subscription?: Subscription | null
}

export default function PlanCard({ plan, currentPlanName, currentCycle, subscription }: Props) {
  const [cycle, setCycle] = useState<'monthly' | 'yearly'>(currentCycle as 'monthly' | 'yearly')
  const [billingType, setBillingType] = useState<'BOLETO' | 'PIX' | 'CREDIT_CARD'>('BOLETO')
  const [loading, setLoading] = useState(false)
  const [cpf, setCpf] = useState('')
  const [subscribeError, setSubscribeError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const isCurrent  = plan.name === currentPlanName
  const isTrialing = subscription?.status === 'trialing'

  // Block the button only when the subscription is active on this exact plan.
  // During trialing the user must be able to anticipate (subscribe) any plan.
  const isActiveAndCurrent = isCurrent && !isTrialing

  const price         = cycle === 'yearly' ? plan.price_yearly / 12 : plan.price_monthly
  const yearlyDiscount = Math.round((1 - plan.price_yearly / (plan.price_monthly * 12)) * 100)
  const isPro = plan.name === 'pro'

  async function handleSubscribe() {
    setLoading(true)
    setSubscribeError(null)
    setSuccessMsg(null)
    try {
      const res = await fetch('/api/billing/subscribe-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan_name: plan.name,
          billing_cycle: cycle,
          billing_type: billingType,
          cpf_or_cnpj: cpf || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setSubscribeError(data.error ?? 'Erro ao processar. Tente novamente.')
        return
      }
      if (data.asaas_payment_link) {
        setSuccessMsg('Redirecionando para pagamento…')
        window.open(data.asaas_payment_link, '_blank')
      } else {
        setSuccessMsg('Assinatura ativada! Recarregue a página.')
      }
    } catch {
      setSubscribeError('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  function ctaLabel(): string {
    if (isActiveAndCurrent) return 'Plano atual ✓'
    if (loading)            return 'Processando…'
    if (isCurrent && isTrialing) return 'Antecipar assinatura'
    return 'Assinar'
  }

  return (
    <div
      className={`flex flex-col rounded-xl border p-6 shadow-sm transition-shadow hover:shadow-md ${
        isPro
          ? 'border-primary bg-primary/5 ring-2 ring-primary'
          : 'border-gray-200 bg-white'
      }`}
    >
      {isPro && (
        <span className="mb-3 self-start rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-white">
          Mais popular
        </span>
      )}

      <div className="flex items-center justify-between gap-2">
        <h3 className="text-lg font-bold text-gray-900">{plan.display_name}</h3>
        {isCurrent && isTrialing && (
          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
            Trial ativo
          </span>
        )}
      </div>

      {/* Cycle toggle */}
      <div className="mt-3 flex gap-1 rounded-lg bg-gray-100 p-1 text-xs">
        <button
          className={`flex-1 rounded-md px-2 py-1 font-medium transition-colors ${
            cycle === 'monthly' ? 'bg-white shadow text-gray-900' : 'text-gray-500'
          }`}
          onClick={() => setCycle('monthly')}
        >
          Mensal
        </button>
        <button
          className={`flex-1 rounded-md px-2 py-1 font-medium transition-colors ${
            cycle === 'yearly' ? 'bg-white shadow text-gray-900' : 'text-gray-500'
          }`}
          onClick={() => setCycle('yearly')}
        >
          Anual {yearlyDiscount > 0 && <span className="text-green-600">-{yearlyDiscount}%</span>}
        </button>
      </div>

      {/* Price */}
      <div className="mt-4">
        <span className="text-3xl font-extrabold text-gray-900">
          {formatCurrency(price)}
        </span>
        <span className="text-sm text-gray-500">/mês</span>
        {cycle === 'yearly' && (
          <p className="text-xs text-gray-400 mt-0.5">
            {formatCurrency(plan.price_yearly)} cobrado anualmente
          </p>
        )}
      </div>

      {/* Limits */}
      <ul className="mt-4 space-y-1.5 text-sm text-gray-600 flex-1">
        <li>
          <span className="font-medium">{plan.max_vehicles === -1 ? 'Ilimitados' : plan.max_vehicles}</span> veículos
        </li>
        <li>
          <span className="font-medium">{plan.max_users === -1 ? 'Ilimitados' : plan.max_users}</span> usuários
        </li>
        <li>
          <span className="font-medium">{plan.max_leads === -1 ? 'Ilimitados' : plan.max_leads}</span> leads/mês
        </li>
      </ul>

      {/* Features */}
      <ul className="mt-3 space-y-1 text-xs text-gray-500">
        {plan.features.slice(0, 5).map((f) => (
          <li key={f} className="flex items-center gap-1">
            <span className="text-green-500">✓</span>
            {featureLabel(f)}
          </li>
        ))}
      </ul>

      {/* Billing type — show for all non-active-current plans */}
      {!isActiveAndCurrent && (
        <div className="mt-4">
          <label className="text-xs text-gray-500 mb-1 block">Forma de pagamento</label>
          <select
            value={billingType}
            onChange={(e) => setBillingType(e.target.value as 'BOLETO' | 'PIX' | 'CREDIT_CARD')}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
          >
            <option value="BOLETO">Boleto</option>
            <option value="PIX">PIX</option>
            <option value="CREDIT_CARD">Cartão de crédito</option>
          </select>

          <input
            type="text"
            placeholder="CPF ou CNPJ (opcional)"
            value={cpf}
            onChange={(e) => setCpf(e.target.value)}
            className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
          />
        </div>
      )}

      {subscribeError && (
        <div className="mt-3 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
          {subscribeError}
        </div>
      )}
      {successMsg && (
        <div className="mt-3 rounded-lg bg-green-50 border border-green-200 px-3 py-2 text-xs text-green-700">
          {successMsg}
        </div>
      )}

      {/* CTA */}
      <button
        onClick={isActiveAndCurrent ? undefined : handleSubscribe}
        disabled={isActiveAndCurrent || loading}
        className={`mt-4 w-full rounded-lg px-4 py-3 text-sm font-semibold transition-colors ${
          isActiveAndCurrent
            ? 'bg-primary/10 text-primary border border-primary/30 cursor-default'
            : isPro
            ? 'bg-primary text-white hover:bg-primary-dark disabled:opacity-60'
            : 'bg-gray-900 text-white hover:bg-gray-700 disabled:opacity-60'
        }`}
      >
        {ctaLabel()}
      </button>

      {/* Subscription status info */}
      {isActiveAndCurrent && subscription && (
        <div className="mt-2 text-center text-xs text-gray-400 space-y-0.5">
          {subscription.current_period_end && (
            <p>Renova em {new Date(subscription.current_period_end).toLocaleDateString('pt-BR')}</p>
          )}
        </div>
      )}

      {isCurrent && isTrialing && subscription && (
        <div className="mt-2 text-center text-xs space-y-0.5">
          {subscription.trial_days_left != null && (
            <p className="text-blue-600 font-medium">
              {subscription.trial_days_left} dia{subscription.trial_days_left !== 1 ? 's' : ''} de trial restante{subscription.trial_days_left !== 1 ? 's' : ''}
            </p>
          )}
          {subscription.trial_ends_at && (
            <p className="text-gray-400">
              Trial até {new Date(subscription.trial_ends_at).toLocaleDateString('pt-BR')}
            </p>
          )}
        </div>
      )}

      {!isCurrent && !isTrialing && (
        <p className="mt-2 text-center text-xs text-gray-400">7 dias de trial gratuito</p>
      )}
    </div>
  )
}

function featureLabel(f: string): string {
  const labels: Record<string, string> = {
    marketplace: 'Marketplace público',
    whatsapp_button: 'Botão WhatsApp',
    lead_capture: 'Captura de leads',
    crm: 'CRM completo',
    kanban: 'Kanban de leads',
    custom_domain: 'Domínio personalizado',
    analytics: 'Analytics avançado',
    priority_support: 'Suporte prioritário',
    api_access: 'Acesso à API',
    white_label: 'White-label',
  }
  return labels[f] ?? f
}
