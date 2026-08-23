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

  const [enterpriseOpen, setEnterpriseOpen] = useState(false)

  // Only show public plans: starter, pro, premium — hide scale (Enterprise) from grid
  const publicPlans = plans.filter((p) => p.name !== 'scale')
  const enterprisePlan = plans.find((p) => p.name === 'scale') ?? null
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

      {/* Enterprise — discreet reveal link */}
      {enterprisePlan && (
        <div className="mt-8 text-center">
          <button
            onClick={() => setEnterpriseOpen(true)}
            className="text-sm text-gray-400 underline decoration-dotted underline-offset-4 hover:text-gray-600 transition-colors"
          >
            Precisa de um plano ilimitado para sua rede? Clique aqui
          </button>
        </div>
      )}

      {enterpriseOpen && enterprisePlan && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-8 overflow-y-auto"
          onClick={(e) => { if (e.target === e.currentTarget) setEnterpriseOpen(false) }}
        >
          <div className="w-full max-w-sm">
            <div className="mb-3 flex justify-end">
              <button
                onClick={() => setEnterpriseOpen(false)}
                className="rounded-full bg-white/90 px-3 py-1.5 text-xs font-medium text-gray-600 shadow hover:bg-white"
              >
                Fechar ✕
              </button>
            </div>
            <PlanCard
              plan={enterprisePlan}
              cycle={cycle}
              currentPlanName={subscription?.plan_name}
              subscription={subscription}
              cpfCnpj={cpfCnpj}
            />
          </div>
        </div>
      )}
    </div>
  )
}
