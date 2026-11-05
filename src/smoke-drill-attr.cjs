/**
 * 练习答错归因验证：node src/smoke-drill-attr.cjs [dir]
 *
 * 评审指出的缺陷：答错时旧实现给目标的两个键都 +bad，
 * 打错一个韵母也会把声母键一起算成不会，弱键率被拉偏。
 *
 * 两段验证：
 *   1. 从构建产物里**跑真正的 finish()**，确认只有错的那一位被记 bad
 *   2. 守住旧写法不被改回来（源码里不应再出现「两位都 +bad」）
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

/**
 * 用 vm 执行产物里 finish() 的**实际代码**。
 * 把函数体里的 item/store/normalizeKeyEntry 用桩替换，只验证归因规则。
 */
function runFinish(code, typed) {
  const start = source.indexOf('function finish(typed)')
  if (start < 0) throw new Error('产物里找不到 finish()')
  // 截到函数结束：从 start 起做括号配平
  let depth = 0
  let i = source.indexOf('{', start)
  const bodyStart = i
  for (; i < source.length; i += 1) {
    if (source[i] === '{') depth += 1
    else if (source[i] === '}') {
      depth -= 1
      if (depth === 0) break
    }
  }
  const fnText = source.slice(start, i + 1)
  const st = { keys: {}, rev: 0 }
  const item = { code: code, h: '字', p: 'zi' }
  const normalizeKeyEntry = () => ({ n: 0, bad: 0, slow: 0, fix: 0, hint: 0 })
  const store = { state: { stats: st }, touch: () => {} }
  const setMark = () => {}
  const setTally = () => {}
  const timerRef = { current: null }
  const advance = () => {}
  const window = { setTimeout: () => 0 }
  // 注意：fnText 是「函数声明」，new Function 里光声明不会执行，
  // 必须拼上调用语句，否则测的是一次都没跑的空壳。
  // eslint-disable-next-line no-new-func
  const fn = new Function(
    'item', 'store', 'normalizeKeyEntry', 'setMark', 'setTally', 'timerRef', 'advance', 'window', 'typed',
    fnText + '\nfinish(typed);\nreturn store.state.stats;',
  )
  return fn(item, store, normalizeKeyEntry, setMark, setTally, timerRef, advance, window, typed)
}

/* 1. 完全正确：不记任何 bad */
{
  const st = runFinish('xt', 'xt')
  const bad = Object.keys(st.keys).reduce((a, k) => a + st.keys[k].bad, 0)
  ok(bad === 0, '答对不应记 bad，实际: ' + JSON.stringify(st.keys))
  ok(st.keys.x.n === 1 && st.keys.t.n === 1, '答对也应计入出现次数')
  console.log('答对：无 bad ✓')
}

/* 2. 只错第二位（韵母）：只记第二位，声母键不受影响 */
{
  const st = runFinish('xt', 'xb')
  ok(st.keys.x.bad === 0, '声母键 x 不应被记 bad（这正是旧实现的缺陷），实际: ' + st.keys.x.bad)
  ok(st.keys.t.bad === 1, '韵母键 t 应记 1 次 bad，实际: ' + st.keys.t.bad)
  console.log('只错韵母：只记韵母键，不再波及声母键 ✓')
}

/* 3. 只错第一位（声母）：只记第一位 */
{
  const st = runFinish('xt', 'yt')
  ok(st.keys.x.bad === 1, '声母键 x 应记 1 次 bad')
  ok(st.keys.t.bad === 0, '韵母键 t 不应被记 bad，实际: ' + st.keys.t.bad)
  console.log('只错声母：只记声母键 ✓')
}

/* 4. 两位都错：两个都记 */
{
  const st = runFinish('xt', 'yz')
  ok(st.keys.x.bad === 1 && st.keys.t.bad === 1, '两位都错应各记一次，实际: ' + JSON.stringify(st.keys))
  console.log('两位都错：两个都记 ✓')
}

/* 5. 长度对不上：无法归因，不平摊到任何键 */
{
  const st = runFinish('xt', 'x')
  const bad = Object.keys(st.keys).reduce((a, k) => a + st.keys[k].bad, 0)
  ok(bad === 0, '长度不符时不应把错平摊到键上，实际: ' + JSON.stringify(st.keys))
  ok(st.unattributed === 1, '长度不符应计入「本题有误」，实际: ' + st.unattributed)
  console.log('无法归因：不平摊，记为本题有误 ✓')
}

/* 6. 守住旧写法不被改回来 */
{
  const finishStart = source.indexOf('function finish(typed)')
  const finishText = source.slice(finishStart, finishStart + 1600)
  ok(!/if \(!good\) entry\.bad \+= 1/.test(finishText),
    '源码里又出现了「两位都 +bad」的旧写法')
  ok(/wrongAt/.test(finishText), '源码里应保留按位归因的 wrongAt 逻辑')
  console.log('旧写法未被改回 ✓')
}

console.log(`smoke-drill-attr: ${checks} 项断言通过`)
