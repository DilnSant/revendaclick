import { publicFetch } from '@/lib/proxy'
import { Section, SectionHead, Reveal } from './ui'
import PricingCards from './PricingCards'

type Plan = {
  id: string
  name: string
  display_name: string
  tagline: string
  max_vehicles: number
  max_users: number
  max_leads: number
  price_monthly: number
  price_yearly: number
  features: string[]
  is_active: boolean
}

export default async function PricingSection() {
  const plans = await publicFetch<Plan[]>('/api/plans')
  if (!plans || plans.length === 0) return null

  return (
    <Section id="planos" label="Planos e preços">
      <Reveal>
        <SectionHead
          eyebrow="Planos"
          title="Um plano para cada momento da sua revenda"
          lead="Sem contrato de fidelidade. Cancele quando quiser."
        />
      </Reveal>

      <Reveal delay={120}>
        <div className="mt-14">
          <PricingCards plans={plans.filter((p) => p.is_active)} />
        </div>
      </Reveal>
    </Section>
  )
}
