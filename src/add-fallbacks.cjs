/**
 * 给主题变量补兜底色：node src/add-fallbacks.cjs
 *
 * 宿主换主题、或变量改名时，var(--x) 取不到值会让颜色退化成透明/继承，
 * 之前「白底白字」正是这一类。这里把每个变量补上中性兜底色，幂等。
 */
const fs = require('fs')
const path = require('path')

const file = path.join(__dirname, 'client.template.js')
let src = fs.readFileSync(file, 'utf8')

const FALLBACK = {
  '--dsw-alias-bg-layer-1': '#ffffff',
  '--dsw-alias-bg-layer-2': '#f2f4f7',
  '--dsw-alias-border-l1': '#e3e6ea',
  '--dsw-alias-border-l2': '#cfd4da',
  '--dsw-alias-brand-primary': '#2b6cf6',
  '--dsw-alias-label-primary': '#1a1d21',
  '--dsw-alias-label-secondary': '#6b7280',
  '--dsw-alias-state-error-primary': '#d64545',
  '--dsw-alias-state-idle-primary': '#9aa3ad',
  '--dsw-alias-state-success-primary': '#2e9e5b',
  '--dsw-alias-state-warn-primary': '#c98a1b',
}

let total = 0
for (const [name, color] of Object.entries(FALLBACK)) {
  // 只替换「没有兜底」的写法：var(--x)
  const plain = new RegExp('var\\(' + name.replace(/-/g, '\\-') + '\\)', 'g')
  const hits = (src.match(plain) || []).length
  if (hits) {
    src = src.replace(plain, 'var(' + name + ', ' + color + ')')
    total += hits
    console.log(name, '→ 补', hits, '处')
  }
}

fs.writeFileSync(file, src)
console.log('合计补兜底', total, '处')
