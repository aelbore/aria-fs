import { run } from 'aria-mocha'

const dir = 'src'

run(dir, {
  coverageOptions: {
    checkCoverage: true,
    thresholds: {
      statements: 90,
      branches: 90,
      functions: 90
    }
  }
})