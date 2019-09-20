import babel from 'rollup-plugin-babel'

export default [
  {
    input: './src/index.ts',
    output: { file: `lib/index.js`, format: 'cjs' },
    external: ['prop-types', 'react'],
    plugins: [babel()]
  }
]
