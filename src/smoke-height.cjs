/**
 * 新会话高度回归：node src/smoke-height.cjs <dir>
 *
 * 现象：新会话时消息区还是空的，输入框附近可用高度更小，
 * 面板被当成可压缩的 flex 子项压扁，键盘只剩一行。
 *
 * 这里断言「压扁」需要的两件事都做了：
 *  1. 面板本身 flexShrink: 0（不被父级 flex 压缩）
 *  2. 键盘容器与每一行键位 flexShrink: 0（不被正文滚动区压扁）
 * 并按最坏情况估算三行键位的实际高度是否装得进面板。
 */
const fs = require('fs')
const path = require('path')
const vm = require('vm')

const dir = process.argv[2] || '.'
const source = fs.readFileSync(path.join(dir, 'client.js'), 'utf8')

const noop = () => {}
const slotsByFn = new Map()
let currentSlot = null
let stateCursor = 0

const React = {
  createElement(type, props, ...children) {
    const p = Object.assign({}, props)
    if (children.length === 1) p.children = children[0]
    else if (children.length > 1) p.children = children
    return { type, props: p, __el: true }
  },
  useState(init) {
    const idx = stateCursor
    stateCursor += 1
    const slot = currentSlot
    if (slot.values[idx] === undefined) slot.values[idx] = typeof init === 'function' ? init() : init
    return [slot.values[idx], (next) => { slot.values[idx] = typeof next === 'function' ? next(slot.values[idx]) : next }]
  },
  useRef(value) { return { current: value } },
  useEffect(fn) { try { const c = fn(); if (typeof c === 'function') c() } catch (e) { /* 忽略 */ } },
  useLayoutEffect(fn) { try { fn() } catch (e) { /* 忽略 */ } },
  useMemo(fn) { return fn() },
  useCallback(fn) { return fn },
}

function renderFn(fn, props) {
  let slot = slotsByFn.get(fn)
  if (!slot) { slot = { values: [] }; slotsByFn.set(fn, slot) }
  const prevSlot = currentSlot
  const prevCursor = stateCursor
  currentSlot = slot
  stateCursor = 0
  try {
    return fn(props)
  } finally {
    currentSlot = prevSlot
    stateCursor = prevCursor
  }
}

function collect(node, out) {
  if (node === null || node === undefined || typeof node === 'boolean') return
  if (Array.isArray(node)) { node.forEach((n) => collect(n, out)); return }
  if (typeof node !== 'object' || !node.__el) return
  out.push(node)
  const props = node.props || {}
  if (typeof node.type === 'function') { collect(renderFn(node.type, props), out); return }
  if (props.children !== undefined) collect(props.children, out)
}

/* 用新会话的空统计挂载：没有历史、没有样本 */
function mount(prefs) {
  const storage = new Map()
  storage.set('dsh.shuangpin-reminder.prefs.v4', JSON.stringify(prefs))
  const sandbox = {
    console,
    require: () => React,
    React,
    setTimeout: () => 0,
    clearTimeout: noop,
    setInterval: () => 0,
    clearInterval: noop,
    document: { addEventListener: noop, removeEventListener: noop },
    window: {
      localStorage: { getItem: (k) => (storage.has(k) ? storage.get(k) : null), setItem: (k, v) => storage.set(k, v) },
      setTimeout: () => 0, clearTimeout: noop, setInterval: () => 0, clearInterval: noop,
      performance: { now: () => 1000 },
      innerWidth: 1440, innerHeight: 900,
      addEventListener: noop, removeEventListener: noop,
      requestAnimationFrame: (fn) => { fn(); return 0 }, cancelAnimationFrame: noop,
      ResizeObserver: function () { this.observe = noop; this.disconnect = noop },
    },
  }
  sandbox.global = sandbox
  sandbox.window.__ModuleLoader__ = { load: (mod) => { sandbox.__mod = mod } }
  vm.createContext(sandbox)
  vm.runInContext(source, sandbox, { filename: 'client.js' })

  const plugin = sandbox.__mod.factory(sandbox.require)
  const captured = []
  plugin.apply({
    locale: { register: () => noop, bind: () => (k) => k, subscribe: () => noop },
    effect: () => noop,
    slots: {
      inject: (key, cb) => { cb(); return noop },
      register: (options, component) => { captured.push({ options, component }); return noop },
    },
  })
  const dock = captured.find((c) => c.options.name === 'conversation.input.dock')
  if (!dock) throw new Error('dock registration missing')
  const els = []
  collect(React.createElement(dock.component, {}), els)
  return els
}

let checks = 0
function ok(cond, label) {
  if (!cond) throw new Error(label)
  checks += 1
}

/* ---------- 1. 面板与键盘都不许被压缩 ---------- */
const els = mount({ open: true, surface: 'dock', tab: 'map' })

const panel = els.find((el) => el.props && el.props.style && el.props.style.maxHeight === 'calc(100vh - 200px)')
ok(panel, '找不到面板容器')
ok(panel.props.style.flexShrink === 0, '面板缺少 flexShrink:0，会被父级 flex 压扁')
ok(panel.props.style.display === 'flex' && panel.props.style.flexDirection === 'column', '面板需为竖向 flex')

const body = els.find((el) => el.props && el.props.style && el.props.style.flex === '1 1 auto' && el.props.style.overflowY === 'auto')
ok(body, '找不到正文滚动区')

const keyboard = els.find((el) => el.props && el.props.style && el.props.style.flexDirection === 'column' && el.props.style.flexShrink === 0 && !el.props.style.maxHeight)
ok(keyboard, '键盘容器缺少 flexShrink:0，会被正文滚动区压扁')

/* 三行键位：每行都要 flexShrink:0，否则会逐行压扁 */
const keyRows = els.filter((el) => el.props && el.props.style && el.props.style.marginLeft !== undefined && el.props.style.flexShrink === 0)
ok(keyRows.length === 3, `应为三行键位，实际 ${keyRows.length} 行`)

console.log('面板 flexShrink:0 ✓  键盘 flexShrink:0 ✓  三行键位均不可压缩 ✓')

/* ---------- 2. 最坏情况：高度是否装得下 ---------- */
const zfs = els.filter((el) => typeof el.type === 'string' && el.type === 'div' && el.props && el.props.style)
/* 从键位尺寸推算三行高度 */
const keyEls = els.filter((el) => el.props && el.props.style && el.props.style.height && el.props.style.width)
ok(keyEls.length >= 26, `键位数量异常: ${keyEls.length}`)
const keyH = keyEls[0].props.style.height
const gap = Math.max(3, Math.round(keyH * 0.13))
const keyboardH = keyH * 3 + gap * 2
const headerH = 34
const bodyPad = 22
const hintH = 46
const needH = headerH + bodyPad + keyboardH + hintH

/* 视口 900 时面板上限 */
const limitH = 900 - 200
console.log(`键位高 ${keyH}px → 键盘 ${keyboardH}px；键位页需要约 ${needH}px，面板上限 ${limitH}px`)
ok(needH <= limitH, `键位页需要 ${needH}px，超过面板上限 ${limitH}px`)

console.log(`smoke-height: ${checks} 项断言通过`)
