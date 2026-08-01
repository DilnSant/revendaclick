import { logWarn } from '@/lib/logger'

const RESEND_API_URL = 'https://api.resend.com/emails'

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

// sendEmail never throws — a failed transactional e-mail must not break the
// flow that triggered it (e.g. inviting a vendor still works, just without
// automatic e-mail; the admin can still share the link manually).
export async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.RESEND_FROM_EMAIL ?? 'cobranca@revendaclick.com.br'

  if (!apiKey) {
    logWarn('resend: RESEND_API_KEY not set, skipping e-mail send', { to, subject })
    return false
  }

  try {
    const res = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from, to: [to], subject, html }),
    })
    if (!res.ok) {
      logWarn('resend: send failed', { to, subject, status: res.status })
      return false
    }
    return true
  } catch (err) {
    logWarn('resend: send threw', { to, subject, error: String(err) })
    return false
  }
}

export { escapeHtml }
