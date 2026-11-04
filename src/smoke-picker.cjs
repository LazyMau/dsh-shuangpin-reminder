/**
 * 下拉交互自测：node src/smoke-picker.cjs <dir>
 *
 * 原生 <select> 的弹层由系统绘制（白底黑字、跟随不了主题），已换成自绘 Picker。
 * 这里验证：收起时只画当前项；点开后画出全部选项；点选后收起并回调；
 * 且不再残留任何原生 select。
 */
const fs = require('fs')
const path = require('path')
const vm = require('vm')

const dir = process.argv[2] || '.'
const source = fs.readFileSync(path.join(dir, 'client.js'), 'utf8')

const noop = () => {}
const hookState = []
let stateCursor = 0
let currentSlot = null

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
    if (slot.values[idx] === undefined) {
      slot.values[idx] = typeof init === 'function' ? init() : init
    }
    const setter = (next) => {
      slot.values[idx] = typeof next === 'function' ? next(slot.values[idx]) : next
    }
    return [slot.values[idx], setter]
  },
  useRef(value) { return { current: value } },
  useEffect(fn) {
    try {
      const cleanup = fn()
      if (typeof cleanup === 'function') cleanup()
    } catch (error) { /* 清理阶段报错不影响本次断言 */ }
  },
  useLayoutEffect(fn) { try { fn() } catch (error) { /* 同上 */ } },
  useMemo(fn) { return fn() },
  useCallback(fn) { return fn },
}

/* 每个组件函数各自一份 hook 槽位，避免多次渲染时游标串位 */
const slotsByFn = new Map()
function slotOf(fn) {
  let slot = slotsByFn.get(fn)
  if (!slot) { slot = { cursor: 0, values: [] }; slotsByFn.set(fn, slot) }
  return slot
}
function renderFn(fn, props) {
  const slot = slotOf(fn)
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

/* 收集渲染树里的元素，便于查找按钮并模拟点击 */
function collect(node, out) {
  if (node === null || node === undefined || typeof node === 'boolean') return
  if (Array.isArray(node)) { node.forEach((n) => collect(n, out)); return }
  if (typeof node !== 'object' || !node.__el) return
  out.push(node)
  const props = node.props || {}
  if (typeof node.type === 'function') {
    collect(renderFn(node.type, props), out)
    return
  }
  if (props.children !== undefined) collect(props.children, out)
}

function textsOf(node, out) {
  out = out || []
  if (node === null || node === undefined || typeof node === 'boolean') return out
  if (typeof node === 'string' || typeof node === 'number') { out.push(String(node)); return out }
  if (Array.isArray(node)) { node.forEach((n) => textsOf(n, out)); return out }
  if (typeof node !== 'object' || !node.__el) return out
  if (typeof node.type === 'function') { textsOf(renderFn(node.type, node.props), out); return out }
  const props = node.props || {}
  if (props.children !== undefined) textsOf(props.children, out)
  return out
}

function mount(prefs) {
  const storage = new Map()
  storage.set('dsh.shuangpin-reminder.prefs.v4', JSON.stringify(prefs))
  const sandbox = {
    console,
    require: () => React,
    React,
    setTimeout(fn) { if (typeof fn === 'function') return 0; return 0 },
    clearTimeout: noop,
    setInterval: () => 0,
    clearInterval: noop,
    document: { addEventListener: noop, removeEventListener: noop },
    window: {
      localStorage: {
        getItem: (k) => (storage.has(k) ? storage.get(k) : null),
        setItem: (k, v) => storage.set(k, v),
      },
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
    effect: (fn) => { try { fn() } catch (error) { /* 忽略 */ } return noop },
    slots: {
      inject: (key, cb) => { cb(); return noop },
      register: (options, component) => { captured.push({ options, component }); return noop },
    },
  })
  const dock = captured.find((c) => c.options.name === 'conversation.input.dock')
  if (!dock) throw new Error('dock registration missing')
  return { dock, sandbox }
}

const basePrefs = { open: true, surface: 'dock', tab: 'map', scheme: 'flypy' }

/* ---------- 1. 不再有原生 select ---------- */
{
  const { dock } = mount(Object.assign({}, basePrefs))
  const els = []
  collect(React.createElement(dock.component, {}), els)
  const selects = els.filter((el) => el.type === 'select')
  if (selects.length) throw new Error('仍在使用原生 select: ' + selects.length + ' 个')
  const pickers = els.filter((el) => el.props && typeof el.props.onPick === 'function')
  if (!pickers.length) throw new Error('没有找到自绘 Picker')
  console.log('原生 select: 0 个，自绘 Picker:', pickers.length, '个 ✓')
}

/* ---------- 2. 收起时只显示当前方案 ---------- */
{
  const { dock } = mount(Object.assign({}, basePrefs))
  const els = []
  collect(React.createElement(dock.component, {}), els)
  const all = textsOf(React.createElement(dock.component, {}))
  const joined = all.join('|')
  if (!joined.includes('小鹤双拼')) throw new Error('收起时未显示当前方案名')
  if (joined.includes('智能ABC')) throw new Error('收起时不应渲染全部选项')

  // 找到标题栏 Picker 的展开按钮
  const trigger = els.find((el) => el.type === 'button' && el.props && el.props['aria-haspopup'] === 'listbox')
  if (!trigger) throw new Error('找不到下拉按钮')
  if (trigger.props['aria-expanded'] !== false) throw new Error('初始应处于收起状态')

  // 点开
  trigger.props.onClick({ stopPropagation: noop })
  const opened = textsOf(React.createElement(dock.component, {}))
  const openJoin = opened.join('|')
  for (const name of ['小鹤双拼', '自然码', '微软双拼', '智能ABC', '拼音加加', '自定义…']) {
    if (!openJoin.includes(name)) throw new Error('展开后缺少选项: ' + name)
  }
  console.log('展开后六个选项齐备 ✓')
}

/* ---------- 3. 点选后收起并生效 ---------- */
{
  const { dock } = mount(Object.assign({}, basePrefs))
  let els = []
  collect(React.createElement(dock.component, {}), els)
  let trigger = els.find((el) => el.type === 'button' && el.props && el.props['aria-haspopup'] === 'listbox')
  trigger.props.onClick({ stopPropagation: noop })

  els = []
  collect(React.createElement(dock.component, {}), els)
  const option = els.find((el) => el.type === 'button' && el.props && el.props.role === 'option' && el.props['aria-selected'] === false && textsOf(el).join('') === '微软双拼')
  if (!option) throw new Error('找不到「微软双拼」选项')

  let picked = null
  const pickerEl = els.find((el) => el.props && typeof el.props.onPick === 'function')
  const origOnPick = pickerEl.props.onPick
  pickerEl.props.onPick = (value) => { picked = value; origOnPick(value) }
  // 重新渲染一次，让上面的替换进入实际按钮回调
  els = []
  collect(React.createElement(dock.component, {}), els)
  const opt2 = els.find((el) => el.type === 'button' && el.props && el.props.role === 'option' && textsOf(el).join('') === '微软双拼')
  if (!opt2) throw new Error('重新渲染后找不到「微软双拼」选项')
  opt2.props.onClick({ stopPropagation: noop })

  const after = textsOf(React.createElement(dock.component, {})).join('|')
  if (!after.includes('微软双拼')) throw new Error('点选后标题未更新为微软双拼')
  if (after.includes('智能ABC')) throw new Error('点选后下拉应自动收起')
  console.log('点选后收起并切换为微软双拼 ✓')
  void picked
}

console.log('PICKER OK')
