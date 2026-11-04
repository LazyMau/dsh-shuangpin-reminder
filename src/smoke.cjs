const fs = require('fs')
const path = require('path')
const vm = require('vm')

const dir = process.argv[2]
const variant = process.argv[3] || 'map'
let source = fs.readFileSync(path.join(dir, 'client.js'), 'utf8')

if (variant === 'drill') source = source.replace("tab: 'map'", "tab: 'drill'").replace('open: false', 'open: true')
if (variant === 'stats') source = source.replace("tab: 'map'", "tab: 'stats'").replace('open: false', 'open: true')
if (variant === 'map') source = source.replace('open: false', 'open: true')
if (variant === 'fab') source = source.replace("surface: 'dock'", "surface: 'float'")
if (variant === 'float') source = source.replace("surface: 'dock'", "surface: 'float'").replace('open: false', 'open: true')

const noop = () => {}
const errors = []
let hookCursor = 0
const React = {
  createElement(type, props, ...children) {
    const p = Object.assign({}, props)
    if (children.length === 1) p.children = children[0]
    else if (children.length > 1) p.children = children
    return { type, props: p, __el: true }
  },
  useState(init) { hookCursor += 1; return [typeof init === 'function' ? init() : init, noop] },
  useRef(value) { return { current: value } },
  useEffect(fn) {
    try {
      const cleanup = fn()
      if (typeof cleanup === 'function') cleanup()
    } catch (error) { errors.push('useEffect: ' + error.stack) }
  },
  useLayoutEffect(fn) {
    try {
      const cleanup = fn()
      if (typeof cleanup === 'function') cleanup()
    } catch (error) { errors.push('useLayoutEffect: ' + error.stack) }
  },
  useMemo(fn) { return fn() },
  useCallback(fn) { return fn },
}

const storage = new Map()
if (variant === 'stats') {
  storage.set('dsh.xiaohe-shuangpin.stats.v2', JSON.stringify({
    v: 2, rev: 3, base: 420,
    chars: {
      '学': { n: 4, ms: 2100, bad: 2, at: 5 },
      '女': { n: 3, ms: 1800, bad: 2, at: 6 },
      '说': { n: 2, ms: 900, bad: 1, at: 7 },
    },
    keys: {}, events: [],
    stalls: [{ t: 9, word: '忘', seq: ['w', 'wn', 'w', 'wh'], backs: 2, shrinks: 1, ms: 2400 }],
    wrong: { 'H|N': 3 },
    bigram: { '学生': 5, '学时': 2 },
    lastChar: '学',
    echo: [
      { t: 0, d: '▶ 开始合成' },
      { t: 210, d: 'x' },
      { t: 480, d: 'xue' },
      { t: 900, d: '✔ 上屏：学' },
    ],
  }))
}

const listeners = {}
const doc = {
  addEventListener(type, fn) { (listeners[type] = listeners[type] || []).push(fn) },
  removeEventListener(type, fn) { listeners[type] = (listeners[type] || []).filter((f) => f !== fn) },
  dispatch(type, event) { (listeners[type] || []).forEach((fn) => fn(event)) },
}

const sandbox = {
  console,
  document: doc,
  require: () => React,
  React,
  setTimeout(fn, ms) { if (ms <= 600) fn(); return 0 },
  clearTimeout: noop,
  setInterval(fn, ms) { if (ms <= 600) fn(); return 0 },
  clearInterval: noop,
  window: {
    localStorage: { getItem: (k) => (storage.has(k) ? storage.get(k) : null), setItem: (k, v) => storage.set(k, v) },
    setTimeout(fn, ms) { if (ms <= 600) fn(); return 0 },
    clearTimeout: noop,
    setInterval(fn, ms) { if (ms <= 600) fn(); return 0 },
    clearInterval: noop,
    performance: { now: () => 1000 },
    innerWidth: 1440,
    innerHeight: 900,
    addEventListener: noop,
    removeEventListener: noop,
    requestAnimationFrame: (fn) => { fn(); return 0 },
    cancelAnimationFrame: noop,
    ResizeObserver: function () { this.observe = noop; this.disconnect = noop },
  },
}
sandbox.global = sandbox
sandbox.window.__ModuleLoader__ = { load: (mod) => { sandbox.__mod = mod } }

vm.createContext(sandbox)
vm.runInContext(source, sandbox, { filename: 'client.js' })

const mod = sandbox.__mod
if (!mod || !mod.factory) throw new Error('module not loaded')
const plugin = mod.factory(sandbox.require)

