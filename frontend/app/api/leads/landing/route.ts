import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabaseServer'
import { sendMetaConversionEvent, hashData } from '@/lib/marketing/meta-conversions'

const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX = 3
const ipTimestamps = new Map<string, number[]>()

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const timestamps = (ipTimestamps.get(ip) ?? []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS)
  if (timestamps.length >= RATE_LIMIT_MAX) return true
  ipTimestamps.set(ip, [...timestamps, now])
  if (ipTimestamps.size > 5_000) {
    const oldest = [...ipTimestamps.keys()].slice(0, 1_000)
    oldest.forEach((k) => ipTimestamps.delete(k))
  }
  return false
}

function cleanPhone(raw: string): string {
  return raw.replace(/\D/g, '').slice(0, 20)
}

function sanitize(value: unknown, maxLen = 200): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim().slice(0, maxLen)
  return trimmed || null
}

function sanitizeState(value: unknown): string | null {
  const s = sanitize(value, 2)
  if (!s) return null
  const upper = s.toUpperCase()
  return /^[A-Z]{2}$/.test(upper) ? upper : null
}

function fireWebhook(payload: Record<string, unknown>) {
  const url = process.env.WEBHOOK_LEADS_URL
  if (!url) return
  if (!url.startsWith('https://')) {
    console.warn('[landing-lead] WEBHOOK_LEADS_URL must start with https:// — skipping webhook')
    return
  }
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (process.env.WEBHOOK_SECRET) {
    headers['x-webhook-secret'] = process.env.WEBHOOK_SECRET
  }
  void fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(5_000),
  }).catch((err: Error) => {
    console.error('[landing-lead] webhook error:', err.message)
  })
}

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: 'Muitas solicitações. Aguarde um momento.' },
      { status: 429 },
    )
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Corpo da requisição inválido.' }, { status: 400 })
  }

  if (body.website) {
    return NextResponse.json({ success: true })
  }

  const name  = sanitize(body.name, 120)
  const phone = cleanPhone(String(body.phone ?? ''))

  if (!name || name.length < 2) {
    return NextResponse.json({ error: 'Nome inválido.' }, { status: 400 })
  }
  if (phone.length < 10) {
    return NextResponse.json({ error: 'Telefone inválido.' }, { status: 400 })
  }

  const vehicles_count = sanitize(body.vehicles_count, 50)
  const city           = sanitize(body.city, 100)
  const state          = sanitizeState(body.state)
  const source         = sanitize(body.source) ?? 'organic'
  const utm_source     = sanitize(body.utm_source)
  const utm_medium     = sanitize(body.utm_medium)
  const utm_campaign   = sanitize(body.utm_campaign)
  const utm_content    = sanitize(body.utm_content)

  const supabase = createServiceClient()
  const { error } = await supabase.from('landing_leads').insert({
    name,
    phone,
    email: sanitize(body.email),
    store_name: sanitize(body.store_name),
    vehicles_count,
    city,
    state,
    source,
    utm_source,
    utm_medium,
    utm_campaign,
    utm_content,
  })

  if (error) {
    console.error('[landing-lead] insert error:', error.message)
    return NextResponse.json({ error: 'Erro ao salvar contato. Tente novamente.' }, { status: 500 })
  }

  console.info('[landing-lead] saved:', { name, phone: phone.slice(0, 4) + '****', city, state, source })

  // Fire-and-forget webhook (N8N, WhatsApp, etc.) — does not block response
  fireWebhook({
    name, phone,
    vehicles_count, city, state,
    source, utm_source, utm_medium, utm_campaign, utm_content,
    created_at: new Date().toISOString(),
  })

  // Fire-and-forget Meta Conversions API event
  void (async () => {
    await sendMetaConversionEvent({
      event_name: 'Lead',
      event_time: Math.floor(Date.now() / 1000),
      user_data: {
        ph: phone ? [await hashData(phone)] : [],
        client_ip_address: ip !== 'unknown' ? ip : undefined,
        client_user_agent: req.headers.get('user-agent') ?? undefined,
      },
      custom_data: { vehicles_count, city, state },
      event_source_url: req.headers.get('referer') ?? 'https://revendaclick.com.br',
      action_source: 'website',
    })
  })()

  return NextResponse.json({ success: true }, { status: 201 })
}
