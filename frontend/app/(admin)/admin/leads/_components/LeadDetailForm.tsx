'use client'

import { useState, useTransition } from 'react'
import { updateLeadDetail, type LeadStatus } from '../actions'

const STATUS_OPTIONS: { value: LeadStatus; label: string }[] = [
  { value: 'novo',       label: 'Novo'       },
  { value: 'contatado',  label: 'Contatado'  },
  { value: 'atendido',   label: 'Atendido'   },
  { value: 'convertido', label: 'Convertido' },
  { value: 'descartado', label: 'Descartado' },
]

interface Props {
  id: string
  initialStatus: LeadStatus
  initialNotes: string | null
}

export function LeadDetailForm({ id, initialStatus, initialNotes }: Props) {
  const [status, setStatus] = useState<LeadStatus>(initialStatus)
  const [notes, setNotes] = useState(initialNotes ?? '')
  const [saved, setSaved] = useState(false)
  const [pending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaved(false)
    startTransition(async () => {
      await updateLeadDetail(id, status, notes || null)
      setSaved(true)
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
          Observações <span className="text-gray-600">({notes.length}/500)</span>
        </label>
        <textarea
          value={notes}
          onChange={(e) => { setNotes(e.target.value.slice(0, 500)); setSaved(false) }}
          rows={4}
          placeholder="Anotações sobre o atendimento..."
          className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:border-primary focus:outline-none resize-none"
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90 disabled:opacity-40"
        >
          {pending ? 'Salvando...' : 'Salvar'}
        </button>
        {saved && (
          <span className="text-xs text-green-400">Salvo!</span>
        )}
      </div>
    </form>
  )
}
