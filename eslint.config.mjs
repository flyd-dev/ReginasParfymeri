import nextCoreWebVitals from 'eslint-config-next/core-web-vitals'
import nextTypescript from 'eslint-config-next/typescript'

const config = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
    },
  },
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'data/**',
      'test-results/**',
      'playwright-report/**',
      'next-env.d.ts',
    ],
  },
]

export default config
