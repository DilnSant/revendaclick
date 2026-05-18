'use client'

import { useState, useOptimistic, useTransition } from 'react'
import {
  STATUS_CONFIG, KANBAN_COLUMNS, type Lead, type Seller, type LeadStatus,
} from '@/lib/crm'
import { updateLeadKanbanPosition } from '@/app/(dashboard)/leads/actions'
import LeadCard from './LeadCard'
import LeadDetail from './LeadDetail'
import LeadModal from './LeadModal'

interface Props {
  leads: Lead[]
  sellers: Seller[]
}

export default function LeadKanban({ leads, sellers }: Props) {
  const [, startTransition] = useTransition()
  const [optimisticLeads, updateOptimistic] = useOptimistic(
    leads,
    (state: Lead[], { leadId, status }: { leadId: string; status: LeadStatus }) =>
      state.map((l) => (l.id === leadId ? { ...l, status } : l)),
  )
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [dragging, setDragging] = useState<string | null>(null)
  const [overCol, setOverCol] = useState<LeadStatus | null>(null)

  const displayLeads = selectedLead
    ? optimisticLeads.map((l) => (l.id === selectedLead.id ? selectedLead : l))
    : optimisticLeads

  function handleDragStart(e: React.DragEvent, leadId: string) {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('leadId', leadId)
    setDragging(leadId)
  }

  function handleDragOver(e: React.DragEvent, status: LeadStatus) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setOverCol(status)
  }

  function handleDrop(e: React.DragEvent, status: LeadStatus) {
    e.preventDefault()
    const leadId = e.dataTransfer.getData('leadId')
    setDragging(null)
    setOverCol(null)

    const lead = displayLeads.find((l) => l.id === leadId)
    if (!lead || lead.status === status) return

    startTransition(async () => {
      updateOptimistic({ leadId, status })
      await updateLeadKanbanPosition(leadId, status)
      if (selectedLead?.id === leadId) {
        setSelectedLead((prev) => prev ? { ...prev, status } : null)
      }
    })
  }

  function handleDragEnd() {
    setDragging(null)
    setOverCol(null)
  }

  function handleUpdate(updated: Lead) {
    if (selectedLead?.id === updated.id) setSelectedLead(updated)
  }

  function handleDelete() {
    setSelectedLead(null)
  }

  function handleCreated(lead: Lead) {
    setShowModal(false)
    setSelectedLead(lead)
  }

  return (
    <>
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-400">
          {displayLeads.length} lead{displayLeads.length !== 1 ? 's' : ''}
        </p>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary text-xs"
        >
          + Novo lead
        </button>
      </div>

      {/* Board */}
      <div className="flex gap-3 overflow-x-auto pb-4" style={{ minHeight: '60vh' }}>
        {KANBAN_COLUMNS.map((status) => {
          const cfg = STATUS_CONFIG[status]
          const colLeads = displayLeads.filter((l) => l.status === status)
          const isOver = overCol === status

          return (
            <div
              key={status}
              onDragOver={(e) => handleDragOver(e, status)}
              onDrop={(e) => handleDrop(e, status)}
              onDragLeave={() => setOverCol(null)}
              className={`flex w-64 shrink-0 flex-col rounded-xl border transition-colors
                          ${cfg.columnBg} ${cfg.columnBorder}
                          ${isOver ? 'ring-2 ring-primary/40' : ''}`}
            >
              {/* Column header */}
              <div className="flex items-center justify-between px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${cfg.dot}`} />
                  <span className="text-xs font-semibold text-gray-700">{cfg.label}</span>
                </div>
                <span className="rounded-full bg-white/60 px-1.5 py-0.5 text-[10px] font-medium text-gray-500">
                  {colLeads.length}
                </span>
              </div>

              {/* Cards */}
              <div className="flex flex-1 flex-col gap-2 overflow-y-auto px-2 pb-3">
                {colLeads.map((lead) => (
                  <div
                    key={lead.id}
                    className={dragging === lead.id ? 'opacity-40' : ''}
                    onDragEnd={handleDragEnd}
                  >
                    <LeadCard
                      lead={lead}
                      sellers={sellers}
                      onDragStart={handleDragStart}
                      onClick={() => setSelectedLead(lead)}
                    />
                  </div>
                ))}

                {colLeads.length === 0 && (
                  <div
                    className={`flex flex-1 items-center justify-center rounded-lg border-2
                                border-dashed py-8 text-[11px] text-gray-300 transition-colors
                                ${isOver ? 'border-primary/40 bg-primary/5' : 'border-gray-200'}`}
                  >
                    {isOver ? 'Soltar aqui' : 'Sem leads'}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Detail panel */}
      {selectedLead && (
        <LeadDetail
          lead={selectedLead}
          sellers={sellers}
          onClose={() => setSelectedLead(null)}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
        />
      )}

      {/* Create modal */}
      {showModal && (
        <LeadModal
          sellers={sellers}
          onClose={() => setShowModal(false)}
          onCreated={handleCreated}
        />
      )}
    </>
  )
}
