/**
 * 双拼方案数据层（与 UI 无关，可独立 require 测试）
 *
 * 键位表来源：rime 官方双拼方案 schema 的 speller/algebra
 *   double_pinyin_flypy  小鹤双拼
 *   double_pinyin        自然码
 *   double_pinyin_mspy   微软双拼
 *   double_pinyin_abc    智能ABC
 *   double_pinyin_pyjj   拼音加加
 * 按 yaml 里的 xform/derive 规则逐条推导「韵母 → 键位」，见 src/derive-schemes.cjs。
 *
 * zero 字段表示零声母规则：
 *   'natural' 单字母双写（啊 aa）、双字母照全拼（爱 ai）、三字母首字母+键（昂 ah）
 *   'o'       固定 o 前缀 + 韵母键（爱 ol、昂 oh）
 */
var SchemeLib = (function () {
  'use strict'

  var FINAL_ORDER = [
    'a', 'o', 'e', 'i', 'u', 'v',
    'ai', 'ei', 'ao', 'ou', 'an', 'en', 'ang', 'eng', 'er',
    'ia', 'ie', 'iao', 'iu', 'ian', 'in', 'iang', 'ing', 'iong', 'ong',
    'ua', 'uo', 'uai', 'ui', 'uan', 'un', 'uang', 'ue', 've',
  ]
  var FINAL_SET = {}
  FINAL_ORDER.forEach(function (f) { FINAL_SET[f] = true })

  var FINAL_LABEL = { ve: 'üe', v: 'ü' }

  var SCHEMES = {
    flypy: {
      name: '小鹤双拼',
      zero: 'natural',
      initials: { zh: 'v', ch: 'i', sh: 'u' },
      finals: {
        a: 'a', o: 'o', e: 'e', i: 'i', u: 'u', v: 'v',
        ai: 'd', ei: 'w', ao: 'c', ou: 'z', an: 'j', en: 'f',
        ang: 'h', eng: 'g',
        ia: 'x', ie: 'p', iao: 'n', iu: 'q', ian: 'm', in: 'b',
        iang: 'l', ing: 'k', iong: 's', ong: 's',
        ua: 'x', uo: 'o', uai: 'k', ui: 'v', uan: 'r', un: 'y', uang: 'l',
        ue: 't', ve: 't',
      },
    },
    zrm: {
      name: '自然码',
      zero: 'natural',
      initials: { zh: 'v', ch: 'i', sh: 'u' },
      finals: {
        a: 'a', o: 'o', e: 'e', i: 'i', u: 'u', v: 'v',
        ai: 'l', ei: 'z', ao: 'k', ou: 'b', an: 'j', en: 'f',
        ang: 'h', eng: 'g',
        ia: 'w', ie: 'x', iao: 'c', iu: 'q', ian: 'm', in: 'n',
        iang: 'd', ing: 'y', iong: 's', ong: 's',
        ua: 'w', uo: 'o', uai: 'y', ui: 'v', uan: 'r', un: 'p', uang: 'd',
        ue: 't', ve: 't',
      },
    },
    mspy: {
      name: '微软双拼',
      zero: 'o',
      initials: { zh: 'v', ch: 'i', sh: 'u' },
      finals: {
        a: 'a', o: 'o', e: 'e', i: 'i', u: 'u', v: 'y',
        ai: 'l', ei: 'z', ao: 'k', ou: 'b', an: 'j', en: 'f',
        ang: 'h', eng: 'g', er: 'r',
        ia: 'w', ie: 'x', iao: 'c', iu: 'q', ian: 'm', in: 'n',
        iang: 'd', ing: ';', iong: 's', ong: 's',
        ua: 'w', uo: 'o', uai: 'y', ui: 'v', uan: 'r', un: 'p', uang: 'd',
        ue: 't', ve: 't',
      },
    },
    abc: {
      name: '智能ABC',
      zero: 'o',
      initials: { zh: 'a', ch: 'e', sh: 'v' },
      finals: {
        a: 'a', o: 'o', e: 'e', i: 'i', u: 'u', v: 'v',
        ai: 'l', ei: 'q', ao: 'k', ou: 'b', an: 'j', en: 'f',
        ang: 'h', eng: 'g', er: 'r',
        ia: 'd', ie: 'x', iao: 'z', iu: 'r', ian: 'w', in: 'c',
        iang: 't', ing: 'y', iong: 's', ong: 's',
        ua: 'd', uo: 'o', uai: 'c', ui: 'm', uan: 'p', un: 'n', uang: 't',
        ue: 'm', ve: 'm',
      },
    },
    pyjj: {
      name: '拼音加加',
      zero: 'o',
      initials: { zh: 'v', ch: 'u', sh: 'i' },
      finals: {
        a: 'a', o: 'o', e: 'e', i: 'i', u: 'u', v: 'v',
        ai: 's', ei: 'w', ao: 'd', ou: 'p', an: 'f', en: 'r',
        ang: 'g', eng: 't', er: 'q',
        ia: 'b', ie: 'm', iao: 'k', iu: 'n', ian: 'j', in: 'l',
        iang: 'h', ing: 'q', iong: 'y', ong: 'y',
        ua: 'b', uo: 'o', uai: 'x', ui: 'v', uan: 'c', un: 'z', uang: 'h',
        ue: 'x', ve: 'x',
      },
    },
  }

  var DEFAULT_ZERO = 'natural'
  var DEFAULT_INITIALS = { zh: 'v', ch: 'i', sh: 'u' }

  /** 拼音声调字母 → 无调字母 */
  var TONE = {
    'ā': 'a', 'á': 'a', 'ǎ': 'a', 'à': 'a',
    'ē': 'e', 'é': 'e', 'ě': 'e', 'è': 'e', 'ê': 'e',
    'ī': 'i', 'í': 'i', 'ǐ': 'i', 'ì': 'i',
    'ō': 'o', 'ó': 'o', 'ǒ': 'o', 'ò': 'o',
    'ū': 'u', 'ú': 'u', 'ǔ': 'u', 'ù': 'u',
    'ǖ': 'v', 'ǘ': 'v', 'ǚ': 'v', 'ǜ': 'v', 'ü': 'v',
    'ń': 'n', 'ň': 'n', 'ǹ': 'n', 'ḿ': 'm',
  }

  var PINYIN_INITIALS = 'bpmfdtnlgkhjqxrzcsyw'
  var INITIAL_NOTE_ORDER = ['zh', 'ch', 'sh']

  function finalLabel(f) {
    return FINAL_LABEL[f] || f
  }

  /** 校验并规整一份自定义键位表：只保留合法韵母，键位取单个可见字符 */
  function normalizeCustom(raw) {
    var out = { finals: {}, initials: {}, zero: DEFAULT_ZERO }
    if (!raw || typeof raw !== 'object') return out
    var finals = raw.finals && typeof raw.finals === 'object' ? raw.finals : {}
    FINAL_ORDER.forEach(function (final) {
      var key = finals[final]
      if (typeof key === 'string' && key.length === 1) out.finals[final] = key.toLowerCase()
    })
    var initials = raw.initials && typeof raw.initials === 'object' ? raw.initials : {}
    INITIAL_NOTE_ORDER.forEach(function (initial) {
      var key = initials[initial]
      if (typeof key === 'string' && key.length === 1) out.initials[initial] = key.toLowerCase()
    })
    if (raw.zero === 'o' || raw.zero === 'natural') out.zero = raw.zero
    return out
  }

  /** 自定义键位是否可用（至少要覆盖全部韵母） */
  /**
   * 自定义键位是否完整：natural 零声母方案里 er 由零声母规则直接照全拼，
   * 不需要韵母键位；o 打头的方案则每个韵母（含 er）都必须有键。
   */
  function isCustomComplete(custom) {
    if (!custom || !custom.finals) return false
    var zero = custom.zero === 'o' ? 'o' : 'natural'
    for (var i = 0; i < FINAL_ORDER.length; i += 1) {
      var final = FINAL_ORDER[i]
      if (final === 'er' && zero === 'natural') continue
      if (!custom.finals[final]) return false
    }
    return true
  }

  /** 以某内置方案为模板，生成一份可直接编辑的自定义键位 */
  function customFrom(name) {
    var base = SCHEMES[name] || SCHEMES.flypy
    var finals = {}
    FINAL_ORDER.forEach(function (final) { finals[final] = base.finals[final] || '' })
    return { finals: finals, initials: Object.assign({}, base.initials), zero: base.zero, from: base.name }
  }

  /** 解析当前生效方案（含自定义回退） */
  function schemeOf(prefs) {
    var name = prefs && prefs.scheme
    if (name === 'custom') {
      var custom = normalizeCustom(prefs.custom)
      if (isCustomComplete(custom)) {
        return {
          id: 'custom',
          name: '自定义',
          zero: custom.zero,
          initials: Object.assign({}, DEFAULT_INITIALS, custom.initials),
          finals: custom.finals,
        }
      }
    }
    var builtin = SCHEMES[name]
    if (builtin) return Object.assign({ id: name }, builtin)
    return Object.assign({ id: 'flypy' }, SCHEMES.flypy)
  }

  /** 韵母 → 键位（未映射的韵母返回 ''） */
  function finalKey(final, sch) {
    if (!sch || !sch.finals) return ''
    return Object.prototype.hasOwnProperty.call(sch.finals, final) ? sch.finals[final] : ''
  }

  /** 声母 → 键位（单字母声母固定映射到自身） */
  function initialKey(initial, sch) {
    if (sch && sch.initials && Object.prototype.hasOwnProperty.call(sch.initials, initial)) {
      return sch.initials[initial]
    }
    return initial
  }

  /**
   * initial + final → 双拼码；initial 为空表示零声母（各方案规则不同）
   * 返回 '' 表示该韵母在本方案里没有键位。
   *
   * natural 零声母（小鹤/自然码）不依赖韵母表：双字母直接照全拼（爱 ai、安 an、而 er），
   * 所以 er 这类只在零声母出现的韵母无需在 finals 里占一个键位。
   */
  function codeOf(initial, final, sch) {
    if (initial === '' && sch && sch.zero === 'natural') {
      if (final.length === 2) return final
      if (final.length === 1) return final + final
      var head = finalKey(final, sch)
      return head ? final.charAt(0) + head : ''
    }
    var fk = finalKey(final, sch)
    if (!fk) return ''
    if (initial === '') return 'o' + fk
    return initialKey(initial, sch) + fk
  }

  /** 整音节（拼音串）→ 双拼码，无法解析时返回 '' */
  function codeOfPinyin(pinyin, sch) {
    var parsed = parsePinyin(pinyin)
    return parsed ? codeOf(parsed.i, parsed.f, sch) : ''
  }

  /** 键 → 韵母列表（按 FINAL_ORDER 排序，用于键帽显示；ve 与 ue 同键，不重复列出） */
  function reverseFinals(sch) {
    var map = {}
    FINAL_ORDER.forEach(function (final) {
      if (final === 've') return
      var key = finalKey(final, sch)
      if (!key) return
      if (!map[key]) map[key] = []
      map[key].push(final)
    })
    return map
  }

  /** 键 → 声母列表（该键同时作为 zh/ch/sh 的键位时） */
  function reverseInitials(sch) {
    var map = {}
    INITIAL_NOTE_ORDER.forEach(function (initial) {
      var key = initialKey(initial, sch)
      if (!map[key]) map[key] = []
      map[key].push(initial)
    })
    return map
  }

  /** 把带声调的拼音拆成 { i: 声母, f: 韵母 } */
  function parsePinyin(raw) {
    var text = String(raw || '').toLowerCase()
    var plain = ''
    for (var i = 0; i < text.length; i += 1) {
      var ch = text.charAt(i)
      plain += TONE[ch] !== undefined ? TONE[ch] : ch
    }
    plain = plain.replace(/[^a-z]/g, '')
    if (!plain) return null
    var initial = ''
    var rest = plain
    var head = plain.slice(0, 2)
    if (head === 'zh' || head === 'ch' || head === 'sh') {
      initial = head
      rest = plain.slice(2)
    } else if (PINYIN_INITIALS.indexOf(plain.charAt(0)) >= 0) {
      initial = plain.charAt(0)
      rest = plain.slice(1)
    }
    if (!rest) return null
    if (rest === 'u' && 'jqxy'.indexOf(initial) >= 0) rest = 'v'
    if (!FINAL_SET[rest]) return null
    return { i: initial, f: rest }
  }

  /** 预编辑串里最后一个能解析成拼音音节的片段（多音节/带 ' 分隔时取最后一段） */
  function longestSuffixPinyin(value) {
    var text = String(value || '').toLowerCase()
    var lastSeg = text.slice(text.lastIndexOf("'") + 1)
    for (var start = 0; start < lastSeg.length; start += 1) {
      var parsed = parsePinyin(lastSeg.slice(start))
      if (parsed) return parsed
    }
    return null
  }

  /** 把预编辑串按拼音音节贪心切分；complete=false 表示末尾是不完整的音节 */
  function parseSyllables(value, sch) {
    var text = String(value || '').toLowerCase()
    var seg = text.slice(text.lastIndexOf("'") + 1)
    var syllables = []
    var start = 0
    while (start < seg.length) {
      var matched = null
      for (var end = seg.length; end > start; end -= 1) {
        var parsed = parsePinyin(seg.slice(start, end))
        if (parsed) {
          matched = { parsed: parsed, len: end - start }
          break
        }
      }
      if (!matched) break
      syllables.push(matched.parsed)
      start += matched.len
    }
    return {
      syllables: syllables,
      complete: seg.length > 0 && start === seg.length,
      initial: seg.charAt(0),
      sch: sch || null,
    }
  }

  return {
    FINAL_ORDER: FINAL_ORDER,
    FINAL_LABEL: FINAL_LABEL,
    INITIAL_NOTE_ORDER: INITIAL_NOTE_ORDER,
    SCHEMES: SCHEMES,
    DEFAULT_ZERO: DEFAULT_ZERO,
    DEFAULT_INITIALS: DEFAULT_INITIALS,
    finalLabel: finalLabel,
    normalizeCustom: normalizeCustom,
    isCustomComplete: isCustomComplete,
    customFrom: customFrom,
    schemeOf: schemeOf,
    finalKey: finalKey,
    initialKey: initialKey,
    codeOf: codeOf,
    codeOfPinyin: codeOfPinyin,
    reverseFinals: reverseFinals,
    reverseInitials: reverseInitials,
    parsePinyin: parsePinyin,
    longestSuffixPinyin: longestSuffixPinyin,
    parseSyllables: parseSyllables,
  }
})()

if (typeof module === 'object' && module.exports) module.exports = SchemeLib
