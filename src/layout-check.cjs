/**
 * 记录页布局体检：node src/layout-check.cjs
 *
 * 不渲染真实 DOM，只按 CSS 盒模型估算：给定面板宽度，三栏是否还放得下、
 * 会不会把标题行（页签）顶出可视区。用于防止「记录页撑爆、切不回键位页」。
 */
const fs = require('fs')
const path = require('path')

const cl = fs.readFileSync(path.join(__dirname, '..', 'client.js'), 'utf8')

/* 从产物里取关键尺寸，确保检测的是真正生效的样式 */
function pick(pattern, label) {
  const m = cl.match(pattern)
  if (!m) throw new Error('产物里找不到 ' + label)
  return Number(m[1])
}

const panelMax = (cl.match(/maxHeight: 'calc\(100vh - (\d+)px\)'/) || [])[1]
const colMax = pick(/maxHeight: (\d+), overflowY: 'auto'/, '记录页列高上限')
const wrapFlexBasis = pick(/flex: '1 1 (\d+)px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3/, '三栏基准宽')
const wrapGap = pick(/flexWrap: 'wrap', gap: (\d+)/, '三栏间距')

if (!panelMax) throw new Error('面板没有高度封顶')

/* 估算：面板内边距 12*2 = 24，三栏 gap 两处 */
const inner = (w) => w - 24

function columnsAt(width) {
  const avail = inner(width)
  // 一共就三栏；flex-wrap 决定这些栏排成几列
  return Math.min(3, Math.max(1, Math.floor((avail + wrapGap) / (wrapFlexBasis + wrapGap))))
}

function colWidth(width) {
  const n = columnsAt(width)
  const avail = inner(width)
  return Math.floor((avail - wrapGap * (n - 1)) / n)
}

/* 记录页内容高度估算（三栏版）：进度 24 + 条 8 + 弱键/错键行 5*20 + 卡过的字 2 行 + 三栏 colMax + 清空 24 + 间距 */
function statsHeight(width) {
  const n = columnsAt(width)
  const rows = Math.ceil(3 / n)
  const colsH = rows * colMax + (rows - 1) * wrapGap
  const weakH = 5 * 20 + 20
  const charsH = 2 * 28
  return 24 + 8 + weakH + 30 + charsH + colsH + 30 + 60
}

const widths = [280, 340, 420, 520, 640, 720, 860]
let fail = 0
console.log('面板宽 | 可见列数 | 每列宽 | 记录页估算高')
for (const w of widths) {
  const n = columnsAt(w)
  const cw = colWidth(w)
  const h = statsHeight(w)
  const ok = cw >= 100
  if (!ok) fail += 1
  console.log(
    String(w).padStart(6), '|',
    String(n).padStart(8), '|',
    String(cw).padStart(6), '|',
    String(h).padStart(12),
    ok ? '' : '  ← 列太窄，文字会被省略号吞掉',
  )
}

/* 标题行固定，正文滚动：只要 maxHeight 生效，页签就在视野内 */
const docVh = 900
const panelH = docVh - Number(panelMax)
console.log('\n面板最大高:', panelH, 'px（100vh=' + docVh + '）')
if (panelH < 320) {
  console.log('面板太矮，键盘可能显示不全')
  fail += 1
}

console.log(fail ? '\nLAYOUT FAIL: ' + fail + ' 项' : '\nLAYOUT OK')
process.exitCode = fail ? 1 : 0
