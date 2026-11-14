// يفشل إذا كانت ترجمة ناقصة أو منسوخة من الإنجليزية، ويحذّر من نصوص مكتوبة مباشرة في الكود
import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'

const flat = (d, p = '', out = {}) => {
  for (const k of Object.keys(d)) {
    if (d[k] && typeof d[k] === 'object' && !Array.isArray(d[k])) flat(d[k], p + k + '.', out)
    else out[p + k] = d[k]
  }
  return out
}

// قيم قصيرة أو أسماء علامات تجارية تبقى كما هي ولا تُعدّ خطأ
const ALLOW = new Set(['WhatsApp', 'PayPal', 'Solana', 'USDC', 'X (Twitter)', 'Stripe', 'Google', 'Quiz', 'Email', 'Date', 'Admin'])
const en = flat(JSON.parse(fs.readFileSync('messages/en.json', 'utf8')))
let errors = 0

for (const loc of ['ar', 'fr', 'es']) {
  const d = flat(JSON.parse(fs.readFileSync(`messages/${loc}.json`, 'utf8')))
  const missing = Object.keys(en).filter((k) => !(k in d))
  const copied = Object.keys(en).filter(
    (k) => k in d && d[k] === en[k] && en[k].length > 3 && !ALLOW.has(en[k]) && !/^[\W\d{}<>\/]*$/.test(en[k])
  )
  if (missing.length) { errors++; console.log(`ERROR ${loc}: ${missing.length} missing keys, e.g. ${missing[0]}`) }
  if (copied.length) { errors++; console.log(`ERROR ${loc}: ${copied.length} values still English, e.g. ${copied[0]}`) }
  if (!missing.length && !copied.length) console.log(`OK ${loc}`)
}

// تحذير فقط: نصوص إنجليزية مكتوبة مباشرة في الواجهة
let literal = 0
const files = execSync('find app components -name "*.tsx"', { encoding: 'utf8' }).trim().split('\n')
for (const f of files) {
  const src = fs.readFileSync(f, 'utf8')
  if (/(title|placeholder|aria-label|alt)="[A-Z][a-z]/.test(src) || /toast\.\w+\(['"`][A-Z][a-z]/.test(src)) literal++
}
console.log(`WARN: ${literal} UI files still contain English literals (see the migration list)`)

process.exit(errors ? 1 : 0)
