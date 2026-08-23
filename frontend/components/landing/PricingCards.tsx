'use client'

import { useState } from 'react'
import { IconCheck } from './ui'

type Plan = {
  id: string
  name: string
  display_name: string
  tagline: string
  max_vehicles: number
  max_users: number
  max_leads: number
  price_monthly: number
  price_yearly: number
  features: string[]
}

const PLAN_ITEMS: Record<string, string[]> = {
  starter: [
    'Vitrine online com seus veículos',
    'Botão WhatsApp na vitrine',
    'Captura automática de leads',
    'Controle financeiro e de equipe',
  ],
  pro: [
    'Tudo do Starter',
    'CRM com pipeline visual',
    'Analytics de resultados',
    'Histórico completo por cliente',
  ],
  premium: [
    'Tudo do Pro',
    'WhatsApp conectado ao CRM',
    'IA que recupera leads parados',
    'Automação de follow-up',
  ],
  scale: [
    'Tudo do Premium',
    'Veículos, usuários e leads ilimitados',
    'Múltiplas lojas na mesma conta',
    'API, white-label e suporte prioritário',
  ],
}

function formatPrice(value: number): string {
  return new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)
}

function PriceTag({ plan, cycle }: { plan: Plan; cycle: 'monthly' | 'yearly' }) {
  if (plan.name === 'scale') {
    // Enterprise — sempre mostra o preço cheio, sem toggle mensal/anual
    return (
      <div className="mt-5 flex items-baseline gap-1">
        <span className="text-3xl font-extrabold tracking-tight text-white">R$ {formatPrice(plan.price_monthly)}</span>
        <span className="text-sm text-white/40">/mês</span>
      </div>
    )
  }
  const price = cycle === 'yearly' ? plan.price_yearly / 12 : plan.price_monthly
  return (
    <div className="mt-5">
      <div className="flex items-baseline gap-1">
        <span className="text-4xl font-extrabold tracking-tight text-white">R$ {formatPrice(price)}</span>
        <span className="text-sm text-white/40">/mês</span>
      </div>
      {cycle === 'yearly' && (
        <p className="mt-0.5 text-xs text-primary/80">R$ {formatPrice(plan.price_yearly)}/ano</p>
      )}
    </div>
  )
}

function PlanCapacity({ plan }: { plan: Plan }) {
  const inf = (n: number) => (n === -1 ? '∞' : n)
  return (
    <div className="mt-5 grid grid-cols-3 gap-0 rounded-xl border border-white/[0.06] bg-white/[0.02] divide-x divide-white/[0.06] px-1 py-3">
      <div className="text-center px-2">
        <p className="text-sm font-bold text-white">{inf(plan.max_vehicles)}</p>
        <p className="text-[10px] text-white/40 leading-tight">veículos</p>
      </div>
      <div className="text-center px-2">
        <p className="text-sm font-bold text-white">{inf(plan.max_users)}</p>
        <p className="text-[10px] text-white/40 leading-tight">usuários</p>
      </div>
      <div className="text-center px-2">
        <p className="text-sm font-bold text-white">{inf(plan.max_leads)}</p>
        <p className="text-[10px] text-white/40 leading-tight">leads/mês</p>
      </div>
    </div>
  )
}

