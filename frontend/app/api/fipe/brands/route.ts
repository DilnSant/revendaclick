import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const res = await fetch(
      'https://parallelum.com.br/fipe/api/v1/carros/marcas',
      { next: { revalidate: 86400 } },
    )
    if (!res.ok) return NextResponse.json([], { status: 502 })
    const data = await res.json()
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=3600' },
    })
  } catch {
    return NextResponse.json([], { status: 502 })
  }
}
