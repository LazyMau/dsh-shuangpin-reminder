/**
 * 从 rime 官方双拼 schema 的 speller/algebra 机械推导键位表，并校验 src/schemes.cjs 内置表。
 *
 * 用法：
 *   node src/derive-schemes.cjs <schema目录>          # 推导并打印对照表
 *   node src/derive-schemes.cjs <schema目录> --check  # 与内置表比对，不一致则非零退出
 *
 * schema 目录需含 double_pinyin{,_flypy,_mspy,_abc,_pyjj}.yaml，
 * 可从 rime/rime-double-pinyin 仓库取得。
 */
const fs = require('fs')
const path = require('path')
const lib = require('./schemes.cjs')

const FINAL_ORDER = lib.FINAL_ORDER
const FINAL_SET = {}
FINAL_ORDER.forEach(function (f) { FINAL_SET[f] = true })

/** 展开 `x?` 可选字符：`i?ong` → ['ong', 'iong'] */
function expandOptionals(text) {
  const at = text.indexOf('?')
  if (at <= 0) return [text]
  const keep = text.slice(0, at) + text.slice(at + 1)
  const drop = text.slice(0, at - 1) + text.slice(at + 1)
  return expandOptionals(keep).concat(expandOptionals(drop))
}

/** 把形如 `[iu]a` 的字符类片段展开成具体韵母 */
function expandAlt(alt) {
  const a = alt.replace(/\$$/, '').replace(/\?$/, '')
  const m = a.match(/^\[([a-z]+)\](.*)$/)
  const bases = m ? m[1].split('').map(function (c) { return c + m[2] }) : [a]
  const out = []
  bases.forEach(function (base) {
    expandOptionals(base).forEach(function (x) { out.push(x) })
  })
  return out
}

/** 展开一条规则的模式串（去锚点、去捕获前缀、拆 `|`） */
function expandPattern(pattern) {
  const p = pattern.replace(/^\^/, '').replace(/^\(\.\)/, '')
  const out = []
  p.split('|').forEach(function (piece) {
    expandAlt(piece).forEach(function (x) { out.push(x) })
  })
  return out
}

function deriveFromLines(lines) {
  const finals = {}
  const initials = {}
  let inAlgebra = false
  for (const raw of lines) {
    const line = raw.replace(/#.*$/, '').trim()
    if (/^algebra:/.test(line)) { inAlgebra = true; continue }
    if (!inAlgebra) continue
    if (!line.length) continue
    if (!line.startsWith('-')) { inAlgebra = false; continue }
    const m = line.match(/^-\s*(?:xform|derive)\/(.+?)\/([^/]*)\//)
    if (!m) continue
    const pattern = m[1]
    const repl = m[2]
    if (/aoe/.test(pattern)) continue // 零声母规则，单独处理
    const initRule = pattern.match(/^\^([a-z]{2})$/)
    if (initRule && /^[A-Z]$/.test(repl)) {
      initials[initRule[1]] = repl.toLowerCase()
      continue
    }
    // 替换串末尾字母才是键位（`$1F` 这种带捕获引用的取末字母）
    const letterMatch = repl.match(/([A-Z;])$/)
    if (!letterMatch) continue
    const letter = letterMatch[1].toLowerCase()
    expandPattern(pattern).forEach(function (alt) {
      if (FINAL_SET[alt] && !finals[alt]) finals[alt] = letter
    })
  }
  // 单字母韵母固定自身键位
  ;['a', 'o', 'e', 'i', 'u', 'v'].forEach(function (single) {
    if (!finals[single]) finals[single] = single
  })
  // ve 跟随 ue
  if (finals.ue && !finals.ve) finals.ve = finals.ue
  return { finals: finals, initials: initials }
}

/** 解析 algebra 块里所有 xform/derive 规则，返回 [{ pattern, repl }] */
function parseRules(lines) {
  const rules = []
  let inAlgebra = false
  for (const raw of lines) {
    const line = raw.replace(/#.*$/, '').trim()
    if (/^algebra:/.test(line)) { inAlgebra = true; continue }
    if (!inAlgebra) continue
    if (!line.length) continue
    if (!line.startsWith('-')) { inAlgebra = false; continue }
    const m = line.match(/^-\s*(?:xform|derive)\/(.+?)\/([^/]*)\//)
    if (!m) continue
    rules.push({ pattern: m[1], repl: m[2] })
  }
  return rules
}

/** 零声母规则：找 pattern 以 ^([aoe] 开头的那条规则，看替换串怎么处理 */
function deriveZero(lines) {
  for (const rule of parseRules(lines)) {
    if (!/^\^\(\[aoe\]/.test(rule.pattern)) continue
    // derive/^([aoe].*)$/o$1/ ：前缀固定 o
    if (/^o/i.test(rule.repl)) return 'o'
    // derive/^([aoe])([ioun])$/$1$1$2/ ：原样拼（首字母双写）
    if (/^\$1\$1/.test(rule.repl)) return 'natural'
  }
  return 'natural'
}

const dir = process.argv[2]
const check = process.argv.includes('--check')
if (!dir) {
  console.error('usage: node src/derive-schemes.cjs <schema-dir> [--check]')
  process.exit(2)
}

const FILES = {
  flypy: 'double_pinyin_flypy.yaml',
  zrm: 'double_pinyin.yaml',
  mspy: 'double_pinyin_mspy.yaml',
  abc: 'double_pinyin_abc.yaml',
  pyjj: 'double_pinyin_pyjj.yaml',
}

let mismatches = 0
for (const id of Object.keys(FILES)) {
  const file = path.join(dir, FILES[id])
  if (!fs.existsSync(file)) {
    console.log(`[skip] ${id}: ${FILES[id]} 不存在`)
    continue
  }
  const lines = fs.readFileSync(file, 'utf8').split('\n')
  const derived = deriveFromLines(lines)
  const zero = deriveZero(lines)
  const builtin = lib.SCHEMES[id]
  const problems = []
  FINAL_ORDER.forEach(function (final) {
    const want = builtin.finals[final] || ''
    const got = derived.finals[final] || ''
    // natural 零声母方案里，er 由零声母规则直接照全拼，不占韵母键位
    if (final === 'er' && zero === 'natural' && !got) return
    if (want !== got) problems.push(`${final}: 内置=${want || '-'} 推导=${got || '-'}`)
  })
  Object.keys(derived.initials).forEach(function (initial) {
    if (builtin.initials[initial] !== derived.initials[initial]) {
      problems.push(`${initial}: 内置=${builtin.initials[initial]} 推导=${derived.initials[initial]}`)
    }
  })
  if (builtin.zero !== zero) problems.push(`zero: 内置=${builtin.zero} 推导=${zero}`)

  console.log(`=== ${id} (${builtin.name}) ===`)
  console.log('  ' + FINAL_ORDER.map(function (f) {
    return f + '=' + (derived.finals[f] || '-')
  }).join(' '))
  if (problems.length) {
    mismatches += problems.length
    console.log('  x 不一致:')
    problems.forEach(function (p) { console.log('    - ' + p) })
  } else {
    console.log('  ok 与内置表一致')
  }
}

if (check && mismatches) {
  console.error(`\n校验失败：${mismatches} 处不一致`)
  process.exit(1)
}
console.log('\n完成' + (check ? '' : '（仅推导，未校验）'))
