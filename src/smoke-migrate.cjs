/**
 * 存储键迁移测试：node src/smoke-migrate.cjs .
 *
 * 包名从 @local/xiaohe-shuangpin-reminder 改为 @local/shuangpin-reminder 后，
 * localStorage 的键也换了名。老用户升级时必须把旧键的数据搬过来，否则
 * 统计与偏好会凭空清零。这里验证：
 *  1. 旧键有数据、新键为空 → 迁移后能读到旧数据
 *  2. 新键已有数据 → 不被旧键覆盖
 *  3. 两者都没有 → 正常初始化，不报错
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
const NEW_PREF = 'dsh.shuangpin-reminder.prefs.v4'
const NEW_STAT = 'dsh.shuangpin-reminder.stats.v2'
const OLD_PREF = 'dsh.xiaohe-shuangpin.prefs.v4'
const OLD_STAT = 'dsh.xiaohe-shuangpin.stats.v2'

function mount(seed) {
  const storage = new Map(Object.entries(seed || {}))
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
  return { storage, slots }
}

/* 1. 只有旧键：应迁移到新键 */
{
  const oldPrefs = JSON.stringify({ open: true, surface: 'float', w: 640, scheme: 'zrm' })
  const oldStats = JSON.stringify({ v: 2, keys: { q: { n: 7, bad: 2 } }, wrong: {}, base: 420 })
  const { storage } = mount({ [OLD_PREF]: oldPrefs, [OLD_STAT]: oldStats })

  ok(storage.get(NEW_PREF) === oldPrefs, '旧偏好未迁移到新键')
  // 统计现在按方案分桶，值会被重新组织，所以比对语义而不是原文
  const statRaw = storage.get(NEW_STAT)
  ok(statRaw, '旧统计未迁移到新键')
  const statStore = JSON.parse(statRaw)
  // 旧统计没有方案信息，统一归到小鹤（当时插件只支持小鹤）
  const bucket = statStore.buckets ? statStore.buckets.flypy : statStore
  ok(bucket && bucket.keys && bucket.keys.q && bucket.keys.q.n === 7, '旧统计迁移后键计数丢了')
  ok(bucket.base === 420, '旧统计迁移后 base 丢了')
  console.log('旧键 → 新键迁移（旧统计归入小鹤）✓')
}

/* 2. 新旧都有：新键优先，不被覆盖 */
{
  const newPrefs = JSON.stringify({ open: false, surface: 'dock', w: 900, scheme: 'abc' })
  const { storage } = mount({
    [NEW_PREF]: newPrefs,
    [OLD_PREF]: JSON.stringify({ open: true, surface: 'float', w: 640 }),
    [NEW_STAT]: JSON.stringify({ v: 2, keys: { z: { n: 1, bad: 0 } }, wrong: {}, base: 420 }),
    [OLD_STAT]: JSON.stringify({ v: 2, keys: { q: { n: 9, bad: 9 } }, wrong: {}, base: 420 }),
  })
  ok(storage.get(NEW_PREF) === newPrefs, '新键数据被旧键覆盖了')
  const newStore = JSON.parse(storage.get(NEW_STAT))
  // 新键里的统计是旧格式（扁平），会归入小鹤桶；关键是它没被 OLD_STAT 覆盖
  const newBucket = newStore.buckets ? newStore.buckets.flypy : newStore
  ok(newBucket && newBucket.keys && newBucket.keys.z && newBucket.keys.z.n === 1, '新统计被旧统计覆盖了')
  console.log('新键优先、不被旧键覆盖 ✓')
}

/* 3. 全新用户：不报错，且注册了组件 */
{
  const { storage, slots } = mount({})
  ok(slots.length > 0, '全新用户场景下插件未注册组件')
  ok(!storage.has(NEW_PREF) || typeof storage.get(NEW_PREF) === 'string', '全新用户初始化异常')
  console.log('全新用户正常初始化 ✓')
}

/* 4. 旧键内容是坏 JSON：不应抛错 */
{
  const { slots } = mount({ [OLD_PREF]: '{not json', [OLD_STAT]: 'also bad' })
  ok(slots.length > 0, '旧键损坏时插件未注册组件')
  console.log('旧键损坏时不影响启动 ✓')
}

console.log(`smoke-migrate: ${checks} 项断言通过`)
