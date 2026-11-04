/**
 * 方案数据层自测：node src/schemes.test.cjs
 *
 * 覆盖：
 *  1. 五个内置方案的键位表完整（FINAL_ORDER 全部有键）
 *  2. 零声母规则（natural 照全拼 / o 打头）
 *  3. 声母键（zh/ch/sh 各方案不同）
 *  4. ü 系列（女 nv、略 lve、去 qu）
 *  5. 同键多韵母不丢（ong/iong 等）
 *  6. 自定义键位：规范化、缺项检测、模板生成、生效与回退
 */
const assert = require('assert')
const lib = require('./schemes.cjs')

let checks = 0
function eq(actual, expect, label) {
  checks += 1
  assert.strictEqual(actual, expect, `${label}: 期望 ${expect}，实际 ${actual}`)
}

function code(pinyin, id) {
  return lib.codeOfPinyin(pinyin, lib.schemeOf({ scheme: id }))
}

/* ---------- 1. 键位表完整性 ---------- */
for (const id of Object.keys(lib.SCHEMES)) {
  const sch = lib.schemeOf({ scheme: id })
  for (const final of lib.FINAL_ORDER) {
    // natural 零声母方案里 er 由零声母规则处理，不占韵母键位
    if (final === 'er' && sch.zero === 'natural') continue
    assert.ok(lib.finalKey(final, sch), `${id} 缺少韵母 ${final} 的键位`)
    checks += 1
  }
  for (const initial of ['zh', 'ch', 'sh']) {
    assert.ok(lib.initialKey(initial, sch), `${id} 缺少声母 ${initial} 的键位`)
    checks += 1
  }
}

/* ---------- 2. 小鹤（natural 零声母）---------- */
eq(code('xué', 'flypy'), 'xt', '小鹤 学')
eq(code('shì', 'flypy'), 'ui', '小鹤 是')
eq(code('nǚ', 'flypy'), 'nv', '小鹤 女')
eq(code('qù', 'flypy'), 'qv', '小鹤 去')
eq(code('ài', 'flypy'), 'ai', '小鹤 零声母 爱')
eq(code('ér', 'flypy'), 'er', '小鹤 零声母 而')
eq(code('ā', 'flypy'), 'aa', '小鹤 零声母 啊')
eq(code('áng', 'flypy'), 'ah', '小鹤 零声母 昂')

/* ---------- 3. 自然码 ---------- */
eq(code('xué', 'zrm'), 'xt', '自然码 学')
eq(code('shì', 'zrm'), 'ui', '自然码 是')
eq(code('ér', 'zrm'), 'er', '自然码 零声母 而')

/* ---------- 4. 微软双拼（o 打头，ing=;）---------- */
eq(code('qíng', 'mspy'), 'q;', '微软 情')
eq(code('xuǎn', 'mspy'), 'xr', '微软 选')
eq(code('ài', 'mspy'), 'ol', '微软 零声母 爱')
eq(code('ér', 'mspy'), 'or', '微软 零声母 而')
eq(code('nǚ', 'mspy'), 'ny', '微软 女')

/* ---------- 5. 智能ABC（zh/ch/sh = a/e/v）---------- */
eq(code('zhōng', 'abc'), 'as', 'ABC 中')
eq(code('chī', 'abc'), 'ei', 'ABC 吃')
eq(code('shì', 'abc'), 'vi', 'ABC 是')
eq(code('ài', 'abc'), 'ol', 'ABC 零声母 爱')

/* ---------- 6. 拼音加加（zh/ch/sh = v/u/i）---------- */
eq(code('zhōng', 'pyjj'), 'vy', '加加 中')
eq(code('chī', 'pyjj'), 'ui', '加加 吃')
eq(code('shì', 'pyjj'), 'ii', '加加 是')

/* ---------- 7. 同一韵母在不同方案下键位不同 ---------- */
const finalsToCheck = ['ai', 'ei', 'ao', 'ou', 'an', 'en', 'ang', 'eng', 'ing', 'iang']
for (const final of finalsToCheck) {
  const seen = new Set()
  for (const id of Object.keys(lib.SCHEMES)) {
    seen.add(lib.finalKey(final, lib.schemeOf({ scheme: id })))
  }
  assert.ok(seen.size > 1, `韵母 ${final} 在所有方案里键位相同，疑似没真正区分方案`)
  checks += 1
}

/* ---------- 8. 同键多韵母（reverseFinals）---------- */
const flypy = lib.schemeOf({ scheme: 'flypy' })
const rev = lib.reverseFinals(flypy)
eq(rev.s.join(','), 'iong,ong', '小鹤 S 键应为 iong/ong')
eq(rev.x.join(','), 'ia,ua', '小鹤 X 键应为 ia/ua')
eq(rev.k.join(','), 'ing,uai', '小鹤 K 键应为 ing/uai')
// ve 与 ue 同键，reverseFinals 不重复列出
eq(rev.t.join(','), 'ue', '小鹤 T 键只列 ue')

/* ---------- 9. 自定义键位 ---------- */
const custom = lib.customFrom('flypy')
assert.ok(lib.isCustomComplete(custom), '以模板生成的自定义键位应当完整')
checks += 1

// 改一个韵母后编码跟着变
custom.finals.ai = 'b'
const customScheme = lib.schemeOf({ scheme: 'custom', custom: custom })
eq(customScheme.name, '自定义', '自定义方案名称')
eq(lib.codeOf('m', 'ai', customScheme), 'mb', '自定义 买 = mb')

// 缺韵母 → 不可用，并回退到小鹤
const broken = { finals: { a: 'a' }, initials: {}, zero: 'natural' }
assert.ok(!lib.isCustomComplete(broken), '缺项的自定义键位应判为不完整')
checks += 1
const fallback = lib.schemeOf({ scheme: 'custom', custom: broken })
eq(fallback.id, 'flypy', '自定义不完整时回退到小鹤')

// 非法值被过滤
const dirty = lib.normalizeCustom({ finals: { ai: 'AB', ei: 'q', zz: 'z' }, initials: { zh: 'v' }, zero: 'nope' })
eq(dirty.finals.ai, undefined, '多位字符键位应被丢弃')
eq(dirty.finals.ei, 'q', '合法键位保留')
eq(dirty.finals.zz, undefined, '非法韵母应被丢弃')
eq(dirty.zero, 'natural', '非法 zero 回退为 natural')

// ';' 这类非字母键允许（微软方案的 ing 用到）
const semi = lib.normalizeCustom({ finals: { ing: ';' }, initials: {}, zero: 'o' })
eq(semi.finals.ing, ';', '分号键位应允许')

/* ---------- 10. 零声母 o 方案与 natural 方案的 o 键语义 ---------- */
const mspy = lib.schemeOf({ scheme: 'mspy' })
eq(lib.codeOf('', 'ai', mspy), 'ol', '微软零声母固定 o 打头')
eq(lib.codeOf('', 'an', mspy), 'oj', '微软零声母 安 = oj')

console.log(`schemes.test: ${checks} 项断言全部通过`)
