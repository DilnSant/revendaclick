import { STATUS_CONFIG, type LeadStatus } from '@/lib/crm'

interface Props {
  status: LeadStatus
  size?: 'sm' | 'md'
}

export default function StatusBadge({ status, size = 'md' }: Props) {
  const cfg = STATUS_CONFIG[status]
  const px = size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-xs'

  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-medium ${px} ${cfg.badge}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  )
}
