const COLOR: Record<string, string> = {
  novo:       'bg-blue-900/40 text-blue-300',
  contatado:  'bg-yellow-900/40 text-yellow-300',
  atendido:   'bg-purple-900/40 text-purple-300',
  convertido: 'bg-green-900/40 text-green-300',
  descartado: 'bg-gray-800 text-gray-500',
}

const LABEL: Record<string, string> = {
  novo:       'Novo',
  contatado:  'Contatado',
  atendido:   'Atendido',
  convertido: 'Convertido',
  descartado: 'Descartado',
}

export function LeadStatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${COLOR[status] ?? 'bg-gray-800 text-gray-400'}`}>
      {LABEL[status] ?? status}
    </span>
  )
}
