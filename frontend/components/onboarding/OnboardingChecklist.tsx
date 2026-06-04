'use client'

import { useState } from 'react'
import Link from 'next/link'

export interface ChecklistData {
  tenant_id: string
  added_vehicle: boolean
  published_store: boolean
  received_first_lead: boolean
  whatsapp_connected: boolean
  completed_at?: string | null
  // feature flag from usage API
  has_central_atendimento?: boolean
}

interface Props {
  checklist: ChecklistData
}

const STEPS = [
  {
    key: 'store' as const,
    label: 'Criar sua loja',
    description: 'Configure o nome, endereço e contato da revenda',
    href: '/settings',
    alwaysDone: true,
  },
  {
    key: 'added_vehicle' as const,
    label: 'Cadastrar primeiro veículo',
    description: 'Adicione um veículo ao seu estoque',
    href: '/vehicles',
    alwaysDone: false,
  },
  {
    key: 'published_store' as const,
    label: 'Publicar vitrine',
    description: 'Configure o contato público e publique sua loja',
    href: '/settings?tab=contact',
    alwaysDone: false,
  },
  {
    key: 'received_first_lead' as const,
    label: 'Receber primeiro lead',
    description: 'Compartilhe sua vitrine e aguarde o primeiro contato',
    href: null,
    alwaysDone: false,
  },
] as const

export default function OnboardingChecklist({ checklist }: Props) {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed || checklist.completed_at) return null

  const isDone = (key: typeof STEPS[number]['key']) => {
    if (key === 'store') return true
    return checklist[key as keyof ChecklistData] === true
  }

  const completedCount = STEPS.filter(s => isDone(s.key)).length
  const totalRequired = STEPS.length
  const progress = Math.round((completedCount / totalRequired) * 100)

  const nextStep = STEPS.find(s => !isDone(s.key))

  return (
    <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-white overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-primary/10">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
            <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Configure sua revenda</h3>
            <p className="text-xs text-gray-500">{completedCount} de {totalRequired} passos concluídos</p>
          </div>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="rounded-md p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          aria-label="Fechar"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Progress bar */}
      <div className="px-5 pt-3">
        <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Steps */}
      <div className="px-5 py-4 space-y-2">
        {STEPS.map((step, idx) => {
          const done = isDone(step.key)
          const isNext = nextStep?.key === step.key
          return (
            <div
              key={step.key}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors ${
                isNext ? 'bg-primary/8 border border-primary/20' : ''
              }`}
            >
              {/* Step indicator */}
              <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                done
                  ? 'bg-green-500'
                  : isNext
                  ? 'bg-primary/20 ring-2 ring-primary/30'
                  : 'bg-gray-100'
              }`}>
                {done ? (
                  <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <span className={`text-xs font-bold ${isNext ? 'text-primary' : 'text-gray-400'}`}>
                    {idx + 1}
                  </span>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium leading-tight ${done ? 'text-gray-400 line-through' : isNext ? 'text-gray-900' : 'text-gray-600'}`}>
                  {step.label}
                </p>
                {isNext && (
                  <p className="mt-0.5 text-xs text-gray-500">{step.description}</p>
                )}
              </div>

              {/* CTA */}
              {isNext && step.href && (
                <Link
                  href={step.href}
                  className="shrink-0 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-dark transition-colors"
                >
                  Fazer agora
                </Link>
              )}
            </div>
          )
        })}

        {/* Optional step: Central de Atendimento */}
        {checklist.has_central_atendimento && (
          <div className="flex items-center gap-3 rounded-xl px-3 py-2.5 border border-dashed border-gray-200">
            <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
              checklist.whatsapp_connected ? 'bg-green-500' : 'bg-gray-100'
            }`}>
              {checklist.whatsapp_connected ? (
                <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="h-3 w-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>
            <div className="flex-1">
              <p className={`text-sm font-medium leading-tight ${checklist.whatsapp_connected ? 'text-gray-400 line-through' : 'text-gray-600'}`}>
                Ativar Automação WhatsApp
              </p>
              <p className="text-xs text-gray-400">Opcional — transforme contatos em oportunidades</p>
            </div>
            {!checklist.whatsapp_connected && (
              <Link
                href="/whatsapp"
                className="shrink-0 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Conectar
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
