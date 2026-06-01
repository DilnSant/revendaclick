import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabaseServer'
import { LeadStatusBadge } from '../_components/LeadStatusBadge'
import { LeadDetailForm } from '../_components/LeadDetailForm'
import type { LeadStatus } from '../actions'

export const revalidate = 0

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function LeadDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = createServiceClient()

  const { data: lead, error } = await supabase
    .from('landing_leads')
    .select('id, name, phone, email, city, state, vehicles_count, store_name, source, utm_source, utm_medium, utm_campaign, utm_content, status, notes, created_at, updated_at')
    .eq('id', id)
    .single()

  if (error || !lead) notFound()

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/leads" className="text-xs text-gray-500 hover:text-gray-300">
          ← Voltar
        </Link>
        <span className="text-gray-700">/</span>
        <span className="text-xs text-gray-400">{lead.name}</span>
      </div>

      <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold text-white">{lead.name}</h1>
            <p className="mt-0.5 font-mono text-sm text-gray-400">{formatPhone(lead.phone)}</p>
          </div>
          <LeadStatusBadge status={lead.status} />
        </div>

        <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
          {lead.email && <Row label="E-mail" value={lead.email} />}
          {lead.store_name && <Row label="Revenda" value={lead.store_name} />}
          {lead.city && <Row label="Cidade" value={`${lead.city}${lead.state ? ` / ${lead.state}` : ''}`} />}
          {lead.vehicles_count && <Row label="Estoque" value={lead.vehicles_count} />}
          <Row label="Origem" value={lead.utm_source ?? lead.source} />
          {lead.utm_campaign && <Row label="Campanha" value={lead.utm_campaign} />}
          {lead.utm_medium && <Row label="Mídia" value={lead.utm_medium} />}
          {lead.utm_content && <Row label="Conteúdo" value={lead.utm_content} />}
          <Row label="Capturado em" value={formatDate(lead.created_at)} />
          {lead.updated_at && <Row label="Atualizado em" value={formatDate(lead.updated_at)} />}
        </dl>
      </div>

      <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-6">
        <h2 className="mb-4 text-sm font-semibold text-gray-300">Atendimento</h2>
        <LeadDetailForm
          id={lead.id}
          initialStatus={lead.status as LeadStatus}
          initialNotes={lead.notes}
        />
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="text-gray-500">{label}</dt>
      <dd className="text-gray-200">{value}</dd>
    </>
  )
}

function formatPhone(phone: string): string {
  const d = phone.replace(/\D/g, '')
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return phone
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  })
}
