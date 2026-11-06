/**
 * 分阶段提示的显示验证：node src/smoke-stages.cjs [dir]
 *
 * 直接渲染 MapTab，喂给它不同的 live / flash 状态，
 * 检查「同一时刻只表达一个动作」是否真的成立：
 *
 *   连续输入（没停顿、没撤销） → 键盘保持安静，不出现候选
 *   停顿后                     → 给少量候选，且不超过 2 个键
 *   撤销后                     → 给候选
 *   刚上屏且有纠正              → 只确认被纠正的那一个韵母键
 *   长期弱点                    → 底部小标记，不再用整圈边框
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
const PREF_KEY = 'dsh.shuangpin-reminder.prefs.v4'
const STAT_KEY = 'dsh.shuangpin-reminder.stats.v2'

function build(storeStats) {
  const storage = new Map()
  storage.set(PREF_KEY, JSON.stringify({ open: true, surface: 'dock', tab: 'map', scheme: 'flypy' }))
  if (storeStats) storage.set(STAT_KEY, JSON.stringify(storeStats))
  const jar = new Map()
  const listeners = {}
  const doc = {
    get cookie() { return [...jar.entries()].map(([k, v]) => k + '=' + v).join('; ') },
    set cookie(s) {
      const f = String(s).split(';')[0]
      const i = f.indexOf('=')
      if (i < 0) return
      jar.set(f.slice(0, i).trim(), f.slice(i + 1))
    },
    addEventListener: (t, fn) => { (listeners[t] = listeners[t] || []).push(fn) },
    removeEventListener: noop,
    dispatch: (t, e) => { (listeners[t] || []).forEach((fn) => fn(e)) },
  }
  const React = {
    createElement: (type, props, ...ch) => {
      const p = Object.assign({}, props)
      if (ch.length === 1) p.children = ch[0]
      else if (ch.length > 1) p.children = ch
      return { type, props: p, __el: true }
    },
    useState: (init) => [typeof init === 'function' ? init() : init, noop],
    useRef: (v) => ({ current: v }),
    useEffect: (fn) => { try { const c = fn(); if (typeof c === 'function') c() } catch (e) {} },
    useLayoutEffect: noop,
    useMemo: (fn) => fn(),
    useCallback: (fn) => fn,
  }
  const sandbox = {
    console, document: doc, require: () => React, React,
    location: { protocol: 'http:' },
    setTimeout: (fn) => { if (typeof fn === 'function') fn(); return 0 },
    clearTimeout: noop, setInterval: () => 0, clearInterval: noop,
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
  return { captured, React, storage, mod: plugin }
}

/**
 * 渲染真实入口（DockShell），并用 store 驱动 live / 事件驱动 flash：
 *   live   来自 store.state.ui.live
 *   flash  来自 useFlash 订阅 stats.events[0]
 *
 * 关键点：useFlash 是通过 store.subscribe 推 flash 的，
 * 所以注入事件之后必须真的 notify 一次，否则 flash 永远是 null
 * ——那会让「上屏确认」这条路径测不到（正是第一版测试的漏洞）。
 */
function render(m, live, event) {
  const reg = m.captured.find((c) => c.o.name === 'conversation.input.dock')
  let store = null
  function collect() {
    const out = { keys: {}, status: '', levels: {}, dots: {} }
    function walk(node) {
      if (node === null || node === undefined || typeof node === 'boolean') return
      if (typeof node === 'string') {
        if (/^(Try:|可试：|[a-züA-Z]+\s*→\s*[A-Z])/.test(node)) out.status = node
        return
      }
      if (typeof node === 'number') return
      if (Array.isArray(node)) { node.forEach(walk); return }
      if (typeof node !== 'object' || !node.__el) return
      const props = node.props || {}
      if (props.store && props.store.state && props.store.state.ui) store = props.store
      if (props.item && props.item.k && 'predict' in props) {
        const k = props.item.k.toLowerCase()
        out.keys[k] = props.predict
        out.levels[k] = props.level
        const kids = Array.isArray(props.children) ? props.children : [props.children]
        out.dots[k] = kids.some(function (c) {
          return c && c.__el && c.props && c.props.style && c.props.style.height === 3 && c.props.style.background
        })
      }
      if (typeof node.type === 'function') { walk(node.type(props)); return }
      if (props.children !== undefined) walk(props.children)
    }
    walk(m.React.createElement(reg.c, {}))
    return out
  }
  // 第一次渲染：建立 store 与订阅
  collect()
  if (!store) return collect()
  store.state.ui.live = live || null
  if (event) store.state.stats.events.unshift(event)
  // 触发一次通知，让 useFlash 把事件推成 flash
  if (typeof store.notify === 'function') store.notify()
  return collect()
}

