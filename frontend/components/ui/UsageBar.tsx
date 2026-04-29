interface Props {
  pct: number
  alert: string
  className?: string
}

const trackColors: Record<string, string> = {
  ok:       'bg-green-500',
  warning:  'bg-yellow-400',
  critical: 'bg-orange-500',
  blocked:  'bg-red-600',
}

export default function UsageBar({ pct, alert, className = '' }: Props) {
  const fill = Math.min(pct, 100)
  const color = trackColors[alert] ?? trackColors.ok

  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>{pct.toFixed(0)}% utilizado</span>
      </div>
      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${fill}%` }}
        />
      </div>
    </div>
  )
}
