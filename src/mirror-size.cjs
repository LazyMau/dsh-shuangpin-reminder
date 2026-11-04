/**
 * cookie 镜像体检：node src/mirror-size.cjs
 *
 * 背景：localStorage 按端口隔离，而 GUI 端口每次启动会变，所以插件把
 * 统计镜像写进 cookie（cookie 不分端口）。cookie 有严格上限：
 *   - 单条约 4096 字节（含名字）
 *   - 单域条数与总量也有限（各浏览器 4KB~几十 KB 不等）
 *
 * 同时这是隐私敏感点：cookie 会随同源请求自动发送、同域脚本可读，
 * 所以镜像**不应包含用户输入的原文**，只放聚合计数。
 *
 * 本脚本直接从产物里抽取真实实现来算，避免脚本与源码各写一份而漂移。
 */
const fs = require('fs')
const path = require('path')

const artifact = path.join(__dirname, '..', 'client.js')
const src = fs.readFileSync(artifact, 'utf8')

/* 从产物中取出常量，保证检测的是真正生效的值 */
function num(re, label) {
  const m = src.match(re)
  if (!m) throw new Error('产物里找不到 ' + label)
  return Number(m[1])
}
const MIRROR_CHUNK = num(/MIRROR_CHUNK = (\d+)/, '分块大小')
const MIRROR_MAX_CHUNKS = num(/MIRROR_MAX_CHUNKS = (\d+)/, '分块上限')
const NAME_LEN = 'dsh.xiaohe.mirror.0'.length

/* 真实 slimForMirror 的字段集 */
const slimMatch = src.match(/function slimForMirror\(stats\) \{[\s\S]*?\n    \}/)
if (!slimMatch) throw new Error('产物里找不到 slimForMirror')
const slimSrc = slimMatch[0]

const slimForMirror = new Function('return ' + slimMatch[0].replace(/^function slimForMirror/, 'function'))()

/* 构造一份用得比较久的统计 */
function bigStats() {
  const chars = {}
  for (let i = 0; i < 800; i += 1) chars[String.fromCharCode(0x4e00 + i)] = { n: 12, bad: 3, at: 1700000000000 + i }
  const keys = {}
  for (const k of 'abcdefghijklmnopqrstuvwxyz') keys[k] = { n: 40, bad: 9 }
  const bigram = {}
  for (let i = 0; i < 500; i += 1) bigram[String.fromCharCode(0x4e00 + i) + '|' + String.fromCharCode(0x4e01 + i)] = 5
  const wrong = {}
  for (let i = 0; i < 40; i += 1) wrong['a|b' + i] = i
  const events = []
  for (let i = 0; i < 12; i += 1) events.push({ t: 1700000000000 + i, word: '学女说好中间', codes: ['xt', 'nv'], ms: 1200, backs: 1, slow: true })
  const echo = []
  for (let i = 0; i < 12; i += 1) echo.push({ t: 480 + i, d: 'xue' })
  const stalls = []
  for (let i = 0; i < 10; i += 1) stalls.push({ t: 1, word: '学', seq: ['x', 'xue'], backs: 1, ms: 1500 })
  return { v: 2, rev: 3, base: 420, chars, keys, events, echo, stalls, wrong, bigram, lastChar: '情' }
}

const slim = slimForMirror(bigStats())
const json = JSON.stringify(slim)
const encoded = encodeURIComponent(json)
const chunks = Math.ceil(encoded.length / MIRROR_CHUNK)

let fail = 0
console.log('镜像 JSON:', Buffer.byteLength(json), '字节')
console.log('编码后:', Buffer.byteLength(encoded), '字节 →', chunks, '块（上限', MIRROR_MAX_CHUNKS, '块）')
console.log('单条 cookie 最大:', NAME_LEN + 1 + MIRROR_CHUNK, '字节')

if (NAME_LEN + 1 + MIRROR_CHUNK > 4096) {
  console.log('问题：单条 cookie 超过 4096 字节上限')
  fail += 1
}
if (chunks > MIRROR_MAX_CHUNKS) {
  console.log('问题：镜像需要', chunks, '块，超过上限', MIRROR_MAX_CHUNKS, '块 → 会导致镜像完全放弃')
  fail += 1
}
if (Buffer.byteLength(encoded) > 48 * 1024) {
  console.log('问题：镜像总量超过 48KB，多数浏览器存不下')
  fail += 1
}

/* 隐私：镜像字段必须不含用户输入原文 */
const fields = Object.keys(slim)
console.log('\n镜像字段:', fields.join(', '))
const leaks = []
if ('events' in slim) leaks.push('events（输入的词）')
if ('echo' in slim) leaks.push('echo（IME 原始拼音）')
if ('stalls' in slim) leaks.push('stalls（卡壳过程）')
if ('lastChar' in slim) leaks.push('lastChar（最后输入的字）')
if ('chars' in slim) leaks.push('chars（逐字记录）')
if ('bigram' in slim) leaks.push('bigram（字词接续）')
if (leaks.length) {
  console.log('问题：镜像包含用户输入原文 →', leaks.join('、'))
  fail += 1
} else {
  console.log('镜像仅含聚合计数，不含用户输入原文 ✓')
}

console.log(fail ? '\nMIRROR FAIL: ' + fail + ' 项' : '\nMIRROR OK')
process.exitCode = fail ? 1 : 0
