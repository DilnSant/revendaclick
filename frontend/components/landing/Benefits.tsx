import { Section, SectionHead, Reveal } from './ui'

const GANHOS = [
  {
    valor: 'Responda em minutos',
    titulo: 'Nunca mais perca um lead',
    texto:
      'Todo contato cai em um lugar só, com dono e prazo. O que está sem resposta aparece antes de virar prejuízo.',
  },
  {
    valor: 'Horas de volta',
    titulo: 'Menos planilha, mais pátio',
    texto:
      'O que você fazia consolidando número na mão já vem pronto. Sobra tempo para o que fecha venda.',
  },
  {
    valor: 'Nada se perde',
    titulo: 'Acompanhe toda negociação',
    texto:
      'Histórico completo por cliente. Qualquer pessoa da equipe assume a conversa sabendo exatamente onde parou.',
  },
  {
    valor: 'Você no controle',
    titulo: 'Saiba o que realmente acontece',
    texto:
      'Qual vendedor performa, qual carro empaca, de onde vem lead bom. Decisão com dado, não com achismo.',
  },
  {
    valor: 'Margem visível',
    titulo: 'Enxergue o lucro de verdade',
    texto:
      'Custo, venda e comissão amarrados ao mesmo veículo. Você para de confundir faturamento com lucro.',
  },
  {
    valor: 'Time alinhado',
    titulo: 'A loja inteira no mesmo ritmo',
    texto:
      'Todo mundo olhando a mesma informação atualizada. Acaba o retrabalho de conferir versão de planilha.',
  },
]

export default function Benefits() {
  return (
    <Section>
      <Reveal>
        <SectionHead
          eyebrow="O que muda na prática"
          title="Não é sobre ter um sistema. É sobre vender mais."
          lead="Software bonito não paga conta. O que importa é o que muda na sua operação na segunda-feira de manhã."
        />
      </Reveal>

      <div className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.06] sm:grid-cols-2 lg:grid-cols-3">
        {GANHOS.map((g, i) => (
          <Reveal key={g.titulo} delay={i * 60}>
            <div className="group h-full bg-[#07080B] p-7 transition-colors duration-300 hover:bg-white/[0.03]">
              <p className="font-heading text-sm font-semibold uppercase tracking-wider text-primary">
                {g.valor}
              </p>
              <h3 className="mt-4 font-heading text-xl font-semibold text-white">{g.titulo}</h3>
              <p className="mt-2.5 text-sm leading-relaxed text-white/55">{g.texto}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  )
}
