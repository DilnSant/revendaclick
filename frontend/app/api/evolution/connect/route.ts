import { getToken, unauthorized, proxyTo } from '../_proxy'

export async function POST() {
  const token = await getToken()
  if (!token) return unauthorized()
  return proxyTo('/api/evolution/connect', 'POST', token)
}
