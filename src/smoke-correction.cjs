/**
 * 纠正识别验证：node src/smoke-correction.cjs [dir]
 *
 * 目标：只把「同一音节位置上、打完又撤销/改写」的那些点算作纠正。
 *
 * 必须避免的两类假阳性（评审指出）：
 *   1. 正常输入的前缀：打 xian 时中间会出现 x、xi、xia，它们不是错误
 *   2. 退格链的中间态：xian → xi → x 里，xi 和 x 不是新的尝试
 *
 * 真阳性：
 *   用户实测 na'x'ian → na'x → na'xie：试了 ian，改成 ie
 */
const fs = require('fs')
const path = require('path')

const dir = process.argv[2] || '.'
const source = fs.readFileSync(path.join(dir, 'client.js'), 'utf8')

let checks = 0
function ok(cond, label) {
  if (!cond) throw new Error(label)
  checks += 1
}

/** 从产物里取出真正的 samePositionCorrections，用真实依赖跑 */
function makeCorrections() {
  const SchemeLib = require(path.join(__dirname, 'schemes.cjs'))
  const start = source.indexOf('function samePositionCorrections(')
  if (start < 0) throw new Error('产物里找不到 samePositionCorrections')
  let depth = 0
  let i = source.indexOf('{', start)
  for (; i < source.length; i += 1) {
    if (source[i] === '{') depth += 1
    else if (source[i] === '}') {
      depth -= 1
      if (depth === 0) break
    }
  }
  const fnText = source.slice(start, i + 1)
  // eslint-disable-next-line no-new-func
  const fn = new Function(
    'longestSuffixPinyin', 'codeOf', 'FINAL_ORDER',
    fnText + '\nreturn samePositionCorrections;',
  )
  return fn(SchemeLib.longestSuffixPinyin, SchemeLib.codeOf, SchemeLib.FINAL_ORDER)
}

const corrections = makeCorrections()
const sch = (function () {
  const SchemeLib = require(path.join(__dirname, 'schemes.cjs'))
  return SchemeLib.SCHEMES.flypy
})()

/* ---------- 假阳性 1：正常输入的前缀 ---------- */
{
  // 正常输入 xian，中间必然经过 x、xi、xia
  const trace = ['x', 'xi', 'xia', 'xian']
  const out = corrections(trace, 'xian', sch)
  ok(out.length === 0,
    '正常输入 xian 不应产生任何纠正，实际: ' + JSON.stringify(out.map((r) => r.pressedFinal)))
  console.log('正常输入 xian（经过 x→xi→xia）→ 不误报 ✓')
}

/* ---------- 假阳性 2：退格链的中间态 ---------- */
{
  // 打了 xian，退格到 x，再打 xie
  const trace = ['x', 'xi', 'xia', 'xian', 'xi', 'x', 'xie']
  const out = corrections(trace, 'xie', sch)
  const presseds = out.map((r) => r.pressedFinal).sort()
  ok(presseds.length === 1 && presseds[0] === 'ian',
    '退格链只应记下 xian 这一次尝试，实际: ' + JSON.stringify(presseds))
  console.log('退格 xian→xi→x→xie → 只记 ian 一次，不重复计数 ✓')
}

/* ---------- 真阳性：用户实测序列 ---------- */
{
  const trace = ['n', 'na', "na'x", "na'xie", "na'x", "na'x'g", "na'x", "na'x'ian", "na'x", "na'xie"]
  const out = corrections(trace, "na'xie", sch)
  ok(out.length === 1, '应只推断出一条纠正，实际: ' + JSON.stringify(out))
  ok(out[0].pressedFinal === 'ian', '被放弃的应是 ian，实际: ' + out[0].pressedFinal)
  ok(out[0].correctFinal === 'ie', '正确韵母应是 ie，实际: ' + out[0].correctFinal)
  ok(out[0].correct === 'p', 'ie 的键应是 P，实际: ' + out[0].correct)
  ok(out[0].pressed === 'm', 'ian 的键应是 M，实际: ' + out[0].pressed)
  console.log("实测 na'x'ian → na'xie → 正确识别 ian→ie（P 对 M）✓")
}

/* ---------- 不同位置的尝试不应串到一起 ---------- */
{
  // 第一个字已经打完，第二个字一直是对的：不应产生纠正
  const trace = ["na'x", "na'xie"]
  const out = corrections(trace, "na'xie", sch)
  ok(out.length === 0, '没有改写就不该有纠正，实际: ' + JSON.stringify(out))
  console.log('同一音节一次打对 → 无纠正 ✓')
}

/* ---------- 解析不出韵母时宁可不出结论 ---------- */
{
  // x'g：g 不是已知韵母，无法判断尝试了什么
  const trace = ["na'x", "na'x'g", "na'x", "na'xie"]
  const out = corrections(trace, "na'xie", sch)
  ok(out.length === 0, '无法解析的尝试不应强行归因，实际: ' + JSON.stringify(out))
  console.log('无法解析的中间态 → 不强行归因 ✓')
}

console.log(`smoke-correction: ${checks} 项断言通过`)
