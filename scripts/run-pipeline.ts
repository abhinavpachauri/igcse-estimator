/**
 * run-pipeline.ts
 *
 * Chains: scrape → parse → seed
 * Run with: pnpm pipeline:run
 */

import { execSync } from 'child_process'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

function run(script: string) {
  console.log(`\n${'─'.repeat(50)}`)
  console.log(`Running: ${script}`)
  console.log('─'.repeat(50))
  execSync(`tsx ${join(__dirname, script)}`, {
    stdio: 'inherit',
    cwd: root,
    env: process.env,
  })
}

run('scraper.ts')
run('parser.ts')
run('seeder.ts')

console.log('\nPipeline complete.')
