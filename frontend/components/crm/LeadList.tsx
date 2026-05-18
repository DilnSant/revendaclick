'use client'

import { useState } from 'react'
import { SOURCE_LABELS, timeAgo, sellerInitials, type Lead, type Seller } from '@/lib/crm'
import StatusBadge from './StatusBadge'
import LeadDetail from './LeadDetail'
import LeadModal from './LeadModal'

interface Props {
  leads: Lead[]
  sellers: Seller[]
  total: number
}

export default function LeadList({ leads: initialLeads, sellers, total }: Props) {
  const [leads, setLeads] = useState(initialLeads)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [showModal, setShowModal] = useState(false)

  function handleUpdate(updated: Lead) {
    setLeads((prev) => prev.map((l) => (l.id === updated.id ? updated : l)))
    setSelectedLead(updated)
  }

  function handleDelete() {
    if (selectedLead) {
      setLeads((prev) => prev.filter((l) => l.id !== selectedLead.id))
    }
    setSelectedLead(null)
  }

  function handleCreated(lead: Lead) {
    setLeads((prev) => [lead, ...prev])
    setShowModal(false)
    setSelectedLead(lead)
  }

  return (
    <>
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-400">{total} lead{total !== 1 ? 's' : ''} no total</p>
        <button onClick={() => setShowModal(true)} className="btn-primary text-xs">
          + Novo lead
        </button>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-xs text-gray-400">
              <th className="px-4 py-3 font-medium">Lead</th>
              <th className="px-4 py-3 font-medium">Origem</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Vendedor</th>
              <th className="px-4 py-3 font-medium">Criado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {leads.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-xs text-gray-400">
                  Nenhum lead encontrado
                </td>
              </tr>
            ) : (
              leads.map((lead) => {
                const seller = sellers.find((s) => s.id === lead.seller_id)
                return (
                  <tr
                    key={lead.id}
                    onClick={() => setSelectedLead(lead)}
                    className="cursor-pointer transition-colors hover:bg-gray-50"
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{lead.name}</p>
                      <p className="text-xs text-gray-400">{lead.phone}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-500">
                        {SOURCE_LABELS[lead.source] ?? lead.source}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={lead.status} size="sm" />
                    </td>
                    <td className="px-4 py-3">
                      {seller ? (
                        <span className="flex items-center gap-1.5">
                          <span
                            className="flex h-5 w-5 items-center justify-center rounded-full
                                       bg-primary/10 text-[9px] font-bold text-primary"
                          >
                            {sellerInitials(seller.display_name)}
                          </span>
                          <span className="text-xs text-gray-600">{seller.display_name}</span>
                        </span>
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">
                      {timeAgo(lead.created_at)}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {selectedLead && (
        <LeadDetail
          lead={selectedLead}
          sellers={sellers}
          onClose={() => setSelectedLead(null)}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
        />
      )}

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
