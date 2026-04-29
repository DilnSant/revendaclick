'use client'

import { useState, useTransition, useEffect } from 'react'
import { ACTIVITY_CONFIG, type LeadActivity, type ActivityType } from '@/lib/crm'
import { fetchLeadActivities, addActivity } from '@/app/(dashboard)/leads/actions'

interface Props {
  leadId: string
}

const ACTIVITY_TYPES: ActivityType[] = ['note', 'call', 'whatsapp', 'email', 'other']

export default function ActivityTimeline({ leadId }: Props) {
  const [activities, setActivities] = useState<LeadActivity[]>([])
  const [type, setType] = useState<ActivityType>('note')
  const [text, setText] = useState('')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    startTransition(async () => {
      const data = await fetchLeadActivities(leadId)
      setActivities(data)
    })
  }, [leadId])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim()) return
    setError(null)

    startTransition(async () => {
      const result = await addActivity(leadId, type, text.trim())
      if (result.error) {
        setError(result.error.message)
        return
      }
      // Prepend new activity optimistically
      setActivities((prev) => [result.data!, ...prev])
      setText('')
    })
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Add activity form */}
      <form onSubmit={handleSubmit} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
        <div className="flex gap-2">
          <select
            value={type}
            onChange={(e) => setType(e.target.value as ActivityType)}
            className="rounded-md border border-gray-200 bg-white px-2 py-1.5 text-xs text-gray-700
                       outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          >
            {ACTIVITY_TYPES.map((t) => (
              <option key={t} value={t}>
                {ACTIVITY_CONFIG[t].icon} {ACTIVITY_CONFIG[t].label}
              </option>
            ))}
          </select>
        </div>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Descreva o que aconteceu…"
          rows={2}
          className="mt-2 w-full resize-none rounded-md border border-gray-200 bg-white px-3 py-2
                     text-xs text-gray-800 placeholder-gray-400 outline-none
                     focus:border-primary focus:ring-1 focus:ring-primary"
        />

        {error && <p className="mt-1 text-xs text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={isPending || !text.trim()}
          className="btn-primary mt-2 w-full text-xs"
        >
          {isPending ? 'Salvando…' : 'Registrar atividade'}
        </button>
      </form>

      {/* Timeline */}
      {isPending && activities.length === 0 ? (
        <p className="text-center text-xs text-gray-400">Carregando…</p>
      ) : activities.length === 0 ? (
        <p className="text-center text-xs text-gray-400">Nenhuma atividade registrada</p>
      ) : (
        <ol className="relative border-l border-gray-200 pl-4">
          {activities.map((a) => {
            const cfg = ACTIVITY_CONFIG[a.type] ?? ACTIVITY_CONFIG.other
            return (
              <li key={a.id} className="mb-4 ml-2">
                <span
                  className="absolute -left-2 flex h-4 w-4 items-center justify-center
                             rounded-full border border-white bg-gray-100 text-[10px]"
                >
                  {cfg.icon}
                </span>
                <p className="text-xs font-medium text-gray-700">{a.description}</p>
                <time className="mt-0.5 block text-[10px] text-gray-400">
                  {new Date(a.created_at).toLocaleString('pt-BR', {
                    day: '2-digit',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                  {' · '}
                  {cfg.label}
                </time>
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
}
