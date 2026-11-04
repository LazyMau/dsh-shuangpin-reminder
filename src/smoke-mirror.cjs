/**
 * 镜像行为测试：node src/smoke-mirror.cjs
 *
 * cookie 镜像存在的意义：localStorage 按端口隔离，GUI 端口每次启动会变，
 * 所以统计要镜像到 cookie 才能换端口恢复。但它同时是隐私敏感面，因此要验证：
 *  1. 写进去的 cookie 不含用户输入原文（汉字、拼音）
 *  2. 一条 cookie 放得下，不超 4096 字节
 *  3. 能正确读回聚合计数
 *  4. 旧格式（含原文）残留会被自动重写成新格式
 */
const fs = require('fs')
const path = require('path')
const vm = require('vm')

const dir = process.argv[2] || '.'
const source = fs.readFileSync(path.join(dir, 'client.js'), 'utf8')

const noop = () => {}
let checks = 0
function ok(cond, label) {
  if (!cond) throw new Error(label)
  checks += 1
}

/* 极简 cookie jar：解析 document.cookie 的读写 */
function makeCookieJar() {
  const jar = new Map()
  const doc = {
    get cookie() {
      return [...jar.entries()].map(([k, v]) => k + '=' + v).join('; ')
    },
    set cookie(str) {
      const first = String(str).split(';')[0]
      const eq = first.indexOf('=')
      if (eq < 0) return
      const name = first.slice(0, eq).trim()
      const value = first.slice(eq + 1)
      const maxAge = /Max-Age=(\d+)/.exec(str)
      if (maxAge && Number(maxAge[1]) === 0) jar.delete(name)
      else jar.set(name, value)
    },
    addEventListener: noop,
    removeEventListener: noop,
  }
  return { jar, doc }
}

function mount(stats, extraStats, presetCookies) {
  const { jar, doc } = makeCookieJar()
  // 模拟「换端口」：先把上个端口写下的镜像 cookie 塞进来，再挂载
  if (presetCookies) for (const [k, v] of presetCookies) jar.set(k, v)
  const storage = new Map()
  storage.set('dsh.shuangpin-reminder.prefs.v4', JSON.stringify({ open: true, surface: 'dock', tab: 'stats' }))
  if (stats !== undefined && stats !== null) {
    storage.set('dsh.shuangpin-reminder.stats.v2', JSON.stringify(stats))
  }
  if (extraStats) jar.set(extraStats.name, extraStats.value)

  /* 记录 window 事件，稍后触发 pagehide 让插件落盘（镜像就在 save 里写） */
  const winHandlers = {}

  const React = {
    createElement: (type, props) => ({ type, props: props || {}, __el: true }),
    useState: (init) => [typeof init === 'function' ? init() : init, noop],
    useRef: (v) => ({ current: v }),
    useEffect: noop, useLayoutEffect: noop,
    useMemo: (fn) => fn(), useCallback: (fn) => fn,
  }
  const sandbox = {
    console,
    require: () => React,
    React,
    location: { protocol: 'http:' },
    document: doc,
    setTimeout: (fn) => { if (typeof fn === 'function') fn(); return 0 },
    clearTimeout: noop,
    setInterval: () => 0,
    clearInterval: noop,
    window: {
      localStorage: { getItem: (k) => (storage.has(k) ? storage.get(k) : null), setItem: (k, v) => storage.set(k, v) },
      setTimeout: (fn) => { if (typeof fn === 'function') fn(); return 0 },
      clearTimeout: noop, setInterval: () => 0, clearInterval: noop,
      performance: { now: () => 1000 },
      innerWidth: 1440, innerHeight: 900,
      addEventListener: (type, fn) => { (winHandlers[type] = winHandlers[type] || []).push(fn) },
      removeEventListener: (type, fn) => {
        winHandlers[type] = (winHandlers[type] || []).filter((f) => f !== fn)
      },
      requestAnimationFrame: (fn) => { fn(); return 0 }, cancelAnimationFrame: noop,
      ResizeObserver: function () { this.observe = noop; this.disconnect = noop },
    },
  }
  sandbox.global = sandbox
  sandbox.window.__moduleLoader = undefined
  sandbox.window.__ModuleLoader__ = { load: (mod) => { sandbox.__mod = mod } }
  vm.createContext(sandbox)
  vm.runInContext(source, sandbox, { filename: 'client.js' })

  const plugin = sandbox.__mod.factory(sandbox.require)
  const captured = []
  plugin.apply({
    locale: { register: () => noop, bind: () => (k) => k, subscribe: () => noop },
    effect: (fn) => { try { fn() } catch (e) { /* 忽略 */ } return noop },
    slots: {
      inject: (key, cb) => { cb(); return noop },
      register: (options, component) => { captured.push({ options, component }); return noop },
    },
  })
  return { jar, storage, captured, flush: () => (winHandlers.pagehide || []).forEach((fn) => fn()) }
}

