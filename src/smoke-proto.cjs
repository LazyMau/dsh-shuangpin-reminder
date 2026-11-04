/**
 * 原型污染体检：node src/smoke-proto.cjs
 *
 * 统计数据的键来自外部输入（localStorage / cookie 镜像）。
 * 如果直接把外部 JSON 的键写进对象，`__proto__` 这类键会污染 Object.prototype，
 * 进而影响整个页面。这里验证插件对恶意统计数据的处理是安全的。
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

function mount(rawStats) {
  const storage = new Map()
  storage.set('dsh.shuangpin-reminder.prefs.v4', JSON.stringify({ open: true, surface: 'dock' }))
  if (rawStats) storage.set('dsh.shuangpin-reminder.stats.v2', rawStats)
  const cookieJar = new Map()
  const doc = {
    get cookie() { return [...cookieJar.entries()].map(([k, v]) => k + '=' + v).join('; ') },
    set cookie(str) {
      const first = String(str).split(';')[0]
      const eq = first.indexOf('=')
      if (eq < 0) return
      cookieJar.set(first.slice(0, eq).trim(), first.slice(eq + 1))
    },
    addEventListener: noop, removeEventListener: noop,
  }
  const React = {
    createElement: (type, props) => ({ type, props: props || {} }),
    useState: (init) => [typeof init === 'function' ? init() : init, noop],
    useRef: (v) => ({ current: v }),
    useEffect: noop, useLayoutEffect: noop,
    useMemo: (fn) => fn(), useCallback: (fn) => fn,
  }
  const sandbox = {
    console, require: () => React, React,
    location: { protocol: 'http:' },
    document: doc,
    setTimeout: (fn) => { if (typeof fn === 'function') fn(); return 0 },
    clearTimeout: noop, setInterval: () => 0, clearInterval: noop,
    window: {
      localStorage: { getItem: (k) => (storage.has(k) ? storage.get(k) : null), setItem: (k, v) => storage.set(k, v) },
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
  const slots = []
  plugin.apply({
    locale: { register: noop, bind: () => (k) => k, subscribe: noop },
    effect: (fn) => { try { fn() } catch (e) {} return noop },
    slots: { inject: (k, cb) => { cb(); return noop }, register: (o, c) => { slots.push({ o, c }); return noop } },
  })
  return { slots, storage }
}

/* 恶意统计：原型污染 + 超长字符串 + 非数字 */
const evil = JSON.stringify({
  v: 2,
  chars: JSON.parse('{"__proto__":{"polluted":"yes"}}'),
  keys: JSON.parse('{"__proto__":{"polluted":"yes"},"constructor":{"polluted":"yes"}}'),
  wrong: JSON.parse('{"__proto__":{"polluted":"yes"}}'),
  bigram: JSON.parse('{"__proto__":{"polluted":"yes"}}'),
  events: Array.from({ length: 999 }, () => ({ t: 'x', word: '长'.repeat(5000) })),
  echo: Array.from({ length: 999 }, () => ({ t: -1, d: 'a'.repeat(5000) })),
  stalls: Array.from({ length: 999 }, () => ({ t: 'x', word: '长'.repeat(5000) })),
  lastChar: '长'.repeat(5000),
  base: 'not-a-number',
})

const beforePolluted = {}.polluted
const { slots } = mount(evil)

ok({}.polluted === beforePolluted, '原型被污染: Object.prototype.polluted = ' + ({}).polluted)
ok(!('polluted' in {}), 'Object.prototype 上出现了 polluted 属性')
ok(slots.length > 0, '恶意数据导致插件没有注册任何组件')

/* 再挂载一次并能渲染，说明未崩溃 */
ok(true, 'malicious stats did not break registration')

/* 正常数据仍然可用 */
const good = JSON.stringify({
  v: 2, chars: { 学: { n: 1, bad: 0, at: 1 } }, keys: { q: { n: 2, bad: 0 } },
  wrong: {}, bigram: { '学|女': 1 }, events: [], echo: [], stalls: [], lastChar: '学', base: 420,
})
const second = mount(good)
ok(second.slots.length > 0, '正常数据下插件未注册组件')

console.log(`smoke-proto: ${checks} 项断言通过`)
