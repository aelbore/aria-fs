import { bundle, clean } from 'aria-build'

(async function() {
  const external = [
    'minimatch'
  ]
  
  const options = [
    {
      input: './src/file.ts',
      external,
      output: {
        format: 'es',
        file: './dist/aria-fs.es.js'
      },
      tsconfig: {
        compilerOptions: {
          declaration: true
        }
      }
    },
    {
      input: './src/file.ts',
      external,
      output: {
        format: 'cjs',
        file: './dist/aria-fs.js'
      }
    }
  ]

  await clean('dist')
  await bundle(options)
})()