import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const brandCode = searchParams.get('brand')
  const modelCode = searchParams.get('model')
  if (!brandCode || !modelCode) return NextResponse.json([], { status: 400 })

  try {
    const res = await fetch(
      `https://parallelum.com.br/fipe/api/v1/carros/marcas/${brandCode}/modelos/${modelCode}/anos`,
      { next: { revalidate: 86400 } },
    )
    if (!res.ok) return NextResponse.json([], { status: 502 })
    const data = await res.json()
    return NextResponse.json(Array.isArray(data) ? data : [], {
      headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=3600' },
    })
  } catch {
    return NextResponse.json([], { status: 502 })
  }
}
