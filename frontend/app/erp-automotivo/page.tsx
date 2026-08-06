import SegmentPage, { buildMetadata } from '@/components/landing/segments/SegmentPage'
import { SEGMENTOS } from '@/components/landing/segments/data'

const SEGMENTO = SEGMENTOS['erp-automotivo']

export const metadata = buildMetadata(SEGMENTO)

export default function Page() {
  return <SegmentPage segmento={SEGMENTO} />
}
