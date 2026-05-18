import { NextRequest, NextResponse } from 'next/server'
import { getToken, proxyTo, unauthorized } from '../_proxy'

export async function POST(req: NextRequest) {
  const token = await getToken()
  if (!token) return unauthorized()
  const body = await req.text()
  return proxyTo('/api/evolution/send', 'POST', token, body)
}
