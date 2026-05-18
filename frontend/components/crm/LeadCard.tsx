'use client'

import { SOURCE_LABELS, timeAgo, whatsAppUrl, sellerInitials, type Lead, type Seller } from '@/lib/crm'

interface Props {
  lead: Lead
  sellers: Seller[]
  onDragStart: (e: React.DragEvent, leadId: string) => void
  onClick: () => void
}

export default function LeadCard({ lead, sellers, onDragStart, onClick }: Props) {
  const seller = sellers.find((s) => s.id === lead.seller_id)

  return (
    <article
      draggable
      onDragStart={(e) => onDragStart(e, lead.id)}
      onClick={onClick}
      className="group cursor-pointer select-none rounded-lg border border-gray-100 bg-white
                 p-3 shadow-card transition-all hover:shadow-card-hover active:scale-[0.98]"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <p className="line-clamp-1 text-sm font-semibold text-gray-900">{lead.name}</p>
        <span className="shrink-0 text-[10px] text-gray-400">{timeAgo(lead.created_at)}</span>
      </div>

      <p className="mt-0.5 text-xs text-gray-500">{lead.phone}</p>

      {lead.message && (
        <p className="mt-1.5 line-clamp-2 text-[11px] leading-relaxed text-gray-400">
          {lead.message}
        </p>
      )}

      {/* Footer */}
      <div className="mt-2.5 flex items-center justify-between gap-2">
        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-500">
          {SOURCE_LABELS[lead.source] ?? lead.source}
        </span>

        {seller ? (
          <span className="flex items-center gap-1">
            <span
              className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10
                         text-[9px] font-bold text-primary"
            >
              {sellerInitials(seller.display_name)}
            </span>
            <span className="max-w-[72px] truncate text-[11px] text-gray-500">
              {seller.display_name}
            </span>
          </span>
        ) : (
          <span className="text-[10px] text-gray-300">Sem vendedor</span>
        )}
      </div>

      {/* WhatsApp CTA */}
      <a
        href={whatsAppUrl(lead.phone, lead.name)}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-md
                   bg-green-50 py-1 text-[11px] font-medium text-green-700
                   opacity-0 transition-opacity group-hover:opacity-100 hover:bg-green-100"
      >
        <span>💬</span> WhatsApp
      </a>
    </article>
  )
}
