'use server'

import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabaseServer'

export type LeadStatus = 'novo' | 'contatado' | 'atendido' | 'convertido' | 'descartado'

export async function updateLeadStatus(id: string, status: LeadStatus) {
  const supabase = createServiceClient()
  const { error } = await supabase
    .from('landing_leads')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/admin/leads')
  revalidatePath(`/admin/leads/${id}`)
}

export async function updateLeadDetail(id: string, status: LeadStatus, notes: string | null) {
  const supabase = createServiceClient()
  const { error } = await supabase
    .from('landing_leads')
    .update({
      status,
      notes: notes ? notes.trim().slice(0, 500) || null : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/admin/leads')
  revalidatePath(`/admin/leads/${id}`)
}
