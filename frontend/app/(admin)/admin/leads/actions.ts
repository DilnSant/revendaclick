'use server'

import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabaseServer'

export type LeadStatus = 'novo' | 'contatado' | 'em_negociacao' | 'convertido' | 'perdido'

const CONTACT_STATUSES = new Set<LeadStatus>(['contatado', 'em_negociacao', 'convertido', 'perdido'])

export async function updateLeadStatus(id: string, status: LeadStatus) {
  const supabase = createServiceClient()
  const now = new Date().toISOString()
  const { error } = await supabase
    .from('landing_leads')
    .update(
      CONTACT_STATUSES.has(status)
        ? { status, updated_at: now, last_contact_at: now }
        : { status, updated_at: now },
    )
    .eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/leads')
  revalidatePath(`/admin/leads/${id}`)
}

export async function updateLeadDetail(
  id: string,
  status: LeadStatus,
  notes: string | null,
  nextAction: string | null,
  setLastContact: boolean,
) {
  const supabase = createServiceClient()
  const now = new Date().toISOString()
  const touchContact = setLastContact || CONTACT_STATUSES.has(status)
  const { error } = await supabase
    .from('landing_leads')
    .update({
      status,
      notes: notes ? notes.trim().slice(0, 500) || null : null,
      next_action: nextAction ? nextAction.trim().slice(0, 200) || null : null,
      updated_at: now,
      ...(touchContact ? { last_contact_at: now } : {}),
    })
    .eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/leads')
  revalidatePath(`/admin/leads/${id}`)
}
