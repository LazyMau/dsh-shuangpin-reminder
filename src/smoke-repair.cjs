/**
 * 验证错放修复：node src/smoke-repair.cjs .
 *
 * 背景：中间版本把「升级前那份没有方案信息的旧统计」归给了升级时停留的方案。
 * 用户因此看到「切到别的方案，记录里还有内容」。
 * 这里验证新版本能把这种情况修回来，同时不会误伤真的用过多个方案的用户。
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

function bucket(chars) {
  return {
    v: 2, rev: 5, base: 420,
    chars: chars, keys: {}, events: [], echo: [], stalls: [], wrong: {}, bigram: {}, lastChar: '',
  }
}

function mount(prefsScheme, statsStore) {
  const storage = new Map()
  storage.set(PREF_KEY, JSON.stringify({ open: true, surface: 'dock', scheme: prefsScheme }))
  storage.set(STAT_KEY, JSON.stringify(statsStore))
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
    createElement: (type, props, ...ch) => {
      const p = Object.assign({}, props)
      if (ch.length === 1) p.children = ch[0]
      else if (ch.length > 1) p.children = ch
      return { type, props: p, __el: true }
    },
    useState: (i) => [typeof i === 'function' ? i() : i, noop],
    useRef: (v) => ({ current: v }),
    useEffect: noop, useLayoutEffect: noop,
    useMemo: (fn) => fn(), useCallback: (fn) => fn,
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
  sandbox.__moduleLoader = undefined
  sandbox.window.__ModuleLoader__ = { load: (m) => { sandbox.__mod = m } }
  vm.createContext(sandbox)
  vm.runInContext(source, sandbox, { filename: 'client.js' })
  const plugin = sandbox.__mod.factory(sandbox.require)
  plugin.apply({
    locale: { register: noop, bind: () => (k) => k, subscribe: noop },
    effect: (fn) => { try { fn() } catch (e) {} return noop },
    slots: { inject: (k, cb) => { cb(); return noop }, register: () => noop },
  })
  return JSON.parse(storage.get(STAT_KEY))
}

/* 1. 错放：小鹤为空、zrm 有数据（中间版本把旧数据塞给了 zrm） */
{
  const out = mount('zrm', { v: 3, active: 'zrm', buckets: { zrm: bucket({ 学: { n: 9, bad: 4, at: 1 } }) } })
  ok(out.buckets.flypy && Object.keys(out.buckets.flypy.chars).length === 1, '错放的旧数据未挪回小鹤')
  ok(!out.buckets.zrm || !Object.keys(out.buckets.zrm.chars || {}).length, 'zrm 里仍残留旧数据')
  ok(out.v3fixed === true, '未打修复标记，下次启动会重复搬')
  console.log('错放到 zrm 的旧数据 → 挪回小鹤 ✓')
}

/* 2. 真的用过两个方案：不能把 zrm 的数据也搬走 */
{
  const out = mount('flypy', {
    v: 3, active: 'flypy',
    buckets: {
      flypy: bucket({ 学: { n: 3, bad: 1, at: 1 } }),
      zrm: bucket({ 中: { n: 5, bad: 2, at: 2 } }),
    },
  })
  ok(Object.keys(out.buckets.flypy.chars).length === 1, '小鹤数据被改动')
  ok(Object.keys(out.buckets.zrm.chars).length === 1, '真用过的 zrm 数据被误搬')
  console.log('两套方案都有真实数据时不被误伤 ✓')
}

/* 3. 已修复过（有标记）：不再搬 */
{
  const out = mount('zrm', {
    v: 3, active: 'zrm', v3fixed: true,
    buckets: { zrm: bucket({ 中: { n: 5, bad: 0, at: 2 } }) },
  })
  ok(Object.keys(out.buckets.zrm.chars).length === 1, '已修复过的数据被重复搬动')
  console.log('已修复过的数据保持原样 ✓')
}

/* 4. 全新用户：不报错，读到的存储结构正常 */
{
  const out = mount('flypy', { v: 3, active: 'flypy', buckets: {} })
  ok(out && typeof out === 'object', '全新用户读到的存储结构异常')
  ok(!out.buckets || typeof out.buckets === 'object', 'buckets 结构异常')
  console.log('全新用户正常 ✓')
}

console.log(`smoke-repair: ${checks} 项断言通过`)
