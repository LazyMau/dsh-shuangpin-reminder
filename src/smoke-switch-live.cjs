/**
 * 同一个 store 上切换方案的验证：node src/smoke-switch-live.cjs .
 *
 * 与 smoke-records-switch 的区别：那个是「用不同 prefs 分别渲染」，
 * 相当于全新启动；这里模拟真实操作——在同一份 store 上改 prefs.scheme，
 * 触发 touch/notify 后重新渲染，看记录页是否跟着变。
 *
 * 这条路径依赖：切换后 getter 返回新桶 + 组件缓存（useMemo）正确失效。
 */
const fs = require('fs')
const path = require('path')
const vm = require('vm')

const dir = process.argv[2] || '.'
const source = fs.readFileSync(path.join(dir, 'client.js'), 'utf8')

let checks = 0
function ok(cond, label) {
  if (!cond) throw new Error(label)
  checks += 1
}

const noop = () => {}
const STAT_KEY = 'dsh.shuangpin-reminder.stats.v2'
const PREF_KEY = 'dsh.shuangpin-reminder.prefs.v4'

const flypyStats = {
  v: 2, rev: 12, base: 420,
  chars: { 学: { n: 9, bad: 4, at: 5 }, 情: { n: 7, bad: 3, at: 6 } },
  keys: {}, events: [{ t: 9, word: '学', codes: ['xt'], ms: 900, slow: true, backs: 2 }],
  echo: [], stalls: [{ t: 9, word: '学', seq: ['x', 'xt'], backs: 2, shrinks: 1, ms: 900 }],
  wrong: { 'k|b': 3 }, bigram: {}, lastChar: '学',
}

const storage = new Map()
storage.set(PREF_KEY, JSON.stringify({ open: true, surface: 'dock', tab: 'stats', scheme: 'flypy' }))
storage.set(STAT_KEY, JSON.stringify({ v: 3, active: 'flypy', buckets: { flypy: flypyStats } }))

const cookieJar = new Map()
const docListeners = {}
const doc = {
  get cookie() { return [...cookieJar.entries()].map(([k, v]) => k + '=' + v).join('; ') },
  set cookie(str) {
    const first = String(str).split(';')[0]
    const eq = first.indexOf('=')
    if (eq < 0) return
    cookieJar.set(first.slice(0, eq).trim(), first.slice(eq + 1))
  },
  addEventListener: (t, fn) => { (docListeners[t] = docListeners[t] || []).push(fn) },
  removeEventListener: (t, fn) => {
    docListeners[t] = (docListeners[t] || []).filter((f) => f !== fn)
  },
}

const errors = []
let cursor = 0
const React = {
  createElement(type, props, ...children) {
    const p = Object.assign({}, props)
    if (children.length === 1) p.children = children[0]
    else if (children.length > 1) p.children = children
    return { type, props: p, __el: true }
  },
  useState(init) { cursor += 1; return [typeof init === 'function' ? init() : init, noop] },
  useRef(value) { return { current: value } },
  useEffect(fn) {
    try {
      const c = fn()
      if (typeof c === 'function') c()
    } catch (e) { errors.push(e.message) }
  },
  useLayoutEffect: noop,
  useMemo: (fn) => fn(),
  useCallback: (fn) => fn,
}

const sandbox = {
  console,
  document: doc,
  require: () => React,
  React,
  setTimeout(fn) { if (typeof fn === 'function') fn(); return 0 },
  clearTimeout: noop,
  setInterval: () => 0,
  clearInterval: noop,
  window: {
    localStorage: {
      getItem: (k) => (storage.has(k) ? storage.get(k) : null),
      setItem: (k, v) => storage.set(k, String(v)),
    },
    setTimeout(fn) { if (typeof fn === 'function') fn(); return 0 },
    clearTimeout: noop, setInterval: () => 0, clearInterval: noop,
    performance: { now: () => 1000 },
    innerWidth: 1440, innerHeight: 900,
    addEventListener: noop, removeEventListener: noop,
    requestAnimationFrame: (fn) => { fn(); return 0 }, cancelAnimationFrame: noop,
    ResizeObserver: function () { this.observe = noop; this.disconnect = noop },
  },
}
sandbox.global = sandbox
sandbox.window.__ModuleLoader__ = { load: (m) => { sandbox.__mod = m } }
vm.createContext(sandbox)
vm.runInContext(source, sandbox, { filename: 'client.js' })

const plugin = sandbox.__mod.factory(sandbox.require)
const captured = []
let storeRef = null
plugin.apply({
  locale: { register: noop, bind: () => (k) => k, subscribe: noop },
  effect: (fn) => { try { fn() } catch (e) { errors.push(e.message) } return noop },
  slots: {
    inject: (k, cb) => { cb(); return noop },
    register: (o, c) => { captured.push({ o, c }); return noop },
  },
})

function renderNow() {
  const texts = []
  function walk(node) {
    if (node === null || node === undefined || typeof node === 'boolean') return
    if (typeof node === 'string' || typeof node === 'number') { texts.push(String(node)); return }
    if (Array.isArray(node)) { node.forEach(walk); return }
    if (typeof node !== 'object' || !node.__el) return
    const props = node.props || {}
    // 从任意组件的 props 里抓到 store，后续直接改它
    if (props.store && props.store.state && props.store.state.ui) storeRef = props.store
    if (typeof node.type === 'function') { cursor = 0; walk(node.type(props)); return }
    if (props.children !== undefined) walk(props.children)
  }
  const reg = captured.find((c) => c.o.name === 'conversation.input.dock')
  walk(React.createElement(reg.c, {}))
  return texts.join('|')
}

/* 第一次渲染：小鹤，应有数据 */
const first = renderNow()
ok(storeRef, '未捕获到 store')
ok(/已收集\s*[1-9]/.test(first), '小鹤方案下应有已收集的字，实际: ' + first.slice(0, 160))
ok(first.includes('小鹤双拼'), '应显示小鹤方案标签')

/* 在同一个 store 上切到自然码，再渲染 */
storeRef.state.prefs.scheme = 'zrm'
storeRef.touch()
const second = renderNow()
ok(!/已收集\s*[1-9]/.test(second), '同一 store 切到自然码后记录页仍有内容，实际: ' + second.slice(0, 200))
ok(!second.includes('该按 K，实按 B'), '切到自然码后仍显示小鹤的错键记录')
ok(second.includes('自然码'), '应显示自然码方案标签')

/* 切回小鹤：数据应还在 */
storeRef.state.prefs.scheme = 'flypy'
storeRef.touch()
const third = renderNow()
ok(/已收集\s*[1-9]/.test(third), '切回小鹤后数据丢了，实际: ' + third.slice(0, 160))
ok(third.includes('小鹤双拼'), '切回应显示小鹤标签')

if (errors.length) throw new Error('render errors: ' + errors.slice(0, 2).join(' / '))

console.log('同一 store 上：小鹤有数据 → 切自然码清零 → 切回小鹤数据还在 ✓')
console.log(`smoke-switch-live: ${checks} 项断言通过`)
