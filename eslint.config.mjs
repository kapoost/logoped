// eslint.config.mjs
// Next 16 usunął komendę `next lint`, a @next/eslint-plugin-next przeszedł
// na format flat. Projekt nie miał dotąd żadnej konfiguracji — jechał na
// domyślnych wbudowanych w `next lint`. Ten plik odtwarza ten sam zestaw
// reguł, tyle że wywoływany bezpośrednio przez ESLint CLI (`npm run lint`).
import { FlatCompat } from '@eslint/eslintrc'

const compat = new FlatCompat({ baseDirectory: import.meta.dirname })

export default [
  { ignores: ['.next/**', 'node_modules/**', 'public/sw.js', 'playwright-report/**', 'test-results/**'] },
  ...compat.extends('next/core-web-vitals'),
]
