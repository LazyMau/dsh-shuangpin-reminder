const fs = require('fs')
const path = require('path')

const tmp = process.argv[2]
const outFile = process.argv[3]

const template = fs.readFileSync(path.join(tmp, 'client.template.js'), 'utf8')
const dict = fs.readFileSync(path.join(process.env.TEMP, 'xiaohe-data', 'dict-src.txt'), 'utf8').trim()
if (!template.includes('__DICT__')) throw new Error('placeholder missing')
if (/[\r\n']/.test(dict)) throw new Error('dictionary must be a single line without quotes')
const out = template.replace('__DICT__', () => dict)
fs.writeFileSync(outFile, out)
console.log('written', outFile, 'bytes', Buffer.byteLength(out))
