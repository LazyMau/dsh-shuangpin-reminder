/**
 * 记录页跟随方案的渲染验证：node src/smoke-records-switch.cjs .
 *
 * 用户报告：一直用小鹤打了很多字，切到别的方案，记录页里还有内容。
 * 这里用真实渲染验证「记录页文本」是否随方案切换而变化，
 * 而不是只看数据结构（数据结构对了但界面没刷新，用户仍然看到旧内容）。
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

/* 一份「小鹤打了很多字」的统计 */
const flypyStats = {
  v: 2, rev: 12, base: 420,
  chars: {
    学: { n: 9, bad: 4, at: 5 }, 情: { n: 7, bad: 3, at: 6 },
    女: { n: 5, bad: 2, at: 7 }, 说: { n: 4, bad: 2, at: 8 },
  },
  keys: {}, events: [{ t: 9, word: '学', codes: ['xt'], ms: 900, slow: true, backs: 2 }],
  echo: [], stalls: [{ t: 9, word: '学', seq: ['x', 'xt'], backs: 2, shrinks: 1, ms: 900 }],
  wrong: { 'k|b': 3 }, bigram: {}, lastChar: '学',
}

function render(prefs, statsStore) {
  const storage = new Map()
  storage.set(PREF_KEY, JSON.stringify(prefs))
  if (statsStore) storage.set(STAT_KEY, JSON.stringify(statsStore))

  const cookieJar = new Map()
  const listeners = {}
  const doc = {
    get cookie() { return [...cookieJar.entries()].map(([k, v]) => k + '=' + v).join('; ') },
    set cookie(str) {
      const first = String(str).split(';')[0]
      const eq = first.indexOf('=')
      if (eq < 0) return
      cookieJar.set(first.slice(0, eq).trim(), first.slice(eq + 1))
    },
    addEventListener: (t, fn) => { (listeners[t] = listeners[t] || []).push(fn) },
    removeEventListener: noop,
  }

  /* 极简 hooks：每个组件重置游标，保证 state 不串 */
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
    useEffect: noop,
    useLayoutEffect: noop,
    useMemo: (fn) => fn(),
    useCallback: (fn) => fn,
  }

  const sandbox = {
    console,
    document: doc,
    require: () => React,
    React,
    setTimeout: (fn) => { if (typeof fn === 'function') fn(); return 0 },
    clearTimeout: noop,
    setInterval: () => 0,
    clearInterval: noop,
    window: {
      localStorage: {
        getItem: (k) => (storage.has(k) ? storage.get(k) : null),
        setItem: (k, v) => storage.set(k, String(v)),
      },
      setTimeout: (fn) => { if (typeof fn === 'function') fn(); return 0 },
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
  plugin.apply({
    locale: { register: noop, bind: () => (k) => k, subscribe: noop },
    effect: (fn) => { try { fn() } catch (e) {} return noop },
    slots: {
      inject: (k, cb) => { cb(); return noop },
      register: (o, c) => { captured.push({ o, c }); return noop },
    },
  })

  const texts = []
  function walk(node) {
    if (node === null || node === undefined || typeof node === 'boolean') return
    if (typeof node === 'string' || typeof node === 'number') { texts.push(String(node)); return }
    if (Array.isArray(node)) { node.forEach(walk); return }
    if (typeof node !== 'object' || !node.__el) return
    if (typeof node.type === 'function') { cursor = 0; walk(node.type(node.props || {})); return }
    const props = node.props || {}
    if (props.children !== undefined) walk(props.children)
  }
  const reg = captured.find((c) => c.o.name === 'conversation.input.dock')
  if (!reg) throw new Error('dock registration missing')
  walk(React.createElement(reg.c, {}))
  return texts.join('|')
}

/* 场景：小鹤有大量记录，统计结构里只有 flypy 桶 */
const onlyFlypy = {
  v: 3, active: 'flypy', buckets: { flypy: flypyStats },
}

const flypyPage = render({ open: true, surface: 'dock', tab: 'stats', scheme: 'flypy' }, onlyFlypy)
const zrmPage = render({ open: true, surface: 'dock', tab: 'stats', scheme: 'zrm' }, onlyFlypy)
const mspyPage = render({ open: true, surface: 'dock', tab: 'stats', scheme: 'mspy' }, onlyFlypy)

/* 1. 小鹤方案下应看到已收集的字 */
ok(/已收集\s*[1-9]/.test(flypyPage), '小鹤方案下记录页应显示已收集的字，实际: ' + flypyPage.slice(0, 200))
ok(flypyPage.includes('小鹤双拼'), '小鹤方案下应有方案标签')

/* 2. 切到自然码：记录页必须清零，不能还显示小鹤的数据 */
ok(!/已收集\s*[1-9]/.test(zrmPage), '切到自然码后记录页仍有内容（应清零），实际: ' + zrmPage.slice(0, 200))
ok(!zrmPage.includes('学'), '切到自然码后仍显示小鹤打过的字「学」')
ok(!zrmPage.includes('该按 K，实按 B'), '切到自然码后仍显示小鹤的错键记录')
ok(zrmPage.includes('自然码'), '自然码方案下应有方案标签')

/* 3. 再切到微软，同样应为空 */
ok(!/已收集\s*[1-9]/.test(mspyPage), '切到微软后记录页仍有内容')
ok(mspyPage.includes('微软双拼'), '微软方案下应有方案标签')

console.log('小鹤有记录时：小鹤页有数据、自然码页为空、微软页为空 ✓')
console.log(`smoke-records-switch: ${checks} 项断言通过`)
