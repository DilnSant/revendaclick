'use client'

import { useState } from 'react'
import type { Plan, Subscription } from '@/lib/billing-utils'
import PlanCard from './PlanCard'

interface Props {
  plans: Plan[]
  subscription: Subscription | null
}

export default function PlansGrid({ plans, subscription }: Props) {
  const [cycle, setCycle] = useState<'monthly' | 'yearly'>(
    (subscription?.billing_cycle as 'monthly' | 'yearly') ?? 'monthly'
  )

  const hasYearlyDiscount = plans.some((p) => p.price_yearly < p.price_monthly * 12)

  return (
    <div>
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
                  cycle === 'yearly'
                    ? 'bg-green-500 text-white'
                    : 'bg-green-100 text-green-700'
                }`}
              >
                -20%
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {plans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            cycle={cycle}
            currentPlanName={subscription?.plan_name}
            subscription={subscription}
          />
        ))}
      </div>
    </div>
  )
}
