import { getToken, unauthorized, proxyTo } from '../_proxy'

export async function GET() {
  const token = await getToken()
  if (!token) return unauthorized()
  return proxyTo('/api/evolution/status', 'GET', token)
}
