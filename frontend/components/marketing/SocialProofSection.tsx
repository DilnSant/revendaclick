export default function SocialProofSection() {
  return (
    <section
      className="border-y border-gray-100 bg-white py-10"
      aria-label="Prova social e estatísticas"
    >
      <div className="mx-auto max-w-7xl px-6">
        <p className="mb-8 text-center text-xs font-semibold uppercase tracking-widest text-gray-400">
          Lojas de veículos que confiam no RevendaClick
        </p>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <p className="font-heading text-3xl font-bold text-graphite sm:text-4xl">
                {s.value}
              </p>
              <p className="mt-1 text-sm text-gray-500">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="mt-10 border-t border-gray-100 pt-8">
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-5">
            {CHANNELS.map((c) => (
              <div
                key={c.name}
                className="flex items-center gap-2 rounded-full border border-gray-100 bg-gray-50 px-4 py-2"
                aria-label={`Compatível com ${c.name}`}
              >
                <span className="text-base" aria-hidden>{c.icon}</span>
                <span className="text-xs font-semibold text-gray-500">{c.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

const STATS = [
  { value: '+500',  label: 'Revendas ativas' },
  { value: '+30k',  label: 'Leads gerados' },
  { value: '98%',   label: 'Satisfação' },
  { value: '30d',   label: 'Grátis para testar' },
]

const CHANNELS = [
  { icon: '📘', name: 'Facebook Ads' },
  { icon: '📸', name: 'Instagram Ads' },
  { icon: '🎵', name: 'TikTok Ads' },
  { icon: '🔍', name: 'Google Ads' },
  { icon: '💬', name: 'WhatsApp' },
  { icon: '🌐', name: 'Tráfego orgânico' },
]
