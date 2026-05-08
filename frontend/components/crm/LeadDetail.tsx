'use client'

import { useState, useTransition, useEffect, useRef } from 'react'
import {
  STATUS_CONFIG, KANBAN_COLUMNS, SOURCE_LABELS, whatsAppUrl, sellerInitials,
  type Lead, type Seller, type LeadStatus,
} from '@/lib/crm'
import { updateLeadStatus, assignSeller, updateLeadNotes, deleteLead, setFollowUp } from '@/app/(dashboard)/leads/actions'
import ActivityTimeline from './ActivityTimeline'
import StatusBadge from './StatusBadge'

interface Props {
  lead: Lead
  sellers: Seller[]
  onClose: () => void
  onUpdate: (lead: Lead) => void
  onDelete: () => void
}

export default function LeadDetail({ lead, sellers, onClose, onUpdate, onDelete }: Props) {
  const [isPending, startTransition] = useTransition()
  const [notes, setNotes] = useState(lead.notes ?? '')
  const [notesDirty, setNotesDirty] = useState(false)
  const [followUpAt, setFollowUpAt] = useState(
    lead.follow_up_at ? new Date(lead.follow_up_at).toISOString().slice(0, 16) : ''
  )
  const [followUpNote, setFollowUpNote] = useState(lead.follow_up_note ?? '')
  const [followUpDirty, setFollowUpDirty] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  // Close on Escape key
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  // Sync notes and follow-up when lead changes
  useEffect(() => {
    setNotes(lead.notes ?? '')
    setNotesDirty(false)
    setFollowUpAt(lead.follow_up_at ? new Date(lead.follow_up_at).toISOString().slice(0, 16) : '')
    setFollowUpNote(lead.follow_up_note ?? '')
    setFollowUpDirty(false)
  }, [lead.id, lead.notes, lead.follow_up_at, lead.follow_up_note])

  function handleStatusChange(status: LeadStatus) {
    startTransition(async () => {
      const result = await updateLeadStatus(lead.id, status)
      if (result.error) { setError(result.error.message); return }
      onUpdate({ ...lead, status })
    })
  }

  function handleSellerChange(sellerId: string) {
    const id = sellerId === '' ? null : sellerId
    startTransition(async () => {
      const result = await assignSeller(lead.id, id)
      if (result.error) { setError(result.error.message); return }
      onUpdate({ ...lead, seller_id: id })
    })
  }

  function handleSaveNotes() {
    startTransition(async () => {
      const result = await updateLeadNotes(lead.id, notes)
      if (result.error) { setError(result.error.message); return }
      setNotesDirty(false)
      onUpdate({ ...lead, notes })
    })
  }

  function handleSaveFollowUp() {
    startTransition(async () => {
      const result = await setFollowUp(lead.id, followUpAt || null, followUpNote || undefined)
      if (result.error) { setError(result.error.message); return }
      setFollowUpDirty(false)
      onUpdate({ ...lead, follow_up_at: followUpAt || null, follow_up_note: followUpNote || null })
    })
  }

  function handleClearFollowUp() {
    startTransition(async () => {
      const result = await setFollowUp(lead.id, null)
      if (result.error) { setError(result.error.message); return }
      setFollowUpAt('')
      setFollowUpNote('')
      setFollowUpDirty(false)
      onUpdate({ ...lead, follow_up_at: null, follow_up_note: null })
    })
  }

  function handleDelete() {
    if (!confirm(`Deletar o lead de ${lead.name}? Esta ação não pode ser desfeita.`)) return
    startTransition(async () => {
      await deleteLead(lead.id)
      onDelete()
    })
  }

  const assignedSeller = sellers.find((s) => s.id === lead.seller_id)

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col
                   overflow-hidden border-l border-gray-200 bg-white shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-gray-100 px-6 py-4">
          <div className="flex-1 min-w-0">
            <h2 className="truncate text-lg font-bold text-gray-900">{lead.name}</h2>
            <p className="mt-0.5 text-sm text-gray-500">{lead.phone}</p>
            {lead.email && <p className="text-xs text-gray-400">{lead.email}</p>}
          </div>
          <div className="flex items-center gap-2 ml-4 shrink-0">
            <a
              href={whatsAppUrl(lead.phone, lead.name)}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-100"
            >
              💬 WhatsApp
            </a>
            <button
              onClick={onClose}
              className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {error && (
            <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
              <button onClick={() => setError(null)} className="ml-2 text-red-400">✕</button>
            </div>
          )}

          {/* Status + Seller — two-column grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Status selector */}
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Status</label>
              <select
                value={lead.status}
                onChange={(e) => handleStatusChange(e.target.value as LeadStatus)}
                disabled={isPending}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm
                           outline-none focus:border-primary focus:ring-1 focus:ring-primary
                           disabled:opacity-50"
              >
                {KANBAN_COLUMNS.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_CONFIG[s].label}
                  </option>
                ))}
              </select>
            </div>

            {/* Seller selector */}
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Vendedor</label>
              <select
                value={lead.seller_id ?? ''}
                onChange={(e) => handleSellerChange(e.target.value)}
                disabled={isPending}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm
                           outline-none focus:border-primary focus:ring-1 focus:ring-primary
                           disabled:opacity-50"
              >
                <option value="">Sem vendedor</option>
                {sellers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.display_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Meta info */}
          <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3 text-xs text-gray-500 space-y-1.5">
            <Row label="Origem" value={SOURCE_LABELS[lead.source] ?? lead.source} />
            <Row label="Criado em" value={new Date(lead.created_at).toLocaleString('pt-BR')} />
            {lead.contacted_at && (
              <Row label="Primeiro contato" value={new Date(lead.contacted_at).toLocaleString('pt-BR')} />
            )}
            {lead.closed_at && (
              <Row label="Fechado em" value={new Date(lead.closed_at).toLocaleString('pt-BR')} />
            )}
            {lead.utm_source && <Row label="UTM Source" value={lead.utm_source} />}
            {lead.utm_campaign && <Row label="UTM Campaign" value={lead.utm_campaign} />}
          </div>

          {/* Message from lead */}
          {lead.message && (
            <div>
              <p className="mb-1 text-xs font-medium text-gray-600">Mensagem do lead</p>
              <p className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-700">
                {lead.message}
              </p>
            </div>
          )}

          {/* Follow-up */}
          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="text-xs font-medium text-gray-600">Follow-up agendado</label>
              {lead.follow_up_at && (
                <button
                  onClick={handleClearFollowUp}
                  disabled={isPending}
                  className="text-xs text-red-500 hover:text-red-600 disabled:opacity-50"
                >
                  Limpar
                </button>
              )}
            </div>
            {lead.follow_up_at && !followUpDirty && (
              <div className={`mb-2 rounded-md px-3 py-2 text-xs font-medium ${
                new Date(lead.follow_up_at) < new Date()
                  ? 'bg-red-50 text-red-700'
                  : 'bg-blue-50 text-blue-700'
              }`}>
                {new Date(lead.follow_up_at) < new Date() ? '⚠️ Atrasado: ' : '📅 '}
                {new Date(lead.follow_up_at).toLocaleString('pt-BR')}
              </div>
            )}
            <input
              type="datetime-local"
              value={followUpAt}
              onChange={(e) => { setFollowUpAt(e.target.value); setFollowUpDirty(true) }}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm
                         text-gray-800 outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
            {followUpDirty && (
              <>
                <input
                  type="text"
                  value={followUpNote}
                  onChange={(e) => setFollowUpNote(e.target.value)}
                  placeholder="Observação sobre o follow-up…"
                  className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm
                             text-gray-800 placeholder-gray-400 outline-none
                             focus:border-primary focus:ring-1 focus:ring-primary"
                />
                <button
                  onClick={handleSaveFollowUp}
                  disabled={isPending || !followUpAt}
                  className="btn-primary mt-2 w-full text-xs"
                >
                  {isPending ? 'Salvando…' : 'Salvar follow-up'}
                </button>
              </>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Notas internas</label>
            <textarea
              value={notes}
              onChange={(e) => { setNotes(e.target.value); setNotesDirty(true) }}
              placeholder="Adicione notas sobre este lead…"
              rows={4}
              className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm
                         text-gray-800 placeholder-gray-400 outline-none
                         focus:border-primary focus:ring-1 focus:ring-primary"
            />
            {notesDirty && (
              <button
                onClick={handleSaveNotes}
                disabled={isPending}
                className="btn-primary mt-2 w-full text-xs"
              >
                {isPending ? 'Salvando…' : 'Salvar notas'}
              </button>
            )}
          </div>

          {/* Activity timeline */}
          <div>
            <p className="mb-3 text-xs font-medium text-gray-600">Atividades</p>
            <ActivityTimeline leadId={lead.id} />
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 px-6 py-3">
          <button
            onClick={handleDelete}
            disabled={isPending}
            className="w-full rounded-lg border border-red-200 py-2 text-xs font-medium
                       text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
          >
            Deletar lead
          </button>
        </div>
      </div>
    </>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-400">{label}</span>
      <span className="font-medium text-gray-700">{value}</span>
    </div>
  )
}
