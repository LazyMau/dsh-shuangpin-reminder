/**
 * 文案体检：node src/lint-locale.cjs
 *
 * 找出 ZH/EN 里定义但没有任何 t('key') 引用的文案（改版后残留的死字符串）。
 */
const fs = require('fs')
const path = require('path')

const file = path.join(__dirname, 'client.template.js')
const src = fs.readFileSync(file, 'utf8')

function keysIn(block) {
  return [...block.matchAll(/^ {6}(\w+):/gm)].map((m) => m[1])
}

/** 同一文案块里重复定义的 key（后者静默覆盖前者，是很难查的 bug） */
function duplicates(keys) {
  const seen = new Set()
  const dup = new Set()
  for (const key of keys) {
    if (seen.has(key)) dup.add(key)
    seen.add(key)
  }
  return [...dup]
}

const zhStart = src.indexOf('const ZH = {')
const enStart = src.indexOf('const EN = {')
if (zhStart < 0 || enStart < 0) throw new Error('找不到 ZH / EN 文案块')

const zh = src.slice(zhStart, enStart)
const enEnd = src.indexOf('\n    }', enStart)
const en = src.slice(enStart, enEnd < 0 ? undefined : enEnd)

const zhKeys = keysIn(zh)
const enKeys = keysIn(en)

function unused(keys) {
  return keys.filter((key) => !src.includes(`t('${key}')`))
}

const zhUnused = unused(zhKeys)
const enUnused = unused(enKeys)

const onlyZh = zhKeys.filter((k) => !enKeys.includes(k))
const onlyEn = enKeys.filter((k) => !zhKeys.includes(k))
const dupZh = duplicates(zhKeys)
const dupEn = duplicates(enKeys)

console.log(`中文文案 ${zhKeys.length} 条，英文 ${enKeys.length} 条`)
console.log('中文未引用:', zhUnused.length ? zhUnused.join(', ') : '无')
console.log('英文未引用:', enUnused.length ? enUnused.join(', ') : '无')
if (dupZh.length) console.log('中文重复定义:', dupZh.join(', '))
if (dupEn.length) console.log('英文重复定义:', dupEn.join(', '))
if (onlyZh.length) console.log('仅中文有:', onlyZh.join(', '))
if (onlyEn.length) console.log('仅英文有:', onlyEn.join(', '))

const bad = zhUnused.length || enUnused.length || dupZh.length || dupEn.length || onlyZh.length || onlyEn.length
console.log(bad ? 'LINT FAIL' : 'LINT OK')
process.exitCode = bad ? 1 : 0
