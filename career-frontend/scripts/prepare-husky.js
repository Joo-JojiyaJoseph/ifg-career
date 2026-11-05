import { execSync } from 'node:child_process'

try {
  execSync('git rev-parse --is-inside-work-tree', { stdio: 'ignore' })
} catch {
  console.log('Skipping husky: this folder is not a git repository yet.')
  process.exit(0)
}

execSync('husky', { stdio: 'inherit' })
