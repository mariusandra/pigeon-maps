import babel from 'rollup-plugin-babel'
import typescript from 'rollup-plugin-typescript2'
import pkg from './package.json'
const extensions = ['.js', '.jsx', '.ts', '.tsx']

export default [
  {
    input: './src/index.tsx',
    output: [
      {
        file: pkg.main,
        format: 'cjs',
      },
      {
        file: pkg.module,
        format: 'es',
      },
    ],
    external: ['react'],
    plugins: [
      typescript({
        include: ['*.(t|j)s+(|x)', '**/*.(t|j)s+(|x)'],
      }),
      babel({
        extensions,
        include: ['src/**/*'],
      }),
    ],
  },
]
