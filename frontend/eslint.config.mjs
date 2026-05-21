import coreWebVitals from 'eslint-config-next/core-web-vitals'

const config = [
  ...coreWebVitals,
  {
    rules: {
      // Downgrade: common patterns (async callbacks in effects, conditional setState)
      // are legitimate in this codebase and not a real risk
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
]

export default config
