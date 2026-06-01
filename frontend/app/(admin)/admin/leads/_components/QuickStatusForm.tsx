'use client'

import { useTransition } from 'react'
import { updateLeadStatus, type LeadStatus } from '../actions'

const NEXT_STATUS: Record<LeadStatus, { next: LeadStatus; label: string } | null> = {
  novo:       { next: 'contatado',  label: 'Marcar contatado'  },
  contatado:  { next: 'atendido',   label: 'Marcar atendido'   },
  atendido:   { next: 'convertido', label: 'Marcar convertido' },
  convertido: null,
  descartado: null,
}

interface Props {
  id: string
  currentStatus: LeadStatus
}

export function QuickStatusForm({ id, currentStatus }: Props) {
  const [pending, startTransition] = useTransition()
  const action = NEXT_STATUS[currentStatus]

  if (!action) return null

  return (
    <button
      disabled={pending}
      onClick={() => startTransition(() => updateLeadStatus(id, action.next))}
      className="whitespace-nowrap rounded-lg bg-gray-800 px-2.5 py-1 text-[11px] font-medium text-gray-300 transition-colors hover:bg-gray-700 hover:text-white disabled:opacity-40"
    >
      {pending ? '...' : action.label}
    </button>
  )
}
