import Link from 'next/link'
import type { PlanUsage } from '@/lib/tenant'

interface Props {
  usage: PlanUsage
}

/**
 * Sticky banner shown at the top of the dashboard when usage is high.
 *
 * Thresholds (from DB alertLevel function):
 *   80%  → warning   (gentle nudge)
 *   85%  → critical  (urgency banner)
 *  100%  → blocked   (hard blocker)
 */
export default function PlanAlertBanner({ usage }: Props) {
  const level = getWorstAlert(usage)
  if (level === 'ok') return null

  const configs = {
    warning: {
      bg: 'bg-yellow-50 border-yellow-300',
      text: 'text-yellow-800',
      message: `Você está utilizando mais de 80% do seu plano ${usage.plan_display}. Considere fazer upgrade para evitar interrupções.`,
    },
    critical: {
      bg: 'bg-orange-50 border-orange-400',
      text: 'text-orange-800',
      message: `⚠️ Você atingiu 85% do seu plano ${usage.plan_display} — evite perder vendas! Faça upgrade agora.`,
    },
    blocked: {
      bg: 'bg-red-50 border-red-500',
      text: 'text-red-800',
      message: `🚫 Limite do plano atingido. Novas ações estão bloqueadas. Faça upgrade para continuar vendendo.`,
    },
  }

  const cfg = configs[level as keyof typeof configs]

  return (
    <div className={`border-b px-4 py-3 ${cfg.bg}`}>
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        <p className={`text-sm font-medium ${cfg.text}`}>{cfg.message}</p>
        <Link
          href="/settings?tab=plan"
          className="shrink-0 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-dark"
        >
          Fazer upgrade
        </Link>
      </div>
    </div>
  )
}

function getWorstAlert(usage: PlanUsage): string {
  const alerts = [usage.vehicles_alert, usage.users_alert]
  if (alerts.includes('blocked')) return 'blocked'
  if (alerts.includes('critical')) return 'critical'
  if (alerts.includes('warning')) return 'warning'
  return 'ok'
}
