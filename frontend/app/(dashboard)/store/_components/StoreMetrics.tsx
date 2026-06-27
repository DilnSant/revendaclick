interface Props {
  published: boolean
  leadsCount: number
  hasFirstLead: boolean
}

export default function StoreMetrics({ published, leadsCount, hasFirstLead }: Props) {
  // Conversion rate: leads / published vehicle count proxy
  // We don't have vehicle_count in this context — show leads + first-lead status
  return (
    <div
      data-testid="store-metrics"
      className="grid gap-4 sm:grid-cols-3"
    >
      <MetricCard
        label="Status"
        value={published ? 'Publicada' : 'Não publicada'}
        color={published ? 'text-green-700' : 'text-amber-700'}
        sublabel={published ? 'Aparece para visitantes' : 'Requer configuração'}
      />
      <MetricCard
        label="Leads gerados"
        value={String(leadsCount)}
        color="text-gray-900"
        sublabel={hasFirstLead ? 'Primeiro lead recebido' : 'Aguardando primeiro lead'}
      />
      <MetricCard
        label="Origem principal"
        value="Vitrine pública"
        color="text-primary"
        sublabel="Todos os leads via loja pública"
      />
    </div>
  )
}

function MetricCard({
  label, value, color, sublabel,
}: {
  label: string
  value: string
  color: string
  sublabel: string
}) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</p>
      <p className={`mt-2 text-xl font-heading font-bold ${color}`}>{value}</p>
      <p className="mt-1 text-xs text-gray-500">{sublabel}</p>
    </div>
  )
}