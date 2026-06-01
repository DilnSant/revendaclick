/**
 * Google Ads Conversion API — stub (não ativo em produção)
 *
 * Docs: https://developers.google.com/google-ads/api/docs/conversions/upload-clicks
 *
 * Para ativar: configurar as env vars abaixo e substituir o corpo de
 * sendGoogleConversionEvent() com a chamada real via google-ads-api npm package.
 *
 * Env vars necessárias:
 *   GOOGLE_ADS_CUSTOMER_ID
 *   GOOGLE_ADS_DEVELOPER_TOKEN
 *   GOOGLE_ADS_CONVERSION_ACTION_ID
 *   GOOGLE_ADS_REFRESH_TOKEN
 *   GOOGLE_ADS_CLIENT_ID
 *   GOOGLE_ADS_CLIENT_SECRET
 */

export interface GoogleConversionEvent {
  gclid?: string
  conversionAction?: string
  conversionDateTime: string
  conversionValue?: number
  currencyCode?: string
  orderId?: string
  hashedEmail?: string
  hashedPhoneNumber?: string
}

export async function sendGoogleConversionEvent(
  event: GoogleConversionEvent,
): Promise<void> {
  const configured =
    process.env.GOOGLE_ADS_CUSTOMER_ID && process.env.GOOGLE_ADS_DEVELOPER_TOKEN

  if (!configured) return

  // Stub — substituir com chamada real quando credenciais estiverem disponíveis
  if (process.env.NODE_ENV === 'development') {
    console.debug('[google-conversions] stub:', event.orderId, event.conversionDateTime)
  }
}
