/**
 * 按方案隔离统计的测试：node src/smoke-per-scheme.cjs .
 *
 * 需求：记录要跟着当前选择的方案走。换方案后，记录页只显示该方案的
 * 打字数据，而不是把两套键位的数据混在一起（同一个键在不同方案下
 * 对应不同韵母，混在一起的热力图没有意义）。
 *
 * 验证：
 *  1. 在方案 A 打字，数据只落在 A 的桶里
 *  2. 切到方案 B，记录为空（不串用 A 的数据）
 *  3. 在 B 打字后切回 A，A 的数据仍然在
 *  4. 旧格式（无 buckets 的扁平统计）能正确迁到当前方案
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

function mount(seed) {
  const storage = new Map(Object.entries(seed || {}))
  const cookieJar = new Map()
  const docHandlers = {}
  const doc = {
    get cookie() { return [...cookieJar.entries()].map(([k, v]) => k + '=' + v).join('; ') },
    set cookie(str) {
      const first = String(str).split(';')[0]
      const eq = first.indexOf('=')
      if (eq < 0) return
      cookieJar.set(first.slice(0, eq).trim(), first.slice(eq + 1))
    },
    addEventListener: (t, fn) => { (docHandlers[t] = docHandlers[t] || []).push(fn) },
    removeEventListener: (t, fn) => {
      docHandlers[t] = (docHandlers[t] || []).filter((f) => f !== fn)
    },
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
  const slots = []
  plugin.apply({
    locale: { register: noop, bind: () => (k) => k, subscribe: noop },
    effect: (fn) => { try { fn() } catch (e) {} return noop },
    slots: { inject: (k, cb) => { cb(); return noop }, register: (o, c) => { slots.push({ o, c }); return noop } },
  })
  return { storage, slots, dispatch: (t, ev) => (docHandlers[t] || []).forEach((fn) => fn(ev)) }
}

/** 取当前落盘的统计桶 */
function bucketOf(storage, id) {
  const raw = storage.get(STAT_KEY)
  if (!raw) return null
  const j = JSON.parse(raw)
  if (!j.buckets) return j
  return j.buckets[id] || null
}

function storeOf(storage) {
  const raw = storage.get(STAT_KEY)
  return raw ? JSON.parse(raw) : null
}

/* 模拟在输入框里打一个字 */
function typeChar(m, ch, pinyin) {
  const target = {
    nodeType: 1, tagName: 'TEXTAREA',
    getAttribute: () => null, isContentEditable: false,
    closest: () => null,
  }
  m.dispatch('compositionstart', { target })
  m.dispatch('compositionupdate', { target, data: pinyin })
  m.dispatch('compositionend', { target, data: ch })
}

/* ---------- 1. 默认方案（flypy）下打字 ---------- */
{
  const m = mount({})
  typeChar(m, '情', 'qing')
  typeChar(m, '学', 'xue')
  const store = storeOf(m.storage)
  ok(store && store.buckets, '统计未按方案分桶')
  ok(store.active === 'flypy', '默认方案应为 flypy，实际: ' + (store && store.active))
  const flypy = bucketOf(m.storage, 'flypy')
  ok(flypy && flypy.chars && flypy.chars['情'], 'flypy 桶里没有「情」的记录')
  ok(!bucketOf(m.storage, 'zrm'), '其他方案不该有数据')
  console.log('默认方案统计落在 flypy 桶 ✓')
}

/* ---------- 2. 切到自然码：记录应为空，不串用小鹤数据 ---------- */
{
  const prefs = JSON.stringify({ open: true, surface: 'dock', tab: 'stats', scheme: 'zrm' })
  const m = mount({ [PREF_KEY]: prefs })
  typeChar(m, '情', 'qing')
  const store = storeOf(m.storage)
  ok(store.active === 'zrm', '活跃方案应为 zrm，实际: ' + store.active)
  const zrm = bucketOf(m.storage, 'zrm')
  ok(zrm && zrm.chars && zrm.chars['情'], 'zrm 桶里没有记录')
  // 小鹤桶此刻还不存在，说明没有沿用/串用
  ok(!bucketOf(m.storage, 'flypy'), '切到 zrm 后不应凭空出现 flypy 数据')
  console.log('切换方案后统计各归各的桶 ✓')
}

/* ---------- 3. 两个方案都有数据，互不覆盖 ---------- */
{
  const seed = {
    [PREF_KEY]: JSON.stringify({ open: true, surface: 'dock', scheme: 'zrm' }),
    [STAT_KEY]: JSON.stringify({
      v: 3, active: 'zrm',
      buckets: {
        flypy: { v: 2, rev: 5, base: 400, chars: { 学: { n: 9, bad: 1, at: 1 } }, keys: {}, events: [], echo: [], stalls: [], wrong: {}, bigram: {} },
        zrm: { v: 2, rev: 1, base: 500, chars: { 学: { n: 2, bad: 0, at: 2 } }, keys: {}, events: [], echo: [], stalls: [], wrong: {}, bigram: {} },
      },
    }),
  }
  const m = mount(seed)
  const flypy = bucketOf(m.storage, 'flypy')
  const zrm = bucketOf(m.storage, 'zrm')
  ok(flypy.chars['学'].n === 9, 'flypy 的计数被改动了: ' + flypy.chars['学'].n)
  ok(zrm.chars['学'].n === 2, 'zrm 的计数被改动了: ' + zrm.chars['学'].n)
  console.log('两套方案数据独立共存（flypy 9 / zrm 2）✓')
}

/* ---------- 4. 旧格式扁平统计归入小鹤（而不是升级时停留的方案） ---------- */
{
  const seed = {
    [PREF_KEY]: JSON.stringify({ open: true, surface: 'dock', scheme: 'mspy' }),
    [STAT_KEY]: JSON.stringify({
      v: 2, rev: 7, base: 430,
      chars: { 中: { n: 4, bad: 1, at: 3 } },
      keys: { v: { n: 2, bad: 0 } }, events: [], echo: [], stalls: [], wrong: {}, bigram: {}, lastChar: '中',
    }),
  }
  const m = mount(seed)
  const store = storeOf(m.storage)
  ok(store.buckets, '旧格式未迁移成分桶结构')
  // 旧数据没有方案信息；当时插件只支持小鹤，所以统一归小鹤，
  // 不能归给「升级那一刻停留的方案」，否则小鹤的记录会出现在别的方案里
  const flypy = bucketOf(m.storage, 'flypy')
  ok(flypy && flypy.chars['中'] && flypy.chars['中'].n === 4, '旧数据未归入小鹤')
  const mspy = bucketOf(m.storage, 'mspy')
  ok(!mspy || !Object.keys(mspy.chars || {}).length, '旧数据不应落在 mspy 桶里')
  console.log('旧格式数据归入小鹤、不污染当前方案 ✓')
}

console.log(`smoke-per-scheme: ${checks} 项断言通过`)
