import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'

const root = process.cwd()
const targetPath = path.join(root, 'src/pages/DashboardStudioPageV2.tsx')
const sealPath = path.join(root, 'scripts/page-config-seal.json')

const startToken = 'data-page-config-seal="start"'
const endToken = 'data-page-config-seal="end"'

const src = fs.readFileSync(targetPath, 'utf8')
const startIdx = src.indexOf(startToken)
const endIdx = src.indexOf(endToken)
if (startIdx < 0 || endIdx < 0 || endIdx <= startIdx) {
  console.error('page-config-seal: marker not found or invalid')
  process.exit(2)
}

const segment = src.slice(startIdx, endIdx + endToken.length)
const sha256 = crypto.createHash('sha256').update(segment, 'utf8').digest('hex')

const write = process.argv.includes('--write') || process.argv.includes('-w')
if (write) {
  fs.mkdirSync(path.dirname(sealPath), { recursive: true })
  fs.writeFileSync(sealPath, JSON.stringify({ sha256 }, null, 2) + '\n', 'utf8')
  process.stdout.write(`page-config-seal: updated ${sealPath}\n`)
  process.exit(0)
}

if (!fs.existsSync(sealPath)) {
  console.error('page-config-seal: seal file missing, run npm run update:page-config-seal')
  process.exit(2)
}

let expected = ''
try {
  const obj = JSON.parse(fs.readFileSync(sealPath, 'utf8'))
  expected = String(obj?.sha256 ?? '')
} catch {
  expected = ''
}

if (!expected) {
  console.error('page-config-seal: invalid seal file, run npm run update:page-config-seal')
  process.exit(2)
}

if (expected !== sha256) {
  console.error('page-config-seal: page config changed')
  console.error(`expected: ${expected}`)
  console.error(`actual:   ${sha256}`)
  console.error('If this change is approved, run npm run update:page-config-seal')
  process.exit(1)
}

process.stdout.write('page-config-seal: ok\n')