function PricingCard({ plan, cycle, badge }: { plan: Plan; cycle: 'monthly' | 'yearly'; badge?: string }) {
  const highlighted = badge === 'Mais popular'
  return (
    <div
      className={`relative flex flex-col rounded-2xl border p-6 transition-all duration-300 ${
        highlighted
          ? 'border-primary/40 bg-primary/[0.06] shadow-lg shadow-primary/10'
          : 'border-white/[0.08] bg-white/[0.03] hover:border-white/[0.16]'
      }`}
    >
      {badge && (
        <div className="absolute -top-3.5 left-0 right-0 flex justify-center">
          <span
            className={`rounded-full px-3 py-1 text-xs font-bold shadow-sm ${
              highlighted ? 'bg-primary text-white' : 'bg-amber-500 text-white'
            }`}
          >
            {badge}
          </span>
        </div>
      )}

      <h3 className="text-base font-bold text-white">{plan.display_name}</h3>
      <p className="mt-0.5 text-xs text-white/45 leading-snug">{plan.tagline}</p>

      <PriceTag plan={plan} cycle={cycle} />
      <PlanCapacity plan={plan} />

      <ul className="mt-5 flex-1 space-y-2">
        {(PLAN_ITEMS[plan.name] ?? []).map((item) => (
          <li key={item} className="flex items-start gap-2 text-sm text-white/70">
            <IconCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            {item}
          </li>
        ))}
      </ul>

      <a
        href="/register"
        className={`mt-6 block w-full rounded-xl px-4 py-3 text-center text-sm font-semibold transition-all ${
          highlighted
            ? 'bg-primary text-white shadow-sm hover:bg-primary/90'
            : 'bg-white/10 text-white hover:bg-white/15'
        }`}
      >
        Começar teste grátis
      </a>
      <p className="mt-3 text-center text-xs text-white/35">30 dias grátis · Cancele quando quiser</p>
    </div>
  )
}

export default function PricingCards({ plans }: { plans: Plan[] }) {
  const [cycle, setCycle] = useState<'monthly' | 'yearly'>('monthly')
  const [enterpriseOpen, setEnterpriseOpen] = useState(false)

  const publicPlans = plans.filter((p) => p.name !== 'scale')
  const enterprisePlan = plans.find((p) => p.name === 'scale') ?? null
  const hasYearlyDiscount = publicPlans.some((p) => p.price_yearly < p.price_monthly * 12)

  const badges: Record<string, string> = {
    pro: 'Mais popular',
    premium: 'Melhor custo-benefício',
  }

  if (publicPlans.length === 0) return null

  return (
    <div>
      <div className="flex justify-center mb-10">
        <div className="inline-flex items-center gap-1 rounded-full border border-white/[0.1] bg-white/[0.04] p-1">
          <button
            onClick={() => setCycle('monthly')}
            className={`rounded-full px-5 py-2 text-sm font-medium transition-all ${
              cycle === 'monthly' ? 'bg-white text-graphite shadow-sm' : 'text-white/50 hover:text-white/80'
            }`}
          >
            Mensal
          </button>
          <button
            onClick={() => setCycle('yearly')}
            className={`inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-medium transition-all ${
              cycle === 'yearly' ? 'bg-white text-graphite shadow-sm' : 'text-white/50 hover:text-white/80'
            }`}
          >
            Anual
            {hasYearlyDiscount && (
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                  cycle === 'yearly' ? 'bg-primary text-white' : 'bg-primary/20 text-primary'
                }`}
              >
                economize
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {publicPlans.map((plan) => (
          <PricingCard key={plan.id} plan={plan} cycle={cycle} badge={badges[plan.name]} />
        ))}
      </div>

      {enterprisePlan && (
        <div className="mt-10 text-center">
          <button
            onClick={() => setEnterpriseOpen(true)}
            className="text-sm text-white/40 underline decoration-dotted underline-offset-4 hover:text-white/70 transition-colors"
          >
            Precisa de um plano ilimitado para sua rede? Clique aqui
          </button>
        </div>
      )}

      {enterpriseOpen && enterprisePlan && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md px-4 py-8 overflow-y-auto"
          onClick={(e) => { if (e.target === e.currentTarget) setEnterpriseOpen(false) }}
        >
          <div className="w-full max-w-sm">
            <div className="mb-3 flex justify-end">
              <button
                onClick={() => setEnterpriseOpen(false)}
                className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-white/70 hover:bg-white/20"
              >
                Fechar ✕
              </button>
            </div>
            <div className="rounded-2xl bg-[#07080B]">
              <PricingCard plan={enterprisePlan} cycle={cycle} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