const locale = { register: () => noop, bind: () => (key) => key, subscribe: () => noop }
let captured = []
const ctx = {
  locale,
  effect: (fn) => { fn(); return noop },
  slots: {
    inject: (key, cb) => { cb(); return noop },
    register: (options, component) => { captured.push({ options, component }); return noop },
  },
}
plugin.apply(ctx)
if (!captured.length) throw new Error('slot registration missing')
const dockReg = captured.find((c) => c.options.name === 'conversation.input.dock')
const floatReg = captured.find((c) => c.options.name === 'shell.overlay')
const toggleReg = captured.find((c) => c.options.name === 'conversation.input.right')
if (!dockReg || dockReg.options.id !== 'xiaohe-shuangpin') throw new Error('dock registration missing')
if (!floatReg || floatReg.options.id !== 'xiaohe-shuangpin-float') throw new Error('float registration missing')
if (!toggleReg || toggleReg.options.id !== 'xiaohe-shuangpin-toggle') throw new Error('toggle registration missing')

if (variant === 'capture') {
  const target = {
    nodeType: 1, tagName: 'TEXTAREA', getAttribute: () => null, isContentEditable: false,
    getBoundingClientRect: () => ({ left: 100, top: 700, width: 600, height: 120, right: 700, bottom: 820 }),
  }
  // 模拟一次真实卡壳：想打 情(qing=qk)，韵母忘了，先按了 N(qin) 退格再按 K(qing)
  doc.dispatch('compositionstart', { target })
  doc.dispatch('compositionupdate', { target, data: 'q' })
  doc.dispatch('compositionupdate', { target, data: 'qi' })
  doc.dispatch('compositionupdate', { target, data: 'qin' })
  doc.dispatch('compositionupdate', { target, data: 'qi' })
  doc.dispatch('compositionupdate', { target, data: 'qing' })
  doc.dispatch('compositionend', { target, data: '情' })
  const raw = storage.get('dsh.xiaohe-shuangpin.stats.v2')
  if (!raw) throw new Error('stats were not persisted')
  const stats = JSON.parse(raw)
  const codes = stats.events[0].codes
  console.log('captured codes:', JSON.stringify(codes))
  console.log('stall trace:', JSON.stringify(stats.stalls[0] && stats.stalls[0].seq))
  console.log('confusion:', JSON.stringify(stats.wrong))
  console.log('lastChar:', stats.lastChar)
  if (JSON.stringify(codes) !== JSON.stringify(['qk'])) throw new Error('unexpected codes: ' + JSON.stringify(codes))
  if (!stats.stalls.length || stats.stalls[0].shrinks !== 1) throw new Error('stall record missing')
  if (stats.wrong['k|b'] !== 1) throw new Error('confusion k|b not detected: ' + JSON.stringify(stats.wrong))
  if (stats.lastChar !== '情') throw new Error('lastChar not updated')
  const echoText = JSON.stringify(stats.echo || [])
  if (echoText.indexOf('qin') < 0 || echoText.indexOf('▶') < 0) throw new Error('echo samples missing')
  console.log('CAPTURE OK')
  return
}

const texts = []
function render(node) {
  if (node === null || node === undefined || typeof node === 'boolean') return
  if (typeof node === 'string' || typeof node === 'number') { texts.push(String(node)); return }
  if (Array.isArray(node)) { node.forEach(render); return }
  if (typeof node !== 'object' || !node.__el) return
  if (typeof node.type === 'function') { hookCursor = 0; render(node.type(node.props)); return }
  const props = node.props || {}
  if (props.title) texts.push(String(props.title))
  if (props['aria-label']) texts.push(String(props['aria-label']))
  if (props.children !== undefined) render(props.children)
}

const renderRegs = variant === 'fab'
  ? captured.filter((c) => c.options.name !== 'conversation.input.right')
  : captured
renderRegs.forEach(function (reg) { render(React.createElement(reg.component, {})) })
const joined = texts.join(' | ')
console.log('variant:', variant, '| effect errors:', errors.length ? errors.slice(0, 2).join('\n') : 'none')
console.log('sample:', joined.slice(0, 320))

const need = {
  map: ['小鹤', '键位', '练习', '记录', '声母：zh'],
  drill: ['按两个键', '常用字'],
  stats: ['已收集', '最容易卡的键', '卡过的字', '学', '输入法回显采样', '+480ms', '常按错的键', '该按 H，实按 N', '卡壳过程', 'wn→w→wh'],
  float: ['小鹤', '键位', '透明度', '固定面板'],
}[variant] || []
for (const needle of need) {
  if (!joined.includes(needle)) throw new Error('missing rendered text: ' + needle)
}
if (variant === 'fab') {
  if (joined.length !== 0) throw new Error('collapsed float should render nothing, got: ' + joined)
  console.log('collapsed float renders nothing ✓')
}
console.log('SMOKE OK')