/* 用一条有纠正历史的统计做底：ie 已经错过，ian 是混淆对象 */
function baseStats() {
  return {
    v: 2, rev: 3, base: 420,
    chars: { 些: { n: 3, ms: 900, bad: 2, slow: 0, fix: 0, hint: 0, at: 1 } },
    keys: { p: { n: 5, bad: 3, slow: 0, fix: 0, hint: 0, ok: 0 } },
    events: [], echo: [], stalls: [], wrong: { 'p|m': 2 }, bigram: {}, lastChar: '些',
    rules: {
      'flypy|f|ie': { n: 5, solo: 0, helped: 0, conf: 3, wrong: { 'flypy|f|ian': 2 }, lastAt: 1 },
      'flypy|f|ian': { n: 2, solo: 0, helped: 0, conf: 0, wrong: {}, lastAt: 0 },
    },
  }
}

/* ---------- 1. 连续输入：保持安静 ---------- */
{
  const m = build({ v: 3, active: 'flypy', buckets: { flypy: baseStats() } })
  const r = render(m, { text: "na'x", at: Date.now(), backs: 0, shrinks: 0 }, null)
  const cands = Object.keys(r.keys).filter((k) => r.keys[k] && r.keys[k].kind === 'candidate')
  ok(cands.length === 0,
    '连续输入（无停顿无撤销）不该出现候选，实际: ' + JSON.stringify(cands))
  ok(r.status === '', '连续输入时状态行应为空，实际: ' + JSON.stringify(r.status))
  console.log('连续输入 → 键盘保持安静 ✓')
}

/* ---------- 2. 停顿后：给少量候选 ---------- */
{
  const m = build({ v: 3, active: 'flypy', buckets: { flypy: baseStats() } })
  const r = render(m, { text: "na'x", at: Date.now(), backs: 0, shrinks: 0, paused: true }, null)
  const cands = Object.keys(r.keys).filter((k) => r.keys[k] && r.keys[k].kind === 'candidate')
  ok(cands.length > 0, '停顿后应给出候选')
  ok(cands.length <= 2, '候选不应超过 2 个键，实际: ' + cands.length + ' → ' + cands.join(','))
  ok(cands.indexOf('p') >= 0, 'ie 所在的 P 应是候选之一，实际: ' + cands.join(','))
  ok(r.status.indexOf('可试') >= 0, '状态行应说明可试哪些，实际: ' + JSON.stringify(r.status))
  console.log('停顿后 → 只给 ' + cands.map((c) => c.toUpperCase()).join('/') + '，并有一行说明 ✓')
}

/* ---------- 3. 撤销后：也给候选 ---------- */
{
  const m = build({ v: 3, active: 'flypy', buckets: { flypy: baseStats() } })
  const r = render(m, { text: "na'x", at: Date.now(), backs: 1, shrinks: 2 }, null)
  const cands = Object.keys(r.keys).filter((k) => r.keys[k] && r.keys[k].kind === 'candidate')
  ok(cands.length > 0, '撤销后应给出候选')
  console.log('撤销后 → 给出候选 ✓')
}

