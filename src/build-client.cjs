const fs = require('fs')
const path = require('path')

const srcDir = process.argv[2]
const outFile = process.argv[3]

const template = fs.readFileSync(path.join(srcDir, 'client.template.js'), 'utf8')

// 方案数据层：作为独立模块维护，构建时内联进客户端，保证只有一份定义
const schemes = fs.readFileSync(path.join(srcDir, 'schemes.cjs'), 'utf8')
if (!template.includes('__SCHEMES__')) throw new Error('client.template.js 缺少 __SCHEMES__ 占位符')

// 拼音表：默认读 TEMP 下的数据文件，缺失时回退到仓库内的副本
const dictPath = path.join(process.env.TEMP || '', 'xiaohe-data', 'dict-src.txt')
const localDictPath = path.join(srcDir, 'dict-src.txt')
const dictFile = fs.existsSync(dictPath) ? dictPath : localDictPath
const dict = fs.readFileSync(dictFile, 'utf8').trim()
if (!template.includes('__DICT__')) throw new Error('client.template.js 缺少 __DICT__ 占位符')
if (/[\r\n']/.test(dict)) throw new Error('字典必须是单行且不含单引号')

const out = template
  .split('__SCHEMES__').join(schemes)
  .split('__DICT__').join(dict)

// 语法自检：整段作为函数体编译，写入前就能发现语法错误（不执行）
Function(out)

// 文案体检：死字符串与重复 key 都当作构建失败，避免又攒下一堆残留
const { execFileSync } = require('child_process')
try {
  execFileSync(process.execPath, [path.join(__dirname, 'lint-locale.cjs')], { stdio: 'inherit' })
} catch (error) {
  throw new Error('文案体检未通过，先修 lint-locale 报告的问题')
}

fs.writeFileSync(outFile, out)
console.log('written', outFile, 'bytes', Buffer.byteLength(out), '| dict:', path.basename(path.dirname(dictFile)) + '/' + path.basename(dictFile))
