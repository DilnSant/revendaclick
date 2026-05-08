'use client'

import { usePlanFeatures } from '@/components/layout/DashboardShell'

type FeatureKey = 'has_crm' | 'has_analytics' | 'has_whatsapp' | 'has_kanban' | 'has_api_access' | 'has_white_label'

interface Props {
  feature: FeatureKey
  fallback?: React.ReactNode
  children: React.ReactNode
}

export default function FeatureGate({ feature, fallback, children }: Props) {
  const features = usePlanFeatures()
  if (!features[feature]) {
    return fallback ? <>{fallback}</> : <UpgradePrompt feature={feature} />
  }
  return <>{children}</>
}

const FEATURE_LABELS: Record<FeatureKey, string> = {
  has_crm:         'CRM',
  has_analytics:   'Analytics avançado',
  has_whatsapp:    'WhatsApp',
  has_kanban:      'Kanban',
  has_api_access:  'Acesso à API',
  has_white_label: 'White-label',
}

function UpgradePrompt({ feature }: { feature: FeatureKey }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 py-12 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
        <svg className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m0 0v2m0-2h2m-2 0H10m2-9V4m0 4l-2 2m2-2l2 2" />
        </svg>
      </div>
      <p className="text-sm font-semibold text-gray-800">
        {FEATURE_LABELS[feature]} não disponível
      </p>
      <p className="mt-1 text-xs text-gray-500">
        Faça upgrade do seu plano para desbloquear este recurso.
      </p>
      <a
        href="/billing/plans"
        className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 transition-colors"
      >
        Ver planos
      </a>
    </div>
  )
}
