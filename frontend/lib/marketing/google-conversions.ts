/**
 * Google Ads Conversion API — server-side conversion tracking
 *
 * Official docs:
 *   https://developers.google.com/google-ads/api/docs/conversions/upload-clicks
 *   https://developers.google.com/google-ads/api/reference/rpc/v16/ConversionUploadService
 *
 * Requires env vars:
 *   GOOGLE_ADS_CUSTOMER_ID      — 10-digit customer ID without dashes (e.g. "1234567890")
 *   GOOGLE_ADS_DEVELOPER_TOKEN  — developer token from Google Ads API Center
 *   GOOGLE_ADS_CONVERSION_ACTION_ID — resource name suffix for the conversion action
 *   GOOGLE_ADS_REFRESH_TOKEN    — OAuth2 refresh token for server-to-server auth
 *   GOOGLE_ADS_CLIENT_ID        — OAuth2 client ID
 *   GOOGLE_ADS_CLIENT_SECRET    — OAuth2 client secret
 *
 * When env vars are absent, the call is a no-op in production and logs a
 * debug message in development.
 *
 * Implementation note:
 *   The Google Ads API requires OAuth2 authentication and gRPC or REST calls
 *   to the GoogleAdsService. A full production implementation should use the
 *   official Node.js client library:
 *     https://www.npmjs.com/package/google-ads-api
 *
 *   This module provides the correct interface and a safe stub so the rest of
 *   the codebase can call it today — enabling a drop-in real implementation
 *   once OAuth credentials are available.
 */

export interface GoogleConversionEvent {
  /**
   * Google Click ID (gclid) captured from the landing page URL parameter.
   * Required for click-based conversion import.
   */
  gclid?: string
  /**
   * Conversion action resource name.
   * Format: "customers/{customer_id}/conversionActions/{conversion_action_id}"
   */
  conversionAction?: string
  /**
   * ISO 8601 datetime string of when the conversion occurred.
   * Example: "2026-06-01T14:30:00+00:00"
   */
  conversionDateTime: string
  /**
   * Monetary value of the conversion (optional).
   */
  conversionValue?: number
  /**
   * Currency code for the conversion value (ISO 4217).
   * Example: "BRL"
   */
  currencyCode?: string
  /**
   * Order ID for deduplication (optional).
   * Use a stable, unique ID per conversion (e.g. lead UUID).
   */
  orderId?: string
  /**
   * Hashed email address (SHA-256, lowercase, trimmed) for enhanced conversions.
   * See: https://developers.google.com/google-ads/api/docs/conversions/enhanced-conversions
   */
  hashedEmail?: string
  /**
   * Hashed phone number (SHA-256, E.164 format without +) for enhanced conversions.
   */
  hashedPhoneNumber?: string
}

/**
 * Send a conversion event to the Google Ads Conversion API.
 *
 * Currently a stub — logs the event payload in development.
 * Replace the body with a real API call once Google Ads OAuth credentials
 * are provisioned and the `google-ads-api` package is installed.
 *
 * Fire-and-forget: never throws.
 */
export async function sendGoogleConversionEvent(
  event: GoogleConversionEvent,
): Promise<void> {
  const customerId    = process.env.GOOGLE_ADS_CUSTOMER_ID
  const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN

  if (!customerId || !developerToken) {
    if (process.env.NODE_ENV === 'development') {
      console.debug('[google-conversions] integration not configured — skipping:', event)
    }
    return
  }

  /**
   * TODO: Replace this stub with a real Google Ads API call.
   *
   * Example using the `google-ads-api` npm package:
   *
   * ```ts
   * import { GoogleAdsApi, enums } from 'google-ads-api'
   *
   * const client = new GoogleAdsApi({
   *   client_id:     process.env.GOOGLE_ADS_CLIENT_ID!,
   *   client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET!,
   *   developer_token: developerToken,
   * })
   *
   * const customer = client.Customer({
   *   customer_id:   customerId,
   *   refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN!,
   * })
   *
   * const conversionAction =
   *   event.conversionAction ??
   *   `customers/${customerId}/conversionActions/${process.env.GOOGLE_ADS_CONVERSION_ACTION_ID}`
   *
   * await customer.conversionUploads.uploadClickConversions({
   *   customer_id: customerId,
   *   conversions: [{
   *     gclid:                event.gclid,
   *     conversion_action:    conversionAction,
   *     conversion_date_time: event.conversionDateTime,
   *     conversion_value:     event.conversionValue,
   *     currency_code:        event.currencyCode ?? 'BRL',
   *     order_id:             event.orderId,
   *   }],
   *   partial_failure: true,
   * })
   * ```
   *
   * Docs: https://developers.google.com/google-ads/api/docs/conversions/upload-clicks
   */

  // Production stub — safe no-op until credentials are configured
  console.info('[google-conversions] event queued (stub):', {
    customerId,
    conversionDateTime: event.conversionDateTime,
    orderId: event.orderId,
  })
}