const sampleStats = {
  v: 2, rev: 4, base: 420,
  chars: { 学: { n: 3, bad: 1, at: 1 }, 女: { n: 2, bad: 0, at: 2 } },
  keys: { q: { n: 5, bad: 1 }, k: { n: 3, bad: 2 } },
  events: [{ t: 1, word: '学女说好中间', codes: ['xt', 'nv'], ms: 900, backs: 1, slow: true }],
  echo: [{ t: 480, d: 'xue' }],
  stalls: [{ t: 3, word: '学', seq: ['x', 'xue'], backs: 1, shrinks: 1, ms: 1200 }],
  wrong: { 'k|b': 3 },
  bigram: { '学|女': 2 },
  lastChar: '情',
}

/* ---------- 1. 写入的镜像不含用户输入原文 ---------- */
{
  const { jar, flush } = mount(sampleStats)
  flush()
  const names = [...jar.keys()].filter((k) => k.startsWith('dsh.shuangpin.mirror.'))
  ok(names.length >= 1, '没有写入 cookie 镜像')

  const all = names.map((n) => decodeURIComponent(jar.get(n))).join('')
  for (const secret of ['学女', '学', '女', 'xue', '情', '说好']) {
    ok(!all.includes(secret), '镜像泄露了用户输入原文: ' + secret)
  }
  ok(all.includes('keys'), '镜像应包含 keys 聚合计数')
  ok(all.includes('wrong'), '镜像应包含 wrong 聚合计数')

  const biggest = Math.max(...names.map((n) => n.length + 1 + jar.get(n).length))
  ok(biggest <= 4096, '单条 cookie 超 4096 字节: ' + biggest)
  console.log('cookie 条数:', names.length, '| 最大单条:', biggest, '字节 | 不含输入原文 ✓')
}

/* ---------- 2. 能读回聚合计数 ---------- */
{
  const first = mount(sampleStats)
  first.flush()
  const before = new Map(first.jar)
  // 模拟「换端口」：新页面 localStorage 为空，只剩 cookie 镜像
  const second = mount(null, undefined, before)
  const restored = second.storage.get('dsh.shuangpin-reminder.stats.v2')
  ok(restored, '换端口后未从镜像恢复统计')
  const parsed = JSON.parse(restored)
  ok(parsed.keys && parsed.keys.q && parsed.keys.q.n === 5, '恢复后的键计数不正确')
  ok(parsed.wrong && parsed.wrong['k|b'] === 3, '恢复后的错键计数不正确')
  console.log('换端口恢复 keys.q.n =', parsed.keys.q.n, '| wrong =', JSON.stringify(parsed.wrong), '✓')
}

/* ---------- 3. 旧格式（含原文）会被重写清掉 ---------- */
{
  const legacy = {
    stats: {
      v: 2, rev: 9, base: 420,
      keys: { q: { n: 1, bad: 0 } },
      wrong: {},
      events: [{ t: 1, word: '秘密输入', codes: ['mm'] }],
      echo: [{ t: 10, d: 'mimi' }],
      lastChar: '密',
      chars: { 密: { n: 1 } },
    },
  }
  const value = encodeURIComponent(JSON.stringify(legacy))
  const { jar, flush } = mount(null, { name: 'dsh.shuangpin.mirror.0', value })
  flush()
  const leftover = [...jar.entries()]
    .filter(([k]) => k.startsWith('dsh.shuangpin.mirror.'))
    .map(([, v]) => decodeURIComponent(v))
    .join('')
  ok(!leftover.includes('秘密输入'), '旧格式原文仍残留在 cookie 里')
  ok(!leftover.includes('mimi'), '旧格式拼音仍残留在 cookie 里')
  ok(!leftover.includes('密'), '旧格式 lastChar 仍残留')
  console.log('旧格式原文已清除 ✓')
}

console.log(`smoke-mirror: ${checks} 项断言通过`)
