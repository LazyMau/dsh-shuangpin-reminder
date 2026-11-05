/**
 * 退格 → 打错 的判定验证：node src/smoke-backspace.cjs .
 *
 * 用户选择：「退格直接算错，按已推断的键计」。
 *   能推断出错键 → 记到正确的那个键上，算明确错误（bad）
 *   推断不出     → 只记 fix（改过码），不升级为错误
 *
 * 场景来自用户：想打「哪些」，韵母按错了，退格重打。
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

function build() {
  const storage = new Map()
  storage.set(PREF_KEY, JSON.stringify({ open: true, surface: 'dock', tab: 'map', scheme: 'flypy' }))
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
    removeEventListener: noop,
    dispatch: (t, e) => { (docListeners[t] || []).forEach((fn) => fn(e)) },
  }
  let clock = 1000
  const perf = { now: () => clock }
  let cursor = 0
  const React = {
    createElement: (type, props, ...ch) => {
      const p = Object.assign({}, props)
      if (ch.length === 1) p.children = ch[0]
      else if (ch.length > 1) p.children = ch
      return { type, props: p, __el: true }
    },
    useState: (init) => { cursor += 1; return [typeof init === 'function' ? init() : init, noop] },
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
      performance: perf,
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
  return { captured, doc, React, advance: (d) => { clock += d } }
}

const target = {
  nodeType: 1, tagName: 'TEXTAREA', getAttribute: () => null, isContentEditable: false,
  getBoundingClientRect: () => ({ left: 100, top: 700, width: 600, height: 120, right: 700, bottom: 820 }),
}

function getStore(m) {
  const reg = m.captured.find((c) => c.o.name === 'conversation.input.dock')
  let store = null
  function walk(node) {
    if (!node || typeof node !== 'object') return
    if (Array.isArray(node)) { node.forEach(walk); return }
    if (!node.__el) return
    const props = node.props || {}
    if (props.store && props.store.state && props.store.state.ui) store = props.store
    if (typeof node.type === 'function') { walk(node.type(props)); return }
    if (props.children !== undefined) walk(props.children)
  }
  walk(m.React.createElement(reg.c, {}))
  return store
}

/**
 * 打一个词，中途退格改码。
 * 模拟「想打 xie（些，小鹤是 xp），先按错成 xq，退格重打 xp」：
 * 预编辑在暴露拼音时是 xie 的拼音串，退格时会变短。
 */
function typeWithCorrection(m, before, after, text) {
  m.doc.dispatch('compositionstart', { target })
  // 先输错
  for (let i = 0; i < before.length; i += 1) {
    m.advance(200)
    m.doc.dispatch('compositionupdate', { target, data: before.slice(0, i + 1) })
  }
  // 退格（预编辑变短）
  m.advance(200)
  m.doc.dispatch('compositionupdate', { target, data: after })
  // 重打正确
  for (let i = after.length; i < after.length + 2; i += 1) {
    m.advance(150)
    m.doc.dispatch('compositionupdate', { target, data: after + 'xx'.slice(0, i - after.length) })
  }
  m.advance(200)
  m.doc.dispatch('compositionend', { target, data: text })
}

/* 1. 能推断出错键时，错键被记为 bad */
{
  const m = build()
  const store = getStore(m)
  ok(store, '未捕获到 store')
  // 想打「些 xie」：先输入到 xiax（错），退格到 xia，再补成 xie
  // 预编辑暴露拼音的情况下，轨迹里会出现变短，confusionPairs 能推断出错的是韵母键
  m.doc.dispatch('compositionstart', { target })
  m.advance(200); m.doc.dispatch('compositionupdate', { target, data: 'x' })
  m.advance(200); m.doc.dispatch('compositionupdate', { target, data: 'xi' })
  m.advance(200); m.doc.dispatch('compositionupdate', { target, data: 'xia' })
  m.advance(200); m.doc.dispatch('compositionupdate', { target, data: 'xian' })  // 按错，本该 ie
  m.advance(300); m.doc.dispatch('compositionupdate', { target, data: 'xi' })    // 退格
  m.advance(200); m.doc.dispatch('compositionupdate', { target, data: 'xie' })   // 重打对
  m.advance(200); m.doc.dispatch('compositionend', { target, data: '些' })

  const st = store.state.stats
  const wrongKeys = Object.keys(st.wrong || {})
  const badKeys = Object.keys(st.keys || {}).filter((k) => st.keys[k].bad > 0)
  console.log('推断出的错键对:', JSON.stringify(st.wrong))
  console.log('记了 bad 的键:', badKeys.length ? badKeys.join(',') : '（无）')
  ok(wrongKeys.length > 0, '这次退格应能被推断出「该按错在哪个键」')
  ok(badKeys.length > 0, '推断出的错键应记为 bad（这是本次改动）')
  // 错的键应该是对的韵母键（ie → p），不是实际误按的键
  ok(badKeys.indexOf('p') >= 0, 'ie 的正确键 p 应被记为 bad，实际: ' + badKeys.join(','))
  console.log('退格可推断 → 记到正确的键上（p）✓')
}

/* 2. 推断不出错键时，不升级为 bad */
{
  const m = build()
  const store = getStore(m)
  // 只退格，但轨迹不足以推断（没有拼音连续性）
  m.doc.dispatch('compositionstart', { target })
  m.advance(200); m.doc.dispatch('compositionupdate', { target, data: 'x' })
  m.advance(200); m.doc.dispatch('compositionupdate', { target, data: '' })
  m.advance(200); m.doc.dispatch('compositionupdate', { target, data: 'x' })
  m.advance(200); m.doc.dispatch('compositionend', { target, data: '些' })

  const st = store.state.stats
  const badSum = Object.keys(st.keys || {}).reduce((a, k) => a + (st.keys[k].bad || 0), 0)
  ok(badSum === 0, '推断不出错键时不应记 bad，实际: ' + badSum)
  console.log('退格不可推断 → 不记 bad ✓')
}

/* 3. 没有退格的正常输入，不产生 bad */
{
  const m = build()
  const store = getStore(m)
  m.doc.dispatch('compositionstart', { target })
  m.advance(150); m.doc.dispatch('compositionupdate', { target, data: 'x' })
  m.advance(150); m.doc.dispatch('compositionupdate', { target, data: 'xi' })
  m.advance(150); m.doc.dispatch('compositionupdate', { target, data: 'xie' })
  m.advance(150); m.doc.dispatch('compositionend', { target, data: '些' })
  const st = store.state.stats
  const badSum = Object.keys(st.keys || {}).reduce((a, k) => a + (st.keys[k].bad || 0), 0)
  ok(badSum === 0, '顺利输入不应产生任何 bad，实际: ' + badSum)
  console.log('顺利输入 → 无 bad ✓')
}

console.log(`smoke-backspace: ${checks} 项断言通过`)
