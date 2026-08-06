import { Section, SectionHead, Card, Reveal, Glow, IconAlert } from './ui'

const PERDAS = [
  {
    titulo: 'Leads esquecidos',
    texto:
      'A mensagem chega, alguém vê, ninguém responde. Três dias depois o cliente já comprou em outro lugar.',
  },
  {
    titulo: 'Clientes sem retorno',
    texto:
      'A negociação estava quente, mas ninguém lembrou de dar o retorno prometido. O interesse esfria sozinho.',
  },
  {
    titulo: 'Veículos parados',
    texto:
      'Carro ocupando pátio há 90 dias sem ninguém perceber. Capital travado que poderia estar girando.',
  },
  {
    titulo: 'Negociações perdidas',
    texto:
      'Ninguém sabe em que pé estava a conversa. Sem histórico, cada atendimento recomeça do zero.',
  },
  {
    titulo: 'Tempo desperdiçado',
    texto:
      'Horas por semana consolidando planilha, conferindo número e procurando informação que deveria estar à mão.',
  },
  {
    titulo: 'Financeiro desorganizado',
    texto:
      'Você sabe quanto entrou. Não sabe quanto sobrou, de qual carro veio, nem quanto foi de comissão.',
  },
]

export default function LossSection() {
  return (
    <Section id="perdas" className="overflow-hidden">
      <Glow className="-left-40 top-20 h-[400px] w-[400px] bg-primary/10" />

      <Reveal>
        <SectionHead
          eyebrow="O custo invisível"
          title={
            <>
              Quanto sua loja perde{' '}
              <span className="text-primary">todos os meses</span> sem você ver?
            </>
          }
          lead="Não é falta de cliente. É cliente que chegou, foi mal atendido e você nunca soube que existiu."
        />
      </Reveal>

      <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PERDAS.map((p, i) => (
          <Reveal key={p.titulo} delay={i * 70}>
            <Card className="group h-full">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
                <IconAlert className="h-5 w-5" />
              </div>
              <h3 className="mt-5 font-heading text-lg font-semibold text-white">{p.titulo}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/55">{p.texto}</p>
            </Card>
          </Reveal>
        ))}
      </div>
    </Section>
  )
}
