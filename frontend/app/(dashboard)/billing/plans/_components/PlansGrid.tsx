'use client'

import { useState } from 'react'
import type { Plan, Subscription } from '@/lib/billing-utils'
import PlanCard from './PlanCard'

interface Props {
  plans: Plan[]
  subscription: Subscription | null
  cpfCnpj: string | null
}

export default function PlansGrid({ plans, subscription, cpfCnpj }: Props) {
  const [cycle, setCycle] = useState<'monthly' | 'yearly'>(
    (subscription?.billing_cycle as 'monthly' | 'yearly') ?? 'monthly'
  )

  // Only show public plans: starter, pro, premium — hide scale from grid
  const publicPlans = plans.filter((p) => p.name !== 'scale')
  const hasYearlyDiscount = publicPlans.some((p) => p.price_yearly < p.price_monthly * 12)

  return (
    <div>
      {/* Billing cycle toggle */}
      <div className="flex justify-center mb-8">
        <div className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white p-1 shadow-sm">
          <button
            onClick={() => setCycle('monthly')}
            className={`rounded-full px-5 py-2 text-sm font-medium transition-all ${
              cycle === 'monthly'
                ? 'bg-gray-900 text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Mensal
          </button>
          <button
            onClick={() => setCycle('yearly')}
            className={`inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-medium transition-all ${
              cycle === 'yearly'
                ? 'bg-gray-900 text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Anual
            {hasYearlyDiscount && (
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                  cycle === 'yearly' ? 'bg-green-500 text-white' : 'bg-green-100 text-green-700'
                }`}
              >
                -20%
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Public plan cards — max 3 columns */}
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {publicPlans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            cycle={cycle}
            currentPlanName={subscription?.plan_name}
            subscription={subscription}
            cpfCnpj={cpfCnpj}
          />
        ))}
      </div>

      {/* Enterprise CTA */}
      <div className="mt-10 rounded-2xl border border-gray-200 bg-gray-50 px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <p className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-1">Enterprise</p>
          <h3 className="text-xl font-bold text-gray-900">Precisa de uma solução corporativa?</h3>
          <p className="mt-1 text-sm text-gray-500">
            Volumes ilimitados, white-label, multi-loja, API REST, SLA dedicado e atendimento exclusivo.
          </p>
        </div>
        <a
          href={`https://wa.me/5548988482877?text=${encodeURIComponent('Olá! Gostaria de entender melhor qual plano do RevendaClick é mais indicado para minha loja.')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 rounded-xl border-2 border-gray-900 px-6 py-3 text-sm font-semibold text-gray-900 hover:bg-gray-900 hover:text-white transition-all"
        >
          Falar com especialista →
        </a>
      </div>
    </div>
  )
}
