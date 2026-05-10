import { getToken, unauthorized, proxyTo } from '../_proxy'

export async function DELETE() {
  const token = await getToken()
  if (!token) return unauthorized()
  return proxyTo('/api/evolution/disconnect', 'DELETE', token)
}
