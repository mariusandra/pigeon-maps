import babel from 'rollup-plugin-babel'

const libName = process.env.BABEL_ENV

export default [
  {
    input: './src/infact.js',
    output: { file: `lib/${libName}/infact.js`, format: 'cjs' },
    plugins: [babel()]
  },
  {
    input: './src/index.js',
    output: { file: `lib/${libName}/index.js`, format: 'cjs' },
    external: ['prop-types', './infact'],
    plugins: [babel()]
  }
]
