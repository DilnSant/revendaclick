import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient, createClient } from '@/lib/supabaseServer'

const BUCKET = 'vehicles'
const MAX_SIZE = 8 * 1024 * 1024   // 8 MB
const ALLOWED  = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

export async function POST(req: NextRequest) {
  // Validate session
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Resolve tenant_id from users table
  const svc = createServiceClient()
  const { data: userRow } = await svc
    .from('users')
    .select('tenant_id')
    .eq('id', user.id)
    .eq('is_active', true)
    .single()

  if (!userRow?.tenant_id) {
    return NextResponse.json({ error: 'Tenant not found' }, { status: 403 })
  }

  const tenantId: string = userRow.tenant_id

  // Parse multipart
  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid multipart body' }, { status: 400 })
  }

  const file = formData.get('file')
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'File is required' }, { status: 400 })
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'Arquivo muito grande (máx 8 MB)' }, { status: 413 })
  }
  if (!ALLOWED.includes(file.type)) {
    return NextResponse.json({ error: 'Tipo não suportado. Use JPEG, PNG ou WebP' }, { status: 415 })
  }

  // Build storage path: vehicles/{tenant_id}/{timestamp}-{random}.ext
  const ext  = file.type === 'image/webp' ? 'webp' : file.type === 'image/png' ? 'png' : 'jpg'
  const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
  const path = `${tenantId}/${name}`

  const arrayBuffer = await file.arrayBuffer()

  const { error: uploadErr } = await svc.storage
    .from(BUCKET)
    .upload(path, arrayBuffer, {
      contentType: file.type,
      upsert: false,
    })

  if (uploadErr) {
    console.error('[vehicle-photo upload]', uploadErr)
    return NextResponse.json({ error: 'Erro ao fazer upload: ' + uploadErr.message }, { status: 500 })
  }

  const { data: publicUrlData } = svc.storage.from(BUCKET).getPublicUrl(path)

  return NextResponse.json({ url: publicUrlData.publicUrl })
}
