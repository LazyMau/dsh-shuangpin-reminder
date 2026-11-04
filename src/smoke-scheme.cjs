/**
 * 界面层方案切换自测：node src/smoke-scheme.cjs .
 *
 * 校验「换方案 → 键帽韵母跟着换」这条链路真的通：
 * 方案切换控件在标题栏（键位页不再有方案栏），
 * 因此分别用 flypy / mspy / abc 渲染，比较键帽与提示文字。
 */
const fs = require('fs')
const path = require('path')
const vm = require('vm')

const dir = process.argv[2]
const source = fs.readFileSync(path.join(dir, 'client.js'), 'utf8')

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

function renderWith(prefsJson, uiPatch) {
  const storage = new Map()
  storage.set('dsh.shuangpin-reminder.prefs.v4', JSON.stringify(prefsJson))
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
  const plugin = mod.factory(sandbox.require)
  const locale = { register: () => noop, bind: () => (key) => key, subscribe: () => noop }
  const captured = []
  const ctx = {
    locale,
    effect: (fn) => { fn(); return noop },
    slots: {
      inject: (key, cb) => { cb(); return noop },
      register: (options, component) => { captured.push({ options, component }); return noop },
    },
  }
  plugin.apply(ctx)

  const texts = []
  let store = null
  // 遍历元素树：顺手记下任何组件 props 里的 store（store 建在 apply 闭包里）
  function walk(node) {
    if (node === null || node === undefined || typeof node === 'boolean') return
    if (typeof node === 'string' || typeof node === 'number') { texts.push(String(node)); return }
    if (Array.isArray(node)) { node.forEach(walk); return }
    if (typeof node !== 'object' || !node.__el) return
    const props = node.props || {}
    if (props.store && props.store.state && props.store.state.ui) store = props.store
    if (typeof node.type === 'function') { hookCursor = 0; walk(node.type(props)); return }
    if (props.children !== undefined) walk(props.children)
  }
  const reg = captured.find((c) => c.options.name === 'conversation.input.dock')
  if (!reg) throw new Error('dock registration missing')
  walk(React.createElement(reg.component, {}))
  // ui.customOpen 不在 prefs 里：拿到 store 后打开编辑器再渲染一次
  if (uiPatch) {
    if (!store) throw new Error('未捕获到 store，无法打开自定义编辑器')
    Object.assign(store.state.ui, uiPatch)
    texts.length = 0
    walk(React.createElement(reg.component, {}))
  }
  return texts
}

const base = { open: true, surface: 'dock', tab: 'map' }

const flypyTexts = renderWith(Object.assign({}, base, { scheme: 'flypy' }))
const mspyTexts = renderWith(Object.assign({}, base, { scheme: 'mspy' }))
const abcTexts = renderWith(Object.assign({}, base, { scheme: 'abc' }))

if (errors.length) throw new Error('render errors: ' + errors.slice(0, 2).join('\n'))

const flypyJoin = flypyTexts.join('|')
const mspyJoin = mspyTexts.join('|')
const abcJoin = abcTexts.join('|')

function expectContains(haystack, needle, label) {
  if (!haystack.includes(needle)) throw new Error(`${label}: 缺少 ${needle}`)
}
function expectMissing(haystack, needle, label) {
  if (haystack.includes(needle)) throw new Error(`${label}: 不该出现 ${needle}`)
}

/* 标题栏就是方案下拉：收起时只显示当前方案名（选项列表点开才渲染，见 smoke-picker） */
expectContains(flypyJoin, '小鹤双拼', '标题显示当前方案名')
expectContains(mspyJoin, '微软双拼', '微软方案下标题显示微软双拼')
expectContains(abcJoin, '智能ABC', '智能ABC 方案下标题显示智能ABC')
expectMissing(flypyJoin, '自然码', '收起时不应渲染其他方案名')

/* 键位页不再有独立的方案栏（旧的「方案」标签不该出现） */
expectMissing(flypyJoin, '方案', '键位页不应有方案栏')

/* 声母提示随方案变 */
expectContains(flypyJoin, 'zh=v', '小鹤声母提示 zh=v')
expectContains(abcJoin, 'zh=a', '智能ABC 声母提示 zh=a')
expectMissing(abcJoin, 'zh=v', '智能ABC 不应显示小鹤声母提示')

/* 键帽韵母随方案变：小鹤 V 是 ü/ui，微软 V 只有 ü */
expectContains(flypyJoin, 'ü / ui', '小鹤 V 键=ü/ui')
expectContains(mspyJoin, 'ü', '微软 V 键=ü')
expectMissing(mspyJoin, 'ü / ui', '微软 V 键不再含 ui')
if (flypyJoin === mspyJoin) throw new Error('切换方案后键位表没有变化')

/* 零声母提示随方案变 */
expectContains(flypyJoin, '双字母照全拼', '小鹤零声母提示')
expectContains(mspyJoin, '先按 o', '微软零声母提示 o 打头')

/* 自定义：把 ai 改到 b 后，B 键韵母应包含 ai */
const customPrefs = Object.assign({}, base, {
  scheme: 'custom',
  custom: {
    zero: 'natural',
    initials: { zh: 'v', ch: 'i', sh: 'u' },
    finals: {
      a: 'a', o: 'o', e: 'e', i: 'i', u: 'u', v: 'v',
      ai: 'b', ei: 'w', ao: 'c', ou: 'z', an: 'j', en: 'f',
      ang: 'h', eng: 'g',
      ia: 'x', ie: 'p', iao: 'n', iu: 'q', ian: 'm', in: 'b',
      iang: 'l', ing: 'k', iong: 's', ong: 's',
      ua: 'x', uo: 'o', uai: 'k', ui: 'v', uan: 'r', un: 'y', uang: 'l',
      ue: 't', ve: 't',
    },
  },
})
const customTexts = renderWith(customPrefs)
const customJoin = customTexts.join('|')
expectContains(customJoin, '自定义', '自定义方案生效')
expectContains(customJoin, 'ai', '自定义方案下 ai 仍显示在键帽上')

/* 自定义编辑器：customOpen 时渲染编辑面板，含模板选择与保存按钮 */
const editorTexts = renderWith(Object.assign({}, customPrefs), { customOpen: true })
const editorJoin = editorTexts.join('|')
expectContains(editorJoin, '自定义键位', '编辑器标题')
expectContains(editorJoin, '以…为模板', '编辑器含模板选择')
expectContains(editorJoin, '保存并启用', '编辑器含保存按钮')
expectContains(editorJoin, '零声母', '编辑器含零声母选择')
/* 编辑器打开时不再渲染键盘（覆盖式面板） */
if (editorJoin.includes('Q iu')) throw new Error('编辑器打开时不应同时渲染键位图')

console.log('flypy 声母提示:', flypyTexts.filter((t) => t.includes('zh='))[0])
console.log('abc   声母提示:', abcTexts.filter((t) => t.includes('zh='))[0])
console.log('mspy  零声母  :', mspyTexts.filter((t) => t.includes('先按 o'))[0])
console.log('SCHEME SWITCH OK')
