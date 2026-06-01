/**
 * Meta Conversions API (CAPI) — server-side event tracking
 *
 * Docs: https://developers.facebook.com/docs/marketing-api/conversions-api
 * API version: v19.0
 *
 * Requires env vars:
 *   META_PIXEL_ID   — numeric Pixel ID (e.g. "1234567890")
 *   META_CAPI_TOKEN — System User Access Token with ads_management permission
 *
 * When env vars are absent, all calls are silently no-ops (safe for local dev).
 */

export interface MetaUserData {
  /** SHA-256 hashed phone numbers (E.164 format, no leading +) */
  ph?: string[]
  /** SHA-256 hashed email addresses */
  em?: string[]
  /** Client IP address — not hashed */
  client_ip_address?: string
  /** Client user agent string — not hashed */
  client_user_agent?: string
  /** ISO 3166-1 alpha-2 country code (lowercase), hashed */
  country?: string[]
  /** City (lowercase, no spaces), hashed */
  ct?: string[]
  /** State (2-letter, lowercase), hashed */
  st?: string[]
}

export interface MetaConversionEvent {
  /** Standard or custom event name (e.g. "Lead", "Purchase", "PageView") */
  event_name: string
  /** Unix timestamp in seconds */
  event_time: number
  /** User identifiers for matching */
  user_data: MetaUserData
  /** Arbitrary custom data (currency, value, content_name, etc.) */
  custom_data?: Record<string, unknown>
  /** Full URL where the event occurred */
  event_source_url?: string
  /** Where the conversion happened — "website" | "app" | "offline" | etc. */
  action_source: string
  /**
   * Optional deduplication key. If you also fire the browser pixel for the
   * same event, use the same eventID in both places.
   */
  event_id?: string
}

/**
 * Hash a plain-text string with SHA-256 using the Web Crypto API.
 * The value is lowercased and trimmed before hashing, following Meta's spec.
 */
export async function hashData(value: string): Promise<string> {
  const normalized = value.toLowerCase().trim()
  const encoded = new TextEncoder().encode(normalized)
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoded)
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Send a single event to Meta Conversions API.
 * Fire-and-forget — errors are logged but never thrown.
 *
 * @param event   The conversion event payload.
 * @param ip      (optional) Client IP for server-side deduplication.
 * @param userAgent (optional) Client User-Agent string.
 */
export async function sendMetaConversionEvent(
  event: MetaConversionEvent,
  ip?: string,
  userAgent?: string,
): Promise<void> {
  const pixelId = process.env.META_PIXEL_ID
  const token   = process.env.META_CAPI_TOKEN

  if (!pixelId || !token) {
    // Silently skip — integration not configured in this environment
    return
  }

  // Merge server-detected IP / UA into user_data when caller didn't supply them
  const userData: MetaUserData = { ...event.user_data }
  if (ip && ip !== 'unknown' && !userData.client_ip_address) {
    userData.client_ip_address = ip
  }
  if (userAgent && !userData.client_user_agent) {
    userData.client_user_agent = userAgent
  }

  const payload = {
    data: [
      {
        event_name:       event.event_name,
        event_time:       event.event_time,
        event_source_url: event.event_source_url,
        event_id:         event.event_id,
        action_source:    event.action_source,
        user_data:        userData,
        custom_data:      event.custom_data,
      },
    ],
    // test_event_code: 'TEST12345', // uncomment for Meta Test Events tool
  }

  const url = `https://graph.facebook.com/v19.0/${pixelId}/events?access_token=${token}`

  void fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
    .then(async (res) => {
      if (!res.ok) {
        const body = await res.text().catch(() => '')
        console.error('[meta-capi] non-2xx response:', res.status, body)
      }
    })
    .catch((err: Error) => {
      console.error('[meta-capi] fetch error:', err.message)
    })
}