/* ---------- 4. 上屏后：只确认被纠正的那个键 ---------- */
{
  const m = build({ v: 3, active: 'flypy', buckets: { flypy: baseStats() } })
  const reg = m.captured.find((c) => c.o.name === 'conversation.input.dock')
  // useFlash 的 setFlash 依赖真实 useState 重渲染，桩做不到；
  // 所以这里直接构造 MapTab 的 props 传 flash，测的是渲染逻辑本身。
  let store = null
  const probe = {}
  function find(node) {
    if (node === null || typeof node !== 'object') return
    if (Array.isArray(node)) { node.forEach(find); return }
    if (!node.__el) return
    const props = node.props || {}
    if (props.store && props.store.state && props.store.state.ui) store = props.store
    if (typeof node.type === 'function') { find(node.type(props)); return }
    if (props.children !== undefined) find(props.children)
  }
  find(m.React.createElement(reg.c, {}))
  ok(store, '未捕获到 store')
  ok(m.mod.__test && m.mod.__test.MapTab, '产物应导出 __test.MapTab')
  const event = { t: 1, word: '些', codes: ['x', 'p'], ms: 800, slow: false, backs: 0, correctedFinal: 'ie' }
  store.state.ui.live = null
  // 直接用 MapTab 的组件函数渲染
  const el = m.React.createElement(m.mod.__test.MapTab, {
    store: store, stats: store.state.stats, prefs: store.state.prefs,
    t: (k) => k, flash: { key: 1, event: event },
    width: 900, live: null, reveal: true,
  })
  const out = { keys: {}, status: '', levels: {}, dots: {} }
  function walk(node) {
    if (node === null || node === undefined || typeof node === 'boolean') return
    if (typeof node === 'string') {
      if (node.indexOf('→') >= 0 || node.indexOf('hintCandidates') >= 0) out.status = node
      return
    }
    if (Array.isArray(node)) { node.forEach(walk); return }
    if (typeof node !== 'object' || !node.__el) return
    const props = node.props || {}
    if (props.item && props.item.k && 'predict' in props) {
      const k = props.item.k.toLowerCase()
      out.keys[k] = props.predict
    }
    if (typeof node.type === 'function') { walk(node.type(props)); return }
    if (props.children !== undefined) walk(props.children)
  }
  walk(el)
  const confirms = Object.keys(out.keys).filter((k) => out.keys[k] && out.keys[k].kind === 'confirm')
  ok(confirms.length === 1, '只应确认一个键，实际: ' + confirms.length + ' → ' + confirms.join(','))
  ok(confirms[0] === 'p', 'ie 的键 P 应被确认，实际: ' + confirms[0])
  ok(out.keys.p.final === 'ie', '确认的键应携带韵母 ie，实际: ' + out.keys.p.final)
  console.log('上屏纠正 → 只确认 P（韵母 ie）✓')
}

/* ---------- 5. 长期弱点：底部小标记，不抢注意力 ---------- */
{
  const m = build({ v: 3, active: 'flypy', buckets: { flypy: baseStats() } })
  const Keycap = m.mod.__test.Keycap
  const sch = require(path.join(__dirname, 'schemes.cjs')).SCHEMES.flypy
  function kidStyles(level) {
    const el = Keycap({
      item: { k: 'P', f: ['ie'], s: null, ex: [] },
      size: { w: 60, h: 46 }, sch: sch, level: level, predict: null, t: (k) => k,
    })
    const kids = Array.isArray(el.props.children) ? el.props.children : [el.props.children]
    return kids.filter(function (c) { return c && c.__el }).map(function (c) { return c.props.style })
  }
  const badStyles = kidStyles('bad')
  const dot = badStyles.filter(function (s) { return s && s.height === 3 && s.background })[0]
  ok(dot, '反复出错的键应有底部小标记')
  ok(!badStyles.some(function (s) { return s && s.borderColor && s.borderColor.indexOf('error') >= 0 }),
    '长期弱点不应再给整圈边框染色（视觉语义交给底部标记）')
  const plain = kidStyles(null)
  ok(!plain.some(function (s) { return s && s.height === 3 && s.background }),
    '没有弱点的键不应有小标记')
  console.log('长期弱点 → 只在底部留一个小标记，不染整圈边框 ✓')
}

/* ---------- 6. F / J 定位点 ---------- */
{
  const m = build({ v: 3, active: 'flypy', buckets: { flypy: baseStats() } })
  const Keycap = m.mod.__test.Keycap
  const sch = require(path.join(__dirname, 'schemes.cjs')).SCHEMES.flypy
  function hasDot(letter) {
    const el = Keycap({
      item: { k: letter, f: ['a'], s: null, ex: [] },
      size: { w: 60, h: 46 }, sch: sch, level: null, predict: null, t: (k) => k,
    })
    const kids = Array.isArray(el.props.children) ? el.props.children : [el.props.children]
    return kids.some(function (c) {
      return c && c.__el && c.props.style && c.props.style.borderRadius === 1.5
    })
  }
  ok(hasDot('F'), 'F 键应有定位点')
  ok(hasDot('J'), 'J 键应有定位点')
  ok(!hasDot('G'), 'G 键不应有定位点')
  ok(!hasDot('A'), 'A 键不应有定位点')
  console.log('F / J 定位点 → 只出现在这两个键上 ✓')
}

console.log(`smoke-stages: ${checks} 项断言通过`)
