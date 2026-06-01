'use client'

import { useState, useTransition } from 'react'
import { updateLeadDetail, type LeadStatus } from '../actions'

const STATUS_OPTIONS: { value: LeadStatus; label: string }[] = [
  { value: 'novo',          label: 'Novo'          },
  { value: 'contatado',     label: 'Contatado'     },
  { value: 'em_negociacao', label: 'Em negociação' },
  { value: 'convertido',    label: 'Convertido'    },
  { value: 'perdido',       label: 'Perdido'       },
]

interface Props {
  id: string
  initialStatus: LeadStatus
  initialNotes: string | null
  initialNextAction: string | null
}

export function LeadDetailForm({ id, initialStatus, initialNotes, initialNextAction }: Props) {
  const [status, setStatus] = useState<LeadStatus>(initialStatus)
  const [notes, setNotes] = useState(initialNotes ?? '')
  const [nextAction, setNextAction] = useState(initialNextAction ?? '')
  const [setLastContact, setSetLastContact] = useState(false)
  const [saved, setSaved] = useState(false)
  const [pending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaved(false)
    startTransition(async () => {
      await updateLeadDetail(id, status, notes || null, nextAction || null, setLastContact)
      setSaved(true)
      setSetLastContact(false)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1.5 block text-xs font-medium text-gray-400">Status</label>
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value as LeadStatus); setSaved(false) }}
          className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-gray-400">
          Próxima ação <span className="text-gray-600">({nextAction.length}/200)</span>
        </label>
        <input
          type="text"
          value={nextAction}
          onChange={(e) => { setNextAction(e.target.value.slice(0, 200)); setSaved(false) }}
          placeholder="Ex: Ligar amanhã às 10h, Enviar proposta..."
          className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:border-primary focus:outline-none"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-gray-400">
          Observações <span className="text-gray-600">({notes.length}/500)</span>
        </label>
        <textarea
          value={notes}
          onChange={(e) => { setNotes(e.target.value.slice(0, 500)); setSaved(false) }}
          rows={4}
          placeholder="Anotações sobre o atendimento..."
          className="w-full resize-none rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:border-primary focus:outline-none"
        />
      </div>

      <label className="flex cursor-pointer items-center gap-2 text-xs text-gray-400">
        <input
          type="checkbox"
          checked={setLastContact}
          onChange={(e) => setSetLastContact(e.target.checked)}
          className="rounded border-gray-600 bg-gray-900 text-primary focus:ring-primary"
        />
        Registrar último contato agora
      </label>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90 disabled:opacity-40"
        >
          {pending ? 'Salvando...' : 'Salvar'}
        </button>
        {saved && <span className="text-xs text-green-400">Salvo!</span>}
      </div>
    </form>
  )
}
