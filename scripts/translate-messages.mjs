// يترجم المفاتيح الناقصة من messages/en.json إلى ar.json و fr.json و es.json
// المحرك: LibreTranslate يعمل داخل GitHub Actions (مجاني، بلا مفتاح وبلا بطاقة)
import fs from 'node:fs/promises'

const SRC = 'messages/en.json'
const TARGETS = { ar: 'ar', fr: 'fr', es: 'es' }
const LT_URL = process.env.LT_URL || 'http://localhost:5000'
const MOCK = process.env.MOCK === '1'

// ---------- تحليل ICU ----------
function matchClose(s, start) {
  let depth = 0
  for (let i = start; i < s.length; i++) {
    if (s[i] === '{') depth++
    else if (s[i] === '}') { depth--; if (depth === 0) return i }
  }
  throw new Error('Unbalanced braces: ' + s)
}

function parseTop(s) {
  const parts = []
  let buf = ''
  let i = 0
  while (i < s.length) {
    if (s[i] === '{') {
      const close = matchClose(s, i)
      const inner = s.slice(i + 1, close)
      const head = inner.match(/^\s*\w+\s*,\s*(plural|select)\s*,/)
      if (head) {
        if (buf) { parts.push({ kind: 'text', s: buf }); buf = '' }
        const branches = []
        const rest = inner.slice(head[0].length)
        let j = 0
        while (j < rest.length) {
          const m = rest.slice(j).match(/^\s*(=?\w+)\s*\{/)
          if (!m) { j++; continue }
          const open = j + m[0].length - 1
          const end = matchClose(rest, open)
          branches.push({ key: m[1], s: rest.slice(open + 1, end) })
          j = end + 1
        }
        parts.push({ kind: 'plural', head: head[0].trim(), branches })
      } else {
        buf += s.slice(i, close + 1)
      }
      i = close + 1
    } else {
      buf += s[i]
      i++
    }
  }
  if (buf) parts.push({ kind: 'text', s: buf })
  return parts
}

// يحمي المتغيرات {name} بوسوم <x id="n"/>
function protect(s) {
  const vars = []
  const tpl = s.replace(/\{[^{}]*\}/g, (m) => {
    vars.push(m)
    return `<x id="${vars.length - 1}"/>`
  })
  return { tpl, vars }
}

function restore(tpl, vars) {
  return tpl.replace(/<x id="(\d+)"\/>/g, (_, n) => vars[Number(n)])
}

// الترجمة سليمة فقط إذا بقيت كل الوسوم كما هي، وإلا نعود للإنجليزية لهذه القطعة
function isSafe(translated, count) {
  for (let n = 0; n < count; n++) {
    if (!translated.includes(`<x id="${n}"/>`)) return false
  }
  return true
}

// ---------- الترجمة عبر LibreTranslate ----------
async function translateBatch(texts, target) {
  if (MOCK) return texts
  const out = []
  let unchanged = 0
  let sample = null
  for (let i = 0; i < texts.length; i += 40) {
    const chunk = texts.slice(i, i + 40)
    const res = await fetch(`${LT_URL}/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: chunk, source: 'en', target, format: 'html' }),
    })
    if (!res.ok) throw new Error(`LibreTranslate ${res.status}: ${await res.text()}`)
    const data = await res.json()
    const translated = Array.isArray(data.translatedText) ? data.translatedText : [data.translatedText]
    if (translated.length !== chunk.length) throw new Error('LibreTranslate returned a different count')
    chunk.forEach((src, j) => {
      if (translated[j] === src) { unchanged++; sample ??= src }
    })
    out.push(...translated)
  }
  console.log(`${target}: ${unchanged} of ${texts.length} strings came back unchanged`)
  if (texts.length >= 20 && unchanged / texts.length > 0.8) {
    throw new Error(
      `The engine returned English unchanged for ${target} (example: "${sample}"). ` +
      `The language model is not loaded. Read the "Start LibreTranslate" logs.`
    )
  }
  return out
}

// ---------- بناء الشجرة وترجمتها ----------
async function translateTree(obj, target) {
  const build = (value) => {
    if (typeof value !== 'string' || value.trim() === '') return value
    const parts = parseTop(value)
    const slots = []
    const pieces = parts.map((p) => {
      if (p.kind === 'text') {
        if (!p.s.trim()) return { kind: 'text', raw: p.s }
        const lead = p.s.match(/^\s*/)[0]
        const trail = p.s.match(/\s*$/)[0]
        const { tpl, vars } = protect(p.s.trim())
        slots.push({ tpl, vars })
        return { kind: 'text', lead, trail, slot: slots.length - 1 }
      }
      return {
        kind: 'plural',
        head: p.head,
        branches: p.branches.map((b) => {
          const { tpl, vars } = protect(b.s)
          slots.push({ tpl, vars })
          return { key: b.key, slot: slots.length - 1 }
        }),
      }
    })
    return { __slots: slots, __pieces: pieces }
  }

  const walk = (node) => {
    if (typeof node === 'string') return build(node)
    if (Array.isArray(node)) return node.map(walk)
    if (node && typeof node === 'object') {
      const o = {}
      for (const k of Object.keys(node)) o[k] = walk(node[k])
      return o
    }
    return node
  }

  const tree = walk(obj)
  const allSlots = []
  const collect = (node) => {
    if (Array.isArray(node)) return node.forEach(collect)
    if (node && typeof node === 'object') {
      if (node.__slots) { allSlots.push(...node.__slots); return }
      Object.values(node).forEach(collect)
    }
  }
  collect(tree)

  const translated = await translateBatch(allSlots.map((s) => s.tpl), target)
  allSlots.forEach((s, idx) => {
    const t = translated[idx]
    s.translated = t && isSafe(t, s.vars.length) ? t : s.tpl
  })

  const render = (node) => {
    if (Array.isArray(node)) return node.map(render)
    if (node && typeof node === 'object') {
      if (node.__slots) {
        const { __slots: slots, __pieces: pieces } = node
        return pieces.map((p) => {
          if (p.kind === 'text') {
            if (p.raw !== undefined) return p.raw
            const slot = slots[p.slot]
            return p.lead + restore(slot.translated, slot.vars).trim() + p.trail
          }
          const br = p.branches
            .map((b) => {
              const slot = slots[b.slot]
              return `${b.key} {${restore(slot.translated, slot.vars)}}`
            })
            .join(' ')
          return `{${p.head} ${br}}`
        }).join('')
      }
      const o = {}
      for (const k of Object.keys(node)) o[k] = render(node[k])
      return o
    }
    return node
  }
  return render(tree)
}

// ---------- الدمج: نترجم فقط ما هو ناقص ----------
function isObj(v) { return typeof v === 'object' && v !== null && !Array.isArray(v) }

// يختار المفاتيح الناقصة + المفاتيح التي بقيت كما هي بالإنجليزية (نسخ غير مترجمة)
function pickMissing(src, dst) {
  const out = {}
  for (const k of Object.keys(src)) {
    if (isObj(src[k])) {
      const sub = pickMissing(src[k], isObj(dst?.[k]) ? dst[k] : {})
      if (Object.keys(sub).length) out[k] = sub
    } else if (typeof src[k] === 'string' && (typeof dst?.[k] !== 'string' || dst[k] === src[k])) {
      out[k] = src[k]
    } else if (Array.isArray(src[k]) && dst?.[k] === undefined) {
      out[k] = src[k]
    }
  }
  return out
}

function deepMerge(base, over) {
  const out = { ...base }
  for (const k of Object.keys(over)) {
    out[k] = isObj(base[k]) && isObj(over[k]) ? deepMerge(base[k], over[k]) : over[k]
  }
  return out
}

// ---------- التشغيل ----------
const en = JSON.parse(await fs.readFile(SRC, 'utf8'))
for (const [locale, target] of Object.entries(TARGETS)) {
  let existing = {}
  try { existing = JSON.parse(await fs.readFile(`messages/${locale}.json`, 'utf8')) } catch {}
  const missing = pickMissing(en, existing)
  if (Object.keys(missing).length === 0) { console.log(`messages/${locale}.json: nothing missing`); continue }
  const translated = await translateTree(missing, target)
  const merged = deepMerge(existing, translated)
  await fs.writeFile(`messages/${locale}.json`, JSON.stringify(merged, null, 2) + '\n', 'utf8')
  console.log(`messages/${locale}.json: translated missing keys`)
}
