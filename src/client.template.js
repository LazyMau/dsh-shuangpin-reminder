__SCHEMES__

window.__ModuleLoader__.load({
  id: '@local/shuangpin-reminder',
  factory(require) {
    const React = require('react')
    const h = React.createElement
    const NS = 'shuangpin-reminder'
    const PREF_KEY = 'dsh.shuangpin-reminder.prefs.v4'
    const STAT_KEY = 'dsh.shuangpin-reminder.stats.v2'
    // 旧包名时期写入的键：首次启动时迁移一次，避免升级丢数据
    const LEGACY_PREF_KEY = 'dsh.xiaohe-shuangpin.prefs.v4'
    const LEGACY_STAT_KEY = 'dsh.xiaohe-shuangpin.stats.v2'

    /* ================= 双拼方案（数据层见 src/schemes.cjs，构建时内联） ================= */
    const FINAL_ORDER = SchemeLib.FINAL_ORDER
    const SCHEMES = SchemeLib.SCHEMES
    const finalLabel = SchemeLib.finalLabel
    const schemeOf = SchemeLib.schemeOf
    const finalKey = SchemeLib.finalKey
    const initialKey = SchemeLib.initialKey
    const codeOf = SchemeLib.codeOf
    const reverseFinals = SchemeLib.reverseFinals
    const reverseInitials = SchemeLib.reverseInitials
    const parsePinyin = SchemeLib.parsePinyin
    const longestSuffixPinyin = SchemeLib.longestSuffixPinyin
    const parseSyllables = SchemeLib.parseSyllables
    const normalizeCustom = SchemeLib.normalizeCustom
    const isCustomComplete = SchemeLib.isCustomComplete
    const customFrom = SchemeLib.customFrom
    const INITIAL_NOTE_ORDER = SchemeLib.INITIAL_NOTE_ORDER
    /** 内置方案顺序（下拉菜单展示顺序） */
    const SCHEME_IDS = ['flypy', 'zrm', 'mspy', 'abc', 'pyjj']

    /** 零声母规则说明文案 */
    function zeroHintFor(sch) {
      if (sch.zero === 'o') {
        return '零声母：先按 o 再按韵母键（爱 o' + finalKey('ai', sch) + '、安 o' + finalKey('an', sch) + '、而 o' + finalKey('er', sch) + '）'
      }
      return '零声母：单字母双写（啊 aa、鹅 ee），双字母照全拼（爱 ai、安 an、而 er），三字母首字母+键（昂 ah）'
    }
    /** 声母规则说明文案 */
    function initialsHintFor(sch) {
      return '声母：' + INITIAL_NOTE_ORDER.map(function (i) {
        return i + '=' + initialKey(i, sch)
      }).join(' · ')
    }

    /* ================= 常用字拼音表（GB2312 一级字表 3755 字） ================= */
    const DICT_SRC = '__DICT__'
    const DICT = (function () {
      const map = new Map()
      const tokens = DICT_SRC.split(' ')
      for (let i = 0; i < tokens.length; i += 1) {
        const token = tokens[i]
        if (token.length > 1) map.set(token.charAt(0), token.slice(1))
      }
      return map
    })()

    function pinyinOf(ch) {
      return DICT.get(ch) || ''
    }

    function codeOfChar(ch, sch) {
      const pinyin = pinyinOf(ch)
      if (!pinyin) return ''
      const parsed = parsePinyin(pinyin)
      return parsed ? codeOf(parsed.i, parsed.f, sch) : ''
    }

    /* ================= 键位表 ================= */
    /**
     * 键位行的物理布局（三行）。键位含义不再写死，而是按当前方案从韵母表反查，
     * 见 buildKeyRows：换方案时键帽上的韵母、示例字、声母标记都会跟着变。
     */
    const KEY_LAYOUT = [
      ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
      ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
      ['Z', 'X', 'C', 'V', 'B', 'N', 'M'],
    ]

    /** 每个韵母配一个常用示例字（与方案无关，仅用于键帽提示） */
    const FINAL_EXAMPLE = {
      a: ['大', 'dà'], o: ['哦', 'ó'], e: ['饿', 'è'], i: ['衣', 'yī'], u: ['书', 'shū'], v: ['女', 'nǚ'],
      ai: ['买', 'mǎi'], ei: ['杯', 'bēi'], ao: ['好', 'hǎo'], ou: ['走', 'zǒu'],
      an: ['看', 'kàn'], en: ['人', 'rén'], ang: ['上', 'shàng'], eng: ['能', 'néng'], er: ['而', 'ér'],
      ia: ['下', 'xià'], ie: ['写', 'xiě'], iao: ['小', 'xiǎo'], iu: ['求', 'qiú'],
      ian: ['天', 'tiān'], in: ['心', 'xīn'], iang: ['想', 'xiǎng'], ing: ['平', 'píng'],
      iong: ['穷', 'qióng'], ong: ['中', 'zhōng'],
      ua: ['花', 'huā'], uo: ['多', 'duō'], uai: ['快', 'kuài'], ui: ['会', 'huì'],
      uan: ['转', 'zhuǎn'], un: ['云', 'yún'], uang: ['双', 'shuāng'], ue: ['学', 'xué'], ve: ['略', 'lüè'],
    }

    /** 按方案生成键帽数据：{ k, f:[韵母], s:声母标记, ex:[{h,p,i,f}] } */
    function buildKeyRows(sch) {
      const byFinal = reverseFinals(sch)
      const byInitial = reverseInitials(sch)
      return KEY_LAYOUT.map(function (letters) {
        return letters.map(function (letter) {
          const key = letter.toLowerCase()
          const finals = byFinal[key] || []
          const initials = byInitial[key] || []
          const ex = []
          finals.forEach(function (final) {
            const sample = FINAL_EXAMPLE[final]
            if (!sample) return
            const parsed = parsePinyin(sample[1])
            if (!parsed) return
            ex.push({ h: sample[0], p: sample[1], i: parsed.i, f: parsed.f, code: codeOf(parsed.i, parsed.f, sch) })
          })
          return {
            k: letter,
            f: finals,
            s: initials.length ? initials.join('/') : '',
            ex: ex,
          }
        })
      })
    }

    /** 练习题库（与方案无关）：每项的 code 在取用时按当前方案计算，见 withCode */
    const DRILL_RAW = [
      ['杯', 'bēi', 'b', 'ei'], ['我', 'wǒ', 'w', 'o'], ['你', 'nǐ', 'n', 'i'],
      ['好', 'hǎo', 'h', 'ao'], ['是', 'shì', 'sh', 'i'], ['不', 'bù', 'b', 'u'],
      ['的', 'de', 'd', 'e'], ['在', 'zài', 'z', 'ai'], ['有', 'yǒu', 'y', 'ou'],
      ['人', 'rén', 'r', 'en'], ['中', 'zhōng', 'zh', 'ong'], ['大', 'dà', 'd', 'a'],
      ['上', 'shàng', 'sh', 'ang'], ['国', 'guó', 'g', 'uo'], ['说', 'shuō', 'sh', 'uo'],
      ['要', 'yào', 'y', 'ao'], ['就', 'jiù', 'j', 'iu'], ['都', 'dōu', 'd', 'ou'],
      ['和', 'hé', 'h', 'e'], ['也', 'yě', 'y', 'e'], ['很', 'hěn', 'h', 'en'],
      ['看', 'kàn', 'k', 'an'], ['想', 'xiǎng', 'x', 'iang'], ['去', 'qù', 'q', 'v'],
      ['会', 'huì', 'h', 'ui'], ['来', 'lái', 'l', 'ai'], ['到', 'dào', 'd', 'ao'],
      ['年', 'nián', 'n', 'ian'], ['能', 'néng', 'n', 'eng'], ['下', 'xià', 'x', 'ia'],
      ['过', 'guò', 'g', 'uo'], ['家', 'jiā', 'j', 'ia'], ['学', 'xué', 'x', 'ue'],
      ['对', 'duì', 'd', 'ui'], ['天', 'tiān', 't', 'ian'], ['只', 'zhǐ', 'zh', 'i'],
      ['多', 'duō', 'd', 'uo'], ['然', 'rán', 'r', 'an'], ['起', 'qǐ', 'q', 'i'],
      ['还', 'hái', 'h', 'ai'], ['成', 'chéng', 'ch', 'eng'], ['用', 'yòng', 'y', 'ong'],
      ['小', 'xiǎo', 'x', 'iao'], ['女', 'nǚ', 'n', 'v'], ['爱', 'ài', '', 'ai'],
      ['安', 'ān', '', 'an'], ['欧', 'ōu', '', 'ou'], ['恩', 'ēn', '', 'en'],
      ['而', 'ér', '', 'er'], ['王', 'wáng', 'w', 'ang'], ['月', 'yuè', 'y', 'ue'],
      ['云', 'yún', 'y', 'un'], ['双', 'shuāng', 'sh', 'uang'], ['转', 'zhuǎn', 'zh', 'uan'],
      ['快', 'kuài', 'k', 'uai'], ['平', 'píng', 'p', 'ing'], ['求', 'qiú', 'q', 'iu'],
      ['春', 'chūn', 'ch', 'un'], ['选', 'xuǎn', 'x', 'uan'], ['穷', 'qióng', 'q', 'iong'],
      ['绿', 'lǜ', 'l', 'v'], ['略', 'lüè', 'l', 've'], ['军', 'jūn', 'j', 'un'],
      ['熊', 'xióng', 'x', 'iong'], ['花', 'huā', 'h', 'ua'], ['写', 'xiě', 'x', 'ie'],
    ]

    /** 给条目补上当前方案的 code；方案里没有该韵母的键位则丢弃 */
    function withCode(list, sch) {
      const out = []
      for (let i = 0; i < list.length; i += 1) {
        const item = list[i]
        const code = codeOf(item.i, item.f, sch)
        if (code.length !== 2) continue
        out.push(Object.assign({}, item, { code: code }))
      }
      return out
    }

    /** 内置练习题库（按方案计算后的结果，调用方按方案缓存） */
    function drillItems(sch) {
      return withCode(DRILL_RAW.map(function (row) {
        return { h: row[0], p: row[1], i: row[2], f: row[3] }
      }), sch)
    }

    /* ================= 文案 ================= */
    const ZH = {
      title: '双拼键位提醒',
      tabMap: '键位',
      tabDrill: '练习',
      tabStats: '记录',
      opacity: '透明度',
      lock: '固定面板（内容可选中）',
      unlock: '解除固定（按住标题栏拖动）',
      toFloat: '切换为浮窗（可拖动）',
      toDock: '嵌入到输入框上方',
      kbShow: '展开双拼键盘',
      kbHide: '收起双拼键盘',
      drillTitle: '按两个键',
      drillFocus: '点这里再按键',
      correct: '正确',
      wrong: '应为',
      next: '下一个',
      restart: '重来',
      reveal: '看一下',
      revealedKeys: '这两个键',
      keyStateBad: '反复出错',
      keyStateWarn: '出过错',
      keyStateWatch: '打得慢（不代表不会）',
      hintCandidates: '可试：',
      hintConfirm: '{f} → {k}',
      autoHint: '卡住就亮键',
      statsLine: '对 {ok} / {total} · 连对 {streak}',
      poolCommon: '常用字',
      poolMine: '我的错字',
      poolEmpty: '还没有卡过的字，先正常打字吧',
      weakTitle: '最容易卡的键',
      weakNone: '样本还不够，多打几个字。',
      progress: '已收集 {n} 字 · 目标 {goal}',
      charsTitle: '卡过的字',
      charsNone: '还没有卡过的字。',
      drillThem: '去练这些',
      recentTitle: '最近输入',
      recentNone: '还没有捕获到输入。',
      echoTitle: '输入法回显采样（最近）',
      echoNone: '还没有回显样本。',
      wrongTitle: '常按错的键',
      wrongRow: '该按 {a}，实按 {b} ×{n}',
      wrongNone: '还没有检测到按键混淆。',
      stallTitle: '卡壳过程（盲试 → 退格）',
      stallNone: '还没有卡壳记录。',
      backTag: '退{n}',
      tryTag: '盲试{n}',
      clear: '清空',
      slow: '慢',
      keyTimes: '{n} 次 · 错 {bad} 次',
      keySlowOnly: '{n} 次 · 慢/改码 {slow} 次，没有明确错',
      dataNote: '只存在本机',
      recordsFor: '记录按方案分开存，这里只算当前方案',
      schemeLabel: '方案',
      schemeCustom: '自定义…',
      customEdit: '改键位',
      customTitle: '自定义键位',
      customHint: '点格子改键',
      customTemplate: '以…为模板',
      customZero: '零声母',
      zeroNatural: '照全拼',
      zeroO: 'o 打头',
      customIncomplete: '还有韵母没配键位',
      customKeys: '已用 {n} 个键',
      customReset: '按当前方案重置',
      customCancel: '取消',
      customApply: '保存并启用',
    }
    const EN = {
      title: 'Shuangpin Keys',
      tabMap: 'Keys',
      tabDrill: 'Drill',
      tabStats: 'Log',
      opacity: 'Opacity',
      lock: 'Pin panel (text selectable)',
      unlock: 'Unpin (drag by the title bar)',
      toFloat: 'Switch to floating window',
      toDock: 'Embed above the composer',
      kbShow: 'Show the Shuangpin keyboard',
      kbHide: 'Hide the Shuangpin keyboard',
      drillTitle: 'Press two keys',
      drillFocus: 'Click here, then type',
      correct: 'Correct',
      wrong: 'Expected',
      next: 'Next',
      restart: 'Restart',
      reveal: 'Show keys',
      revealedKeys: 'These two keys',
      keyStateBad: 'Repeated mistakes',
      keyStateWarn: 'Has had mistakes',
      keyStateWatch: 'Slower (not necessarily unknown)',
      hintCandidates: 'Try: ',
      hintConfirm: '{f} → {k}',
      autoHint: 'Reveal on stall',
      statsLine: 'Right {ok} / {total} · Streak {streak}',
      poolCommon: 'Common',
      poolMine: 'My struggles',
      poolEmpty: 'No struggling characters yet',
      weakTitle: 'Keys you stall on',
      weakNone: 'Not enough samples yet.',
      progress: '{n} characters collected · goal {goal}',
      charsTitle: 'Characters you stalled on',
      charsNone: 'None yet.',
      drillThem: 'Drill these',
      recentTitle: 'Recent input',
      recentNone: 'No typing captured yet.',
      echoTitle: 'IME echo samples (latest)',
      echoNone: 'No echo samples yet.',
      wrongTitle: 'Most-confused keys',
      wrongRow: 'Meant {a}, pressed {b} ×{n}',
      wrongNone: 'No key confusion detected yet.',
      stallTitle: 'Stall traces (blind tries → backspace)',
      stallNone: 'No stall records yet.',
      backTag: '⌫{n}',
      tryTag: 'tries {n}',
      clear: 'Clear',
      slow: 'slow',
      keyTimes: '{n} times · {bad} mistakes',
      keySlowOnly: '{n} times · {slow} slow/fixed, no clear mistakes',
      dataNote: 'local only',
      recordsFor: 'Records are kept per scheme; only the current one is counted here',
      schemeLabel: 'Scheme',
      schemeCustom: 'Custom…',
      customEdit: 'Edit keys',
      customTitle: 'Custom key mapping',
      customHint: 'Click a cell to rebind',
      customTemplate: 'Start from',
      customZero: 'No initial',
      zeroNatural: 'spell out',
      zeroO: 'o prefix',
      customIncomplete: 'Some finals have no key yet',
      customKeys: '{n} keys used',
      customReset: 'Reset from current scheme',
      customCancel: 'Cancel',
      customApply: 'Save & use',
    }
    const FALLBACK = ZH

    /* ================= 本地存储 ================= */
    function loadJSON(key, fallback) {
      try {
        const raw = window.localStorage.getItem(key)
        if (!raw) return fallback
        const value = JSON.parse(raw)
        return value && typeof value === 'object' ? value : fallback
      } catch (error) {
        return fallback
      }
    }
    function saveJSON(key, value) {
      try {
        window.localStorage.setItem(key, JSON.stringify(value))
      } catch (error) {
        /* 隐私模式：只保留内存状态 */
      }
    }

    /* ---------- 跨端口兜底：localStorage 按「协议+主机+端口」隔离，而 GUI 端口每次启动会变。
       把**聚合统计**镜像到 cookie（cookie 不区分端口），换端口首次启动时恢复。
       注意：镜像只放计数，不放用户输入原文，详见 slimForMirror。 ---------- */
    const MIRROR_BASE = 'dsh.shuangpin.mirror.'
    const MIRROR_BASE_LEGACY = 'dsh.xiaohe.mirror.'
    const MIRROR_CHUNK = 3500
    const MIRROR_MAX_CHUNKS = 4
    let mirrorChunks = 0

    /** 仅 https 下加 Secure（http/本地端口的 Secure cookie 会被浏览器直接丢弃） */
    function cookieTail() {
      let secure = ''
      try {
        if (typeof location !== 'undefined' && location && location.protocol === 'https:') secure = '; Secure'
      } catch (error) { /* 取不到 location 就不加 */ }
      return '; path=/; SameSite=Lax' + secure
    }

    function writeMirror(payload) {
      try {
        const encoded = encodeURIComponent(JSON.stringify(payload))
        const chunks = []
        for (let i = 0; i < encoded.length; i += MIRROR_CHUNK) chunks.push(encoded.slice(i, i + MIRROR_CHUNK))
        // 超出预算说明数据异常，宁可放弃镜像也不要写一大堆 cookie
        if (chunks.length > MIRROR_MAX_CHUNKS) return
        const tail = cookieTail()
        for (let i = chunks.length; i < mirrorChunks; i += 1) {
          document.cookie = MIRROR_BASE + i + '=; Max-Age=0' + tail
        }
        mirrorChunks = chunks.length
        chunks.forEach(function (chunk, index) {
          document.cookie = MIRROR_BASE + index + '=' + chunk + '; Max-Age=31536000' + tail
        })
      } catch (error) { /* 隐私/容量问题都不该影响主流程 */ }
    }

    function readMirror() {
      try {
        const raw = String(document.cookie || '')
        const parts = {}
        raw.split(';').forEach(function (piece) {
          const eq = piece.indexOf('=')
          if (eq < 0) return
          const name = piece.slice(0, eq).trim()
          // 新键优先；旧包名时期的键也认，迁移后由 wipeMirror 清掉
          const base = name.indexOf(MIRROR_BASE) === 0
            ? MIRROR_BASE
            : (name.indexOf(MIRROR_BASE_LEGACY) === 0 ? MIRROR_BASE_LEGACY : null)
          if (!base) return
          const index = Number(name.slice(base.length))
          if (!Number.isInteger(index) || index < 0) return
          parts[index] = decodeURIComponent(piece.slice(eq + 1))
        })
        const indexes = Object.keys(parts).map(Number).sort(function (a, b) { return a - b })
        if (!indexes.length) return null
        const value = JSON.parse(indexes.map(function (index) { return parts[index] }).join(''))
        return value && typeof value === 'object' ? value : null
      } catch (error) {
        return null
      }
    }

    function wipeMirror() {
      try {
        const tail = cookieTail()
        // 40 是旧版本用过的高上限：确保旧数据也能被清干净
        for (let i = 0; i < 40; i += 1) {
          document.cookie = MIRROR_BASE + i + '=; Max-Age=0' + tail
        }
        mirrorChunks = 0
      } catch (error) { /* ignore */ }
    }

    /** 旧格式镜像（含用户输入原文）是否还残留在 cookie 里 */
    function readMirrorLegacyLeftover() {
      const mirror = readMirror()
      if (!mirror || !mirror.stats || typeof mirror.stats !== 'object') return false
      const s = mirror.stats
      return Boolean(
        (Array.isArray(s.events) && s.events.length) ||
        (Array.isArray(s.echo) && s.echo.length) ||
        (Array.isArray(s.stalls) && s.stalls.length) ||
        (s.chars && Object.keys(s.chars).length) ||
        (s.bigram && Object.keys(s.bigram).length) ||
        (typeof s.lastChar === 'string' && s.lastChar),
      )
    }

    /**
     * 生成 cookie 镜像的内容。
     *
     * 隐私考虑：cookie 会随同源请求自动发送，且同域任意脚本可读，
     * 不适合承载「用户打过哪些字、哪些拼音」这类原文。因此镜像只保留
     * 恢复统计所需的**聚合计数**（字数、键数、错键次数），
     * 不带 events / echo / stalls / lastChar 这些原文，也不带字数表。
     */
    function slimForMirror(stats) {
      const wrong = {}
      Object.keys(stats.wrong || {})
        .sort(function (a, b) { return (stats.wrong[b] || 0) - (stats.wrong[a] || 0) })
        .slice(0, 30).forEach(function (key) { wrong[key] = stats.wrong[key] })
      const keys = {}
      Object.keys(stats.keys || {}).forEach(function (key) {
        const row = stats.keys[key]
        if (!row) return
        keys[key] = { n: row.n || 0, bad: row.bad || 0 }
      })
      return {
        v: stats.v,
        rev: stats.rev,
        base: stats.base,
        keys: keys,
        wrong: wrong,
      }
    }

    /**
     * 镜像的完整内容：统计分方案存，所以必须带上方案，否则换端口恢复时
     * 会把某个方案的数据塞进另一个方案下。只镜像当前方案那一桶，控制体积。
     */
    function mirrorPayload(statsStore, bucketId) {
      return {
        v: 3,
        active: bucketId,
        stats: slimForMirror(statsStore.buckets[bucketId] || normalizeStats(null)),
      }
    }

    const DEFAULT_PREFS = {
      open: false, surface: 'dock', x: null, y: null, w: 520, opacity: 0.95, locked: false,
      tab: 'map', autoHint: true, hints: false, pool: 'common',
      // 方案：内置 id 或 'custom'；custom 为 { finals, initials, zero }
      scheme: 'flypy',
      custom: null,
    }
    const MIN_W = 340
    const MAX_W = 1720

    /** 旧扁平统计（无方案信息）归属于哪个方案：那时默认且几乎都是小鹤 */
    const LEGACY_STATS_SCHEME = 'flypy'

    /** 把任意历史形态的统计读成 { v, active, buckets }；每个方案一个桶 */
    function normalizeStatsStore(raw, activeId) {
      const out = { v: 3, active: activeId, buckets: {} }
      if (!raw || typeof raw !== 'object') return out
      if (raw.buckets && typeof raw.buckets === 'object') {
        Object.keys(raw.buckets).forEach(function (id) {
          if (!id) return
          out.buckets[id] = normalizeStats(raw.buckets[id])
        })
        if (typeof raw.active === 'string' && raw.active) out.active = raw.active
        // 修复标记要一起读出来，否则每次启动都会重复搬运
        if (raw.v3fixed) out.v3fixed = true
        return out
      }
      // v2 及更早：只有一份全局统计，没有记录它属于哪个方案。
      // 那时候插件还叫「小鹤双拼提醒」、默认方案固定是小鹤，所以归到小鹤最接近事实；
      // 若归给「升级那一刻停留的方案」，用户切过方案再重启就会出现小鹤的数据
      // 跑到别的方案里——这正是把旧数据误当成当前方案数据的原因。
      if (raw.chars || raw.keys || raw.events || raw.base) {
        const legacyId = LEGACY_STATS_SCHEME
        out.buckets[legacyId] = normalizeStats(raw)
        // 当前停留的方案不是小鹤时，仍把 active 指回当前方案，
        // 这样界面不会莫名跳回小鹤；旧数据留在小鹤桶里，切过去才看得到
        out.legacyFrom = legacyId
      }
      return out
    }

    /**
     * 修复中间版本留下的错放：那一版把「没有方案信息的旧统计」归给了升级时
     * 停留的方案。特征是「小鹤桶是空的，而某个别的方案桶里却有数据」。
     * 把那个桶挪回小鹤，只搬一次（搬完打标记）。
     */
    function repairMisplacedLegacy(store) {
      try {
        if (!store || !store.buckets || store.v3fixed) return false
        const flypy = store.buckets[LEGACY_STATS_SCHEME]
        const flypyHas = flypy && Object.keys(flypy.chars || {}).length > 0
        if (flypyHas) { store.v3fixed = true; return false }
        const donors = Object.keys(store.buckets).filter(function (id) {
          if (id === LEGACY_STATS_SCHEME) return false
          const b = store.buckets[id]
          return b && Object.keys(b.chars || {}).length > 0
        })
        // 只有一个别的方案有数据，才可能是错放；多个都有说明用户真用过那些方案
        if (donors.length === 1) {
          store.buckets[LEGACY_STATS_SCHEME] = store.buckets[donors[0]]
          delete store.buckets[donors[0]]
          store.v3fixed = true
          return true
        }
        store.v3fixed = true
        return false
      } catch (error) {
        return false
      }
    }

    /** 方案 id → 统计桶 id */
    function schemeBucketId(prefs) {
      const id = prefs && prefs.scheme
      return typeof id === 'string' && id ? id : 'flypy'
    }

    function normalizeStats(raw) {
      const out = {
        v: 2, rev: 0, chars: {}, keys: {}, events: [], echo: [],
        stalls: [], wrong: {}, bigram: {}, lastChar: '', base: 420, rules: {},
      }
      if (!raw || typeof raw !== 'object') return out
      if (raw.chars && typeof raw.chars === 'object') {
        Object.keys(raw.chars).forEach(function (ch) {
          out.chars[ch] = normalizeCharEntry(raw.chars[ch])
        })
      }
      if (raw.keys && typeof raw.keys === 'object') {
        Object.keys(raw.keys).forEach(function (k) {
          out.keys[k] = normalizeKeyEntry(raw.keys[k])
        })
      }
      if (raw.rules && typeof raw.rules === 'object') {
        Object.keys(raw.rules).forEach(function (id) {
          out.rules[id] = normalizeRule(raw.rules[id])
        })
      }
      if (Array.isArray(raw.events)) out.events = raw.events.slice(0, 30)
      if (Array.isArray(raw.echo)) out.echo = raw.echo.slice(0, 30)
      if (Array.isArray(raw.stalls)) out.stalls = raw.stalls.slice(0, 20)
      if (raw.wrong && typeof raw.wrong === 'object') out.wrong = raw.wrong
      if (raw.bigram && typeof raw.bigram === 'object') out.bigram = raw.bigram
      if (typeof raw.lastChar === 'string') out.lastChar = raw.lastChar
      if (typeof raw.base === 'number' && raw.base > 0) out.base = raw.base
      return out
    }

    /**
     * 字符条目的字段语义（三种证据分开记，不要混成一个 bad）：
     *   n    出现次数
     *   bad  明确答错次数（练习答错）—— 只有它直接推动「弱键」
     *   slow 比基线慢的次数 —— 单独的「待观察」信号
     *   fix  退格改码次数 —— 弱于 bad 的改错证据
     *   hint 看过提示后才答对的次数
     *
     * 旧数据只有一个 bad，它混了「慢」在里面。迁移时把旧 bad 记为 slow，
     * 而不是当成明确错误——否则老用户升级后所有键都会被判成不会打。
     */
    function normalizeCharEntry(entry) {
      if (!entry || typeof entry !== 'object') return { n: 0, ms: 0, bad: 0, slow: 0, fix: 0, hint: 0, at: 0 }
      const hasEvidence = typeof entry.slow === 'number' || typeof entry.fix === 'number'
        || typeof entry.explicit === 'boolean'
      const legacyBad = Number(entry.bad) || 0
      return {
        n: Number(entry.n) || 0,
        ms: Number(entry.ms) || 0,
        // 有 slow/fix 字段 = 新格式，bad 就是真正的答错
        // 没有 = 旧格式，旧 bad 混了慢，按慢处理
        bad: hasEvidence ? (Number(entry.bad) || 0) : 0,
        slow: hasEvidence ? (Number(entry.slow) || 0) : legacyBad,
        fix: Number(entry.fix) || 0,
        hint: Number(entry.hint) || 0,
        at: Number(entry.at) || 0,
      }
    }

    /** 键级条目：同样把「明确错误」与「慢/改码」分开 */
    function normalizeKeyEntry(entry) {
      if (!entry || typeof entry !== 'object') return { n: 0, bad: 0, slow: 0, fix: 0, hint: 0, ok: 0 }
      const hasEvidence = typeof entry.slow === 'number' || typeof entry.fix === 'number'
      const legacyBad = Number(entry.bad) || 0
      return {
        n: Number(entry.n) || 0,
        bad: hasEvidence ? (Number(entry.bad) || 0) : 0,
        slow: hasEvidence ? (Number(entry.slow) || 0) : legacyBad,
        fix: Number(entry.fix) || 0,
        hint: Number(entry.hint) || 0,
        // ok = 这个键「顺利打对」的次数，用来判断熟练度并逐步淡化提示。
        // 旧数据没有这个字段，从 0 开始累计即可，不需要迁移。
        ok: Number(entry.ok) || 0,
      }
    }

    /**
     * 规则级记忆：真正该被记住的不是「P 这个物理键」，而是「ie 落在 P」这条规则。
     *
     * 为什么必须是规则：
     *   同一个键在小鹤里承载多个韵母（如 ong/iong 共用），
     *   你「P 上打 iu 很熟」不代表「P 上打 ie 也熟」。
     *   如果按物理键合并熟练度，ie 这条规则会被 iu 的成功记录掩盖，永远淡不掉或永远亮着。
     *   反过来，「些」上的纠正也应该能帮到「写」，因为它们共用 ie → P 这条规则。
     *
     * 存什么：
     *   n        遇到次数
     *   solo     提示出现前就独立完成
     *   helped   提示已经显示后完成（≈ 辅助完成，不能算掌握）
     *   conf     被确认纠正过几次
     *   wrong    和哪些规则混淆过（规则 id → 次数）
     *   lastAt   最后一次纠正的时间，用来做隔天复验
     */
    function normalizeRule(entry) {
      const out = { n: 0, solo: 0, helped: 0, conf: 0, wrong: {}, lastAt: 0 }
      if (!entry || typeof entry !== 'object') return out
      out.n = Number(entry.n) || 0
      out.solo = Number(entry.solo) || 0
      out.helped = Number(entry.helped) || 0
      out.conf = Number(entry.conf) || 0
      out.lastAt = Number(entry.lastAt) || 0
      if (entry.wrong && typeof entry.wrong === 'object') {
        Object.keys(entry.wrong).forEach(function (id) {
          const v = Number(entry.wrong[id]) || 0
          if (v > 0) out.wrong[id] = v
        })
      }
      return out
    }

    /** 规则 id：方案 + 种类(f=韵母 / i=声母) + 具体拼音单位 */
    function ruleIdOf(schemeId, kind, unit) {
      return String(schemeId || '') + '|' + kind + '|' + String(unit || '')
    }

    function ruleOf(stats, schemeId, kind, unit) {
      const rules = (stats && stats.rules) || {}
      return rules[ruleIdOf(schemeId, kind, unit)] || null
    }

    /**
     * 提示档位，唯一的升级依据是「提示出现前能不能自己完成」。
     *
     *   2 = 明确提示（正确键 + 候选字）
     *   1 = 只给位置（淡环，不给答案）
     *   0 = 不再自动提示（保留主动查看）
     *
     * 关键取舍：
     *   1. 累计打对次数不能作为依据——没有错误时，一次打对就能算出很高的熟练度，
     *      而且历史成功很多会掩住「最近又卡了」。
     *   2. 提示已经显示过之后才打对，只能算辅助完成（helped），不能算独立掌握。
     *      网页没法知道你到底看没看，所以按最保守的方式：显示过就算辅助。
     *   3. 最近又发生纠正 → 立刻恢复帮助。
     */
    function ruleLevel(rule) {
      if (!rule) return 2                    // 新规则：给足帮助
      const since = Math.max(0, (rule.solo || 0) - (rule.conf || 0) * 2)
      if (rule.conf > 0 && since < 3) return 2   // 刚纠正过，还没证明能独立
      if (rule.helped > 0 && since < 6) return 1 // 还需要帮助，但降级为只给位置
      if (since >= 10) return 0                  // 独立完成足够多，退出
      if (since >= 5) return 1
      return 2
    }

    /** 从旧包名的存储键迁移一次；新键已有数据时不动 */
    function migrateLegacyKeys() {
      try {
        if (!window.localStorage.getItem(PREF_KEY)) {
          const old = window.localStorage.getItem(LEGACY_PREF_KEY)
          if (old) window.localStorage.setItem(PREF_KEY, old)
        }
        if (!window.localStorage.getItem(STAT_KEY)) {
          const old = window.localStorage.getItem(LEGACY_STAT_KEY)
          if (old) window.localStorage.setItem(STAT_KEY, old)
        }
      } catch (error) { /* 隐私模式：忽略 */ }
    }

    function createStore() {
      migrateLegacyKeys()
      let storedPrefs = loadJSON(PREF_KEY, null)
      let storedStats = loadJSON(STAT_KEY, null)
      if (!storedStats) {
        const mirror = readMirror()
        if (mirror && mirror.stats && typeof mirror.stats === 'object') {
          // 老镜像没有 active：当时是全局一份，按当前方案归档
          const activeId = typeof mirror.active === 'string' && mirror.active
            ? mirror.active
            : schemeBucketId(Object.assign({}, DEFAULT_PREFS, storedPrefs || {}))
          const restored = { v: 3, active: activeId, buckets: {} }
          restored.buckets[activeId] = mirror.stats
          saveJSON(STAT_KEY, restored)
          storedStats = restored
        }
      }
      // 旧版本的镜像里带有用户输入原文（events/echo/stalls/lastChar）。
      const prefs = Object.assign({}, DEFAULT_PREFS, storedPrefs || {})
      const bucketId = schemeBucketId(prefs)
      const statsStore = normalizeStatsStore(storedStats, bucketId)
      // 中间版本曾把旧统计错放到「升级时停留的方案」下，这里挪回小鹤
      const repaired = repairMisplacedLegacy(statsStore)
      if (!statsStore.buckets[bucketId]) statsStore.buckets[bucketId] = normalizeStats(null)
      statsStore.active = bucketId
      // 迁移/修复后立刻落盘，否则每次启动都要重算，中途崩溃还可能丢数据
      if (repaired || (storedStats && !storedStats.buckets)) saveJSON(STAT_KEY, statsStore)
      // 升级后立刻重写一次镜像，把旧格式（含用户输入原文、无方案信息）清掉
      if (readMirrorLegacyLeftover()) writeMirror(mirrorPayload(statsStore, bucketId))
      const state = {
        prefs: prefs,
        // 统计按方案分桶：state.stats 始终指向「当前方案」那一桶，
        // 这样所有读取点都不用改，切换方案时记录也跟着切换
        statsStore: statsStore,
        ui: { live: null, anchor: null, customOpen: false },
      }
      Object.defineProperty(state, 'stats', {
        enumerable: true,
        get: function () {
          const id = schemeBucketId(state.prefs)
          if (!statsStore.buckets[id]) statsStore.buckets[id] = normalizeStats(null)
          statsStore.active = id
          return statsStore.buckets[id]
        },
      })
      const listeners = new Set()
      let saveTimer = null
      function save() {
        saveJSON(PREF_KEY, state.prefs)
        saveJSON(STAT_KEY, statsStore)
        writeMirror(mirrorPayload(statsStore, schemeBucketId(state.prefs)))
      }
      function notify() {
        listeners.forEach(function (fn) { fn() })
      }
      function touch() {
        if (saveTimer === null) {
          saveTimer = window.setTimeout(function () {
            saveTimer = null
            save()
          }, 500)
        }
        notify()
      }
      return {
        state: state,
        touch: touch,
        notify: notify,
        save: save,
        subscribe: function (fn) {
          listeners.add(fn)
          return function () { listeners.delete(fn) }
        },
      }
    }

    /* ================= 统计 ================= */
    function pruneChars(chars) {
      const keys = Object.keys(chars)
      if (keys.length <= 1200) return
      keys.sort(function (a, b) { return (chars[a].at || 0) - (chars[b].at || 0) })
      for (let i = 0; i < keys.length - 1200; i += 1) delete chars[keys[i]]
    }

    const MIN_SAMPLE = 2

    /** 输入法回显采样：记录每次 compositionupdate 的原文和相对合成开始的毫秒数 */
    function pushEcho(store, elapsed, data) {
      const st = store.state.stats
      st.echo = st.echo || []
      st.echo.unshift({ t: Math.round(elapsed), d: String(data).slice(0, 24) })
      if (st.echo.length > 30) st.echo.length = 30
    }

    /**
     * 从预编辑轨迹里推断「按键混淆」：
     * 轨迹中一旦出现变短（退格），被删掉的后缀就是按错的键；
     * 用「退格前的状态」解析出当时按到的韵母键，和最终上屏音节的正确键对比。
     * 仅在输入法预编辑暴露拼音时可用（码类预编辑解析不出拼音，只留轨迹）。
     *
     * 用完整双拼码的第二个字符比较，零声母音节（爱 ai、而 er）也因此能正确归因。
     */
    /**
     * 从预编辑轨迹里提取「同一个音节位置上的纠正」。
     *
     * 严格到什么程度才算一次纠正：必须同时满足
     *   1. 能对齐到**同一个音节位置**（同一个已完成的字前缀 + 同一个声母）
     *   2. 那次尝试确实被**撤销或替换**了（后面出现了不是它「延长」的状态）
     *   3. 被替换成的韵母和最终答案不同
     *
     * 为什么第 2 条是必须的：
     *   正常输入 xian 时中间一定会出现 x、xi、xia。
     *   它们不是「打错又改回来」，只是还没打完。
     *   旧实现把「试过的韵母和最终不同」一律算错，
     *   于是每一次正常输入都会凭空产生好几个错键，弱键率完全失真。
     *
     * 宁可不归因：解析不出是哪个韵母就跳过，留作观察（stalls 已经记了整条轨迹）。
     * 错的归因比没有归因更糟——它会把你本来会打的键标成不会。
     */
    function samePositionCorrections(trace, targetValue, sch) {
      const out = []
      if (!targetValue || !trace || trace.length < 2) return out
      const target = longestSuffixPinyin(targetValue)
      if (!target) return out
      const targetCode = codeOf(target.i, target.f, sch)
      if (targetCode.length !== 2) return out
      const targetKey = targetCode.charAt(1)

      // 目标音节在原文里的文本形态（如 xie），它前面就是已完成的字
      const sylText = target.i + target.f
      const lower = String(targetValue).toLowerCase()
      if (!sylText || lower.slice(lower.length - sylText.length) !== sylText) return out
      const prefix = lower.slice(0, lower.length - sylText.length)

      // rest = 目标音节那一段，从声母开始
      function restOf(value) {
        const v = String(value || '').toLowerCase()
        if (prefix && v.slice(0, prefix.length) !== prefix) return null
        const rest = v.slice(prefix.length)
        if (!rest || rest.charAt(0) !== target.i) return null
        return rest
      }

      // 从 rest 里取出「这次尝试的韵母」；取不出就不下结论
      function finalOf(rest) {
        if (!rest) return null
        let mat = rest.slice(target.i.length)
        if (mat.charAt(0) === "'") mat = mat.slice(1)
        if (!mat) return null
        return FINAL_ORDER.indexOf(mat) >= 0 ? mat : null
      }

      const entries = trace.concat([targetValue])
      const rests = entries.map(restOf)

      const seen = {}
      for (let i = 0; i < rests.length - 1; i += 1) {
        const rest = rests[i]
        if (!rest) continue
        const attempted = finalOf(rest)
        if (!attempted || attempted === target.f) continue
        // 「被撤销」的判定：必须是这一段的**局部最长点**，且紧接着变短。
        //
        // 为什么不能只看「后面有状态不是它的延长」：
        //   退格本身会产生一串越来越短的中间态（xian → xi → x），
        //   那样会把 xian、xi 全部记成尝试，一次退格凭空多出好几个错键。
        // 为什么不能只看「紧接着变短」：
        //   退格链里的每个节点都满足，同样会重复计数。
        // 两个条件一起用，才只剩「打完一段、随后被删或改写」的那一个点：
        //   x, xi, xia, xian, xi, x  → 只有 xian 记为尝试
        //   na'x, na'xie, na'x, na'x'ian, na'x  → 只有 ian 记为尝试
        const restLen = rest.length
        const nextRest = rests[i + 1]
        if (nextRest === null || nextRest.length >= restLen) continue
        if (i > 0 && rests[i - 1] !== null && rests[i - 1].length > restLen) continue
        const code = codeOf(target.i, attempted, sch)
        if (code.length !== 2) continue
        const key = code.charAt(1)
        if (key === targetKey) continue
        if (seen[key]) continue
        seen[key] = true
        out.push({
          correct: targetKey,
          pressed: key,
          initial: target.i,
          correctFinal: target.f,
          pressedFinal: attempted,
        })
      }
      return out
    }

    /** 字级二元统计：上一个字 → 下一个最可能打的字 */
    function predictNext(stats, prefs, fromChar) {
      if (!fromChar) return []
      const sch = schemeOf(prefs)
      const bigram = stats.bigram || {}
      const out = []
      const seen = {}
      for (const key in bigram) {
        if (key.length === 2 && key.charAt(0) === fromChar) {
          seen[key.charAt(1)] = true
          out.push({ ch: key.charAt(1), n: bigram[key], seed: false })
        }
      }
      const seeds = SEED_NEXT[fromChar]
      if (seeds) {
        for (let i = 0; i < seeds.length && out.length < 6; i += 1) {
          const ch = seeds.charAt(i)
          if (!seen[ch]) {
            seen[ch] = true
            out.push({ ch: ch, n: 1, seed: true })
          }
        }
      }
      out.sort(function (a, b) { return (Number(a.seed) - Number(b.seed)) || (b.n - a.n) })
      return out.slice(0, 3).map(function (item) {
        const pinyin = pinyinOf(item.ch)
        const parsed = parsePinyin(pinyin)
        return { ch: item.ch, p: pinyin, code: parsed ? codeOf(parsed.i, parsed.f, sch) : '' }
      }).filter(function (item) { return item.code.length === 2 })
    }

    /* 常用接续兜底：个人统计不足时先给通用候选（字 → 常见下一位，按序） */
    const SEED_NEXT = {
      '学': '生习科会员术者',
      '我': '们是就也没在都想',
      '你': '们说想是要的好',
      '他': '们说是的有不在',
      '她': '说的在有们',
      '它': '们的在有',
      '这': '个样里么些种是次点',
      '那': '个么里些时边就',
      '什': '么',
      '怎': '么样',
      '为': '什么了',
      '因': '为',
      '所': '以有',
      '但': '是愿',
      '如': '果',
      '可': '以能是爱',
      '现': '在',
      '时': '候间',
      '问': '题候',
      '工': '作具',
      '一': '个些定起直边半',
      '不': '同过能错是要好',
      '很': '多好快',
      '都': '是在要会',
      '也': '就是没许可',
      '还': '是有没',
      '人': '们员工',
      '上': '面午级去来',
      '下': '面午次来载一个',
      '前': '面后',
      '后': '面果来',
      '开': '始会发',
      '已': '经',
      '没': '有关',
      '会': '有议话',
      '用': '户来',
      '文': '件字',
      '第': '一二三',
      '每': '天个',
      '天': '天气',
      '好': '的像吧',
    }

    /* 按声母分组的常用字（越靠前越常用），用于「打了声母还没打韵母」时的框选提示 */
    const COMMON_BY_INITIAL = {
      b: '不本比把办报表被变必须并',
      p: '平片篇普跑品派',
      m: '们没每么面美明名目马买卖',
      f: '放分反法发服非否',
      d: '的大到地对都但得当东第动点定读',
      t: '天他太同条头听提体',
      n: '你那年能内难南',
      l: '了来里两老路类立力论',
      g: '个国给过高工公该跟更关',
      k: '可看开空口课快卡',
      h: '很好和还回会海红话活',
      j: '就家见叫件进将建今级假',
      q: '请去前起强全亲气青轻',
      x: '下行想小先现新相写信学选需系线修星西向',
      r: '人然让日如任认',
      z: '在走最作自字早再怎总',
      c: '从次才层错参此词',
      s: '是三所思四速搜送色',
      zh: '这中真只张周纸至',
      ch: '出常成龙吃车',
      sh: '是上谁山少社深生',
      y: '要也有于一用又因应云',
    }

    function recordCommit(store, text, ms, backs, extra) {
      const info = extra || {}
      const chars = Array.from(String(text || '')).filter(function (ch) {
        return /[\u3400-\u9fff]/.test(ch)
      })
      if (!chars.length) return
      const st = store.state.stats
      const unit = Math.max(40, Math.min(8000, ms / Math.max(1, chars.length)))
      st.base = Math.max(140, Math.min(1600, st.base * 0.85 + unit * 0.15))
      const slow = unit > st.base * 1.5 + 120 || backs >= 2
      // 慢 与 错 是两种证据，分开记：
      //   slow  = 这次比自己的基线慢（可能只是走神/在想内容，不代表不会打）
      //   backs = 按了退格，说明改过码（弱一些的证据，可能是手滑）
      //   bad   = 明确答错（来自练习），只有它才直接推动「弱键」
      // 旧数据只有 bad，迁移时按慢处理，避免把历史误当明确错误。
      const slowOnly = slow
      const sch = schemeOf(store.state.prefs)
      const schemeId = schemeBucketId(store.state.prefs)
      const shown = (store.state.ui && store.state.ui.shownRules) || {}
      st.rules = st.rules || {}

      // 已确认的纠正（同一音节位置上被撤销或替换过），只作用于最后一个音节
      const confusions = info.confusions || []
      const correctedFinal = confusions.length ? String(confusions[0].correctFinal || '') : ''

      /**
       * 登记一条规则的「这次表现」。
       * 只有被确认纠正的规则记 conf，其余算 solo 或 helped，
       * 而 helped 不能推动淡化——这是整套渐退机制的前提。
       */
      function markRule(kind, unit, corrected) {
        if (!unit) return
        const id = ruleIdOf(schemeId, kind, unit)
        const rule = st.rules[id] || (st.rules[id] = normalizeRule(null))
        rule.n += 1
        if (corrected) {
          rule.conf += 1
          rule.lastAt = Date.now()
        } else if (shown[id]) {
          rule.helped += 1
        } else {
          rule.solo += 1
        }
      }

      const codes = []
      for (let i = 0; i < chars.length; i += 1) {
        const ch = chars[i]
        const code = codeOfChar(ch, sch)
        codes.push(code.length === 2 ? code : null)
        if (code.length !== 2) continue
        const entry = st.chars[ch] || (st.chars[ch] = normalizeCharEntry(null))
        entry.n += 1
        entry.ms += unit
        entry.at = Date.now()
        if (slowOnly) entry.slow = (entry.slow || 0) + 1
        if (backs >= 2) entry.fix = (entry.fix || 0) + 1
        // 规则级：声母规则与韵母规则分别记账。
        // 纠正只可能落在最后一个音节上，所以这里先按「没被纠正」记，
        // 下面再针对最后一个字的韵母规则单独修正。
        const py = pinyinOf(ch)
        const parsed = py ? parsePinyin(py) : null
        if (parsed) {
          markRule('i', parsed.i, false)
          // 纠正只可能落在最后一个音节的韵母上
          const isLast = i === chars.length - 1
          markRule('f', parsed.f, Boolean(isLast && correctedFinal && parsed.f === correctedFinal))
        }
        // 顺利打对（不慢、没退格）才累积熟练度：
        // 熟练度决定提示要不要淡化，所以只认「干净的一次」，
        // 卡了半天最后打对不算练熟。
        if (!slowOnly && !backs) {
          const k1 = code.charAt(0)
          const k2 = code.charAt(1)
          const e1 = st.keys[k1] || (st.keys[k1] = normalizeKeyEntry(null))
          const e2 = st.keys[k2] || (st.keys[k2] = normalizeKeyEntry(null))
          e1.ok = (e1.ok || 0) + 1
          e2.ok = (e2.ok || 0) + 1
        }
      }
      st.events.unshift({
        t: Date.now(), word: chars.slice(0, 12).join(''), codes: codes,
        ms: Math.round(ms), slow: slow, backs: backs || 0,
        // 记下这次被纠正的韵母，上屏反馈只确认这一个位置
        correctedFinal: correctedFinal || '',
      })
      if (st.events.length > 30) st.events.length = 30

      // 盲试 → 退格 → 重试 的完整记录
      const shrinks = info.shrinks || 0
      if ((backs > 0 || shrinks > 0) && info.trace && info.trace.length > 1) {
        st.stalls = st.stalls || []
        st.stalls.unshift({
          t: Date.now(),
          word: chars.slice(0, 6).join(''),
          seq: info.trace,
          backs: backs || 0,
          shrinks: shrinks,
          ms: Math.round(ms),
        })
        if (st.stalls.length > 20) st.stalls.length = 20
        ;(info.confusions || []).forEach(function (pair) {
          const key = pair.correct + '|' + pair.pressed
          st.wrong[key] = (st.wrong[key] || 0) + 1
        })
        // 退格能推断出「该按哪个键、实际按了哪个键」时，这就是一次明确打错：
        // 把错误记到**正确的那个键**上（我们要回答的是「这个键的规则你掌握了吗」，
        // 不是「这个物理键被误触了几次」）。推断不出来的退格只留 fix，不升级为错。
        if ((info.confusions || []).length) {
          ;(info.confusions || []).forEach(function (pair) {
            const correctKey = String(pair.correct || '').toLowerCase()
            if (!correctKey) return
            const entry = st.keys[correctKey] || (st.keys[correctKey] = normalizeKeyEntry(null))
            entry.bad = (entry.bad || 0) + 1
          })
          // 字符级也记一次：这样这个字会进「我的错字」题库
          const lastCh = chars[chars.length - 1]
          if (lastCh) {
            const ce = st.chars[lastCh] || (st.chars[lastCh] = normalizeCharEntry(null))
            ce.bad = (ce.bad || 0) + 1
          }
          // 规则级：把「ie 和 ian 混过」这种关系记到正确规则名下，
          // 下次在同一个声母后犹豫时，就可以只突出正确位置。
          if (correctedFinal) {
            const correctId = ruleIdOf(schemeId, 'f', correctedFinal)
            const rule = st.rules[correctId]
            if (rule) {
              confusions.forEach(function (pair) {
                const wrongId = ruleIdOf(schemeId, 'f', pair.pressedFinal)
                if (wrongId === correctId) return
                rule.wrong[wrongId] = (rule.wrong[wrongId] || 0) + 1
              })
            }
          }
        }
      }

      // 字级二元：上一个字 → 下一个字（用于「下一个可能打什么」）
      st.bigram = st.bigram || {}
      const seq = []
      if (info.chained && st.lastChar && /[\u3400-\u9fff]/.test(st.lastChar)) seq.push(st.lastChar)
      chars.forEach(function (ch) { seq.push(ch) })
      for (let i = 0; i + 1 < seq.length; i += 1) {
        const pair = seq[i] + seq[i + 1]
        st.bigram[pair] = (st.bigram[pair] || 0) + 1
      }
      st.lastChar = seq[seq.length - 1] || st.lastChar
      const names = Object.keys(st.bigram)
      if (names.length > 600) {
        names.sort(function (a, b) { return st.bigram[a] - st.bigram[b] })
        for (let i = 0; i < names.length - 500; i += 1) delete st.bigram[names[i]]
      }

      pruneChars(st.chars)
      st.rev = (st.rev || 0) + 1
      store.touch()
    }

    /** 当前方案的显示名，用于「记录属于哪个方案」的标记 */
    function schemeLabelOf(prefs, t) {
      const id = schemeBucketId(prefs)
      if (id === 'custom') return t('schemeCustom').replace(/…$/, '')
      const built = SCHEMES[id]
      return built ? built.name : id
    }

    /**
     * 每个键的多种证据分开累积：
     *   n    出现次数
     *   bad  明确答错（只有练习能给出）—— 推动「弱键」
     *   slow 比基线慢 —— 单独的「待观察」
     *   fix  退格改码
     * 真实输入只会产生 slow / fix；bad 只能来自练习答错。
     * 这样「慢」不会被误读成「不会」。
     */
    function keyStatsOf(stats, sch) {
      const map = {}
      function bump(key, entry) {
        if (!key || !entry) return
        const acc = map[key] || (map[key] = { n: 0, bad: 0, slow: 0, fix: 0, ok: 0 })
        acc.n += entry.n || 0
        acc.bad += entry.bad || 0
        acc.slow += entry.slow || 0
        acc.fix += entry.fix || 0
        acc.ok += entry.ok || 0
      }
      const chars = stats.chars || {}
      for (const ch in chars) {
        const entry = chars[ch]
        const code = codeOfChar(ch, sch)
        if (code.length !== 2) continue
        bump(code.charAt(0), entry)
        bump(code.charAt(1), entry)
      }
      const keys = stats.keys || {}
      for (const key in keys) bump(key, normalizeKeyEntry(keys[key]))
      return map
    }

    /** 明确错误率：只算 bad，样本不足返回 null */
    function weaknessOf(entry) {
      if (!entry || !entry.n || entry.n < MIN_SAMPLE) return null
      return Math.max(0, Math.min(1, (entry.bad || 0) / entry.n))
    }

    /** 「待观察」比例：慢 + 改码，单独呈现，不与弱键混算 */
    function frictionOf(entry) {
      if (!entry || !entry.n || entry.n < MIN_SAMPLE) return null
      return Math.max(0, Math.min(1, ((entry.slow || 0) + (entry.fix || 0)) / entry.n))
    }

    const HEAT_COLORS = {
      warn: 'var(--dsw-alias-state-warn-primary, #c98a1b)',
      bad: 'var(--dsw-alias-state-error-primary, #d64545)',
      watch: 'var(--dsw-alias-label-tertiary, #9aa1ab)',
    }
    /**
     * 三档，证据强度递增：
     *   null  = 没有足够证据，不标
     *   watch = 只是慢/改码多 → 灰色细条（「待观察」，不代表不会）
     *   warn  = 有明确错，但还不算反复错 → 黄条
     *   bad   = 反复明确错 → 红条 + 红边
     *
     * 判 red 必须同时满足：样本够（MIN_CONFIDENT）+ 错够多（MIN_BAD） + 比例够高。
     * 旧实现是 n=2,bad=1 就判红，两次里错一次就标红，太容易被单次波动带偏。
     */
    const MIN_CONFIDENT = 6   // 进入 warn/bad 需要的最小有效样本
    const MIN_BAD = 3         // 判 bad 至少要有这么多次明确错
    const BAD_RATE = 0.4      // 判 bad 的错误率下限

    /**
     * 熟练度 0~1。用来让提示**随练习逐步淡化**——
     * 这是这套设计能不能真的练出肌肉记忆的关键：
     * 提示如果永远一样亮，你会一直依赖它，只是「跟着灯打」而不是「记住键位」。
     *
     *   ok   = 顺利打对的次数（累加）
     *   bad  = 明确错的次数
     * 错一次的代价约为对一次的 3 倍，所以 30 对 + 10 错 ≈ 0.5，
     * 要淡出必须真的对得足够多。
     *
     * 用比值而不是时间衰减：不需要记时间戳，也不会因为「很久没打」
     * 就把已经练熟的键重新点亮（那反而是在打扰）。
     */
    function masteryOf(entry) {
      if (!entry) return 0
      const ok = Math.max(0, entry.ok || 0)
      const bad = Math.max(0, entry.bad || 0)
      if (!ok && !bad) return 0
      return Math.max(0, Math.min(1, ok / (ok + bad * 3)))
    }

    /** 淡化档位：2=全亮，1=淡，0=基本不提示（已经熟了，靠自己回忆） */
    const FADE_FULL = 0.45   // 低于这个：正常提示
    const FADE_LIGHT = 0.75  // 高于 FULL、低于这个：淡提示
    function hintFadeOf(entry) {
      const m = masteryOf(entry)
      if (m >= FADE_LIGHT) return 0
      if (m >= FADE_FULL) return 1
      return 2
    }

    function heatLevelOf(weakness, friction, entry) {
      const n = entry && entry.n ? entry.n : 0
      const bad = entry && entry.bad ? entry.bad : 0
      // 练熟了就不再标红：熟练度高时整体降一档，
      // 否则「三个月前错过 5 次」会永远挂着一个红边。
      if (masteryOf(entry) >= FADE_LIGHT) return null
      // 明确错误优先：有足够错样本才可能进 warn/bad
      if (weakness !== null && n >= MIN_CONFIDENT) {
        if (bad >= MIN_BAD && weakness >= BAD_RATE) {
          return masteryOf(entry) >= FADE_FULL ? 'warn' : 'bad'
        }
        if (bad >= 1 && weakness >= 0.2) return 'warn'
      }
      // 没有明确错误时，慢/改码只给「待观察」，绝不标红
      if (friction !== null && friction >= 0.3) return 'watch'
      return null
    }

    function heatLevel(entry) {
      return heatLevelOf(weaknessOf(entry), frictionOf(entry), entry)
    }
    /** 档位 → 颜色（记录页的条形图用） */
    function heatColorOfLevel(level) {
      return level ? HEAT_COLORS[level] : null
    }

    function totalSamples(stats) {
      let n = 0
      const chars = stats.chars || {}
      for (const ch in chars) n += chars[ch].n || 0
      return n
    }

    /**
     * 「我的错字」题库：以明确错误为主，慢/改码辅助。
     * 只用 bad 会把「打得慢」的字也塞进错字库，练起来会莫名其妙。
     */
    function personalItems(stats, sch) {
      const items = []
      const chars = stats.chars || {}
      for (const ch in chars) {
        const entry = chars[ch]
        if (!entry || entry.n < MIN_SAMPLE) continue
        const bad = entry.bad || 0
        const slow = (entry.slow || 0) + (entry.fix || 0)
        if (!bad && !slow) continue
        const pinyin = pinyinOf(ch)
        if (!pinyin) continue
        const parsed = parsePinyin(pinyin)
        if (!parsed) continue
        const code = codeOf(parsed.i, parsed.f, sch)
        if (code.length !== 2) continue
        items.push({
          h: ch, p: pinyin, i: parsed.i, f: parsed.f, code: code,
          bad: bad, slow: slow, n: entry.n,
        })
      }
      // 有明确错的永远排在只有慢的前面
      items.sort(function (a, b) { return (b.bad - a.bad) || (b.slow - a.slow) || (b.n - a.n) })
      return items.slice(0, 40)
    }

    /**
     * 给当前声母挑候选韵母。分两层判断，顺序不能颠倒：
     *   1. 相关性：哪些韵母和这次输入有关（最近纠正过的规则 + 你自己用过的）
     *   2. 帮助需求：这条规则现在还需不需要提示（ruleLevel 决定强度，0 就直接不出现）
     *
     * 为什么不能只按「个人高频」取前两个：
     *   常打往往意味着已经熟了，少打反而更需要帮助。
     *   只按频率排会把最需要帮助的那个挤掉。
     */
    function finalHintCandidates(stats, schemeId, initial, sch) {
      const out = []
      const seen = {}
      function consider(final, reason) {
        if (!final || seen[final]) return
        const code = codeOf(initial, final, sch)
        if (code.length !== 2) return
        seen[final] = true
        out.push({ final: final, key: code.charAt(1), reason: reason })
      }
      // 1) 最近还在被纠正的韵母规则：最该帮，而且与当前声母无关
      //    （ie → P 这条规则本身容易混，换成别的声母也还是容易混）
      const rules = stats.rules || {}
      Object.keys(rules).forEach(function (id) {
        const parts = String(id).split('|')
        if (parts.length !== 3 || parts[0] !== schemeId || parts[1] !== 'f') return
        const rule = rules[id]
        if (!rule || !rule.conf) return
        if (ruleLevel(rule) !== 2) return
        consider(parts[2], 'conf')
      })
      // 2) 你自己在这个声母下真正用过的韵母
      personalFinalsFor(stats, initial).forEach(function (row) {
        consider(row.final, 'mine')
      })
      return out
    }

    /**
     * 你在某个声母下**实际用过**的韵母，按次数排序。
     *
     * 只回答「相关性」：哪些韵母和这个声母有关。
     * 「谁更需要帮助」是另一层判断，交给 finalHintCandidates 结合混淆历史与熟练度决定。
     * 混在一起会导致一个错误结论：常打 = 该提示（其实常打往往已经很熟）。
     */
    function personalFinalsFor(stats, initial) {
      const out = []
      if (!initial) return out
      const chars = stats.chars || {}
      const tally = {}
      for (const ch in chars) {
        const entry = chars[ch]
        if (!entry || !entry.n) continue
        const pinyin = pinyinOf(ch)
        if (!pinyin) continue
        const parsed = parsePinyin(pinyin)
        if (!parsed || parsed.i !== initial) continue
        tally[parsed.f] = (tally[parsed.f] || 0) + entry.n
      }
      Object.keys(tally).forEach(function (f) {
        out.push({ final: f, n: tally[f] })
      })
      out.sort(function (a, b) { return b.n - a.n })
      return out
    }

    function poolItems(stats, sch, pool) {
      const base = drillItems(sch)
      if (pool === 'mine') {
        const mine = personalItems(stats, sch)
        return mine.length ? mine : base
      }
      return base
    }

    function pickItem(stats, sch, pool, exclude) {
      const map = keyStatsOf(stats, sch)
      const list = poolItems(stats, sch, pool)
      let best = null
      let bestScore = -1
      for (let i = 0; i < list.length; i += 1) {
        const item = list[i]
        if (exclude && item.code === exclude.code && list.length > 1) continue
        // 选题优先级：明确错误 > 待观察（慢/改码） > 无数据 > 已练熟
        // 「慢」只作弱加权，避免把只是慢的键当不会的键反复练
        const e1 = map[item.code.charAt(0)]
        const e2 = map[item.code.charAt(1)]
        const w1 = weaknessOf(e1)
        const w2 = weaknessOf(e2)
        const f1 = frictionOf(e1)
        const f2 = frictionOf(e2)
        const rate = function (w, f) {
          if (w !== null) return 1 - w
          if (f !== null) return 0.55 - f * 0.15
          return 0.4
        }
        const base = (rate(w1, f1) + rate(w2, f2)) / 2
        const score = base + Math.random() * 0.45
        if (score > bestScore) {
          bestScore = score
          best = item
        }
      }
      return best || list[0] || { h: '', p: '', i: '', f: '', code: '' }
    }

    /* ================= 输入捕获 ================= */
    /** 插件自身面板的标记：用来把「编辑键位」这类输入排除在打字统计之外 */
    const SELF_ATTR = 'data-shuangpin-ui'

    function inSelfUI(el) {
      try {
        return Boolean(el && typeof el.closest === 'function' && el.closest('[' + SELF_ATTR + ']'))
      } catch (error) {
        return false
      }
    }

    function isEditable(el) {
      if (!el || el.nodeType !== 1) return false
      const tag = el.tagName
      if (tag === 'TEXTAREA') return true
      if (tag === 'INPUT') {
        const type = String(el.getAttribute('type') || 'text').toLowerCase()
        return type === 'text' || type === 'search'
      }
      return el.isContentEditable === true
    }

    /** 只有「用户真正在打字的输入区」才计数：排除插件自己的编辑器 */
    function isTypingTarget(el) {
      return isEditable(el) && !inSelfUI(el)
    }

    /**
     * 停顿多久算「想了想」。太短会跟着每次按键闪，太长就帮不上了。
     * 900ms 大致是「卡住」和「正常换气」的分界。
     */
    const PAUSE_MS = 900

    function installTypingCapture(store) {
      let composing = null
      let compStart = 0
      let lastCommitAt = 0
      let chainTime = -1e9
      // 本次合成里已经**显示过**提示的规则 id。
      // 用途只有一个：把「看过提示才打对」和「自己想起来」区分开——
      // 前者只能算辅助完成，不能用来让提示淡化。
      // 网页无法确认用户是否真的看了，所以按最保守的认定：显示过就算辅助。
      let shownRules = {}
      const ui = store.state.ui
      // 让渲染层按下标读写同一份「已显示」记录
      ui.shownRules = shownRules
      ui.markHintShown = function (ruleId) {
        if (ruleId) ui.shownRules[ruleId] = true
      }

      // 停顿计时器：连续打字时不打扰，停下来想的时候才给提示。
      // 这是「给用户留出自己回忆的机会」——提示如果跟着每一次按键出现，
      // 就变成了阅读任务，练不出回忆。
      let pauseTimer = null
      let pauseAt = 0
      function clearPause() {
        if (pauseTimer) { window.clearTimeout(pauseTimer); pauseTimer = null }
      }
      function schedulePause() {
        clearPause()
        pauseAt = Date.now()
        pauseTimer = window.setTimeout(function () {
          pauseTimer = null
          if (!composing || !ui.live) return
          ui.live = Object.assign({}, ui.live, { paused: true, pausedAt: Date.now() })
          store.notify()
        }, PAUSE_MS)
      }

      function onStart(event) {
        if (!isTypingTarget(event.target)) return
        composing = { at: window.performance.now(), backs: 0, el: event.target, trace: [], shrinks: 0, lastData: '' }
        compStart = composing.at
        // 每次开始合成重置「已显示提示」，只对本次输入有效
        shownRules = {}
        ui.shownRules = shownRules
        ui.live = { text: '', at: Date.now(), backs: 0 }
        schedulePause()
        pushEcho(store, 0, '▶ 开始合成')
        store.notify()
      }
      function onUpdate(event) {
        if (!composing) return
        const text = String(event.data || '').slice(0, 24)
        if (text !== composing.lastData) {
          if (text.length < composing.lastData.length) composing.shrinks += 1
          if (composing.trace.length === 0 || composing.trace[composing.trace.length - 1] !== text.slice(0, 12)) {
            composing.trace.push(text.slice(0, 12))
            if (composing.trace.length > 12) composing.trace.shift()
          }
          composing.lastData = text
        }
        // paused 每次更新都清掉：又开始打了，就重新安静下来，等下一次停顿
        ui.live = { text: text, at: Date.now(), backs: composing.backs, shrinks: composing.shrinks }
        schedulePause()
        pushEcho(store, window.performance.now() - compStart, text)
        store.notify()
      }
      function onKeyDown(event) {
        if (composing && event.key === 'Backspace') composing.backs += 1
      }
      function onEnd(event) {
        if (!composing) return
        clearPause()
        if (!isTypingTarget(event.target)) { composing = null; return }
        const elapsed = window.performance.now() - composing.at
        const backs = composing.backs
        const trace = composing.trace.slice(0)
        const shrinks = composing.shrinks
        const finalPreedit = composing.lastData
        composing = null
        ui.live = null
        const text = event.data || ''
        pushEcho(store, window.performance.now() - compStart, '✔ 上屏：' + (text || '（取消）'))
        if (!text || elapsed > 60000) { store.touch(); return }
        lastCommitAt = Date.now()
        const chained = Date.now() - chainTime < 8000
        chainTime = Date.now()
        const confusions = samePositionCorrections(trace, finalPreedit, schemeOf(store.state.prefs))
        recordCommit(store, text, elapsed, backs, {
          chained: chained,
          trace: trace,
          shrinks: shrinks,
          confusions: confusions,
        })
      }
      function onInput(event) {
        if (!isTypingTarget(event.target)) return
        if (event.isComposing) return
        if (Date.now() - lastCommitAt < 400) return
        const text = event.data || (event.target && event.target.value) || ''
        if (!text || !/[\u3400-\u9fff]/.test(text)) return
        lastCommitAt = Date.now()
        recordCommit(store, String(text).slice(-6), 600, 0)
      }

      document.addEventListener('compositionstart', onStart, true)
      document.addEventListener('compositionupdate', onUpdate, true)
      document.addEventListener('compositionend', onEnd, true)
      document.addEventListener('keydown', onKeyDown, true)
      document.addEventListener('input', onInput, true)
      return function () {
        document.removeEventListener('compositionstart', onStart, true)
        document.removeEventListener('compositionupdate', onUpdate, true)
        document.removeEventListener('compositionend', onEnd, true)
        document.removeEventListener('keydown', onKeyDown, true)
        document.removeEventListener('input', onInput, true)
      }
    }

    /* ================= 样式 ================= */
    const S = {
      panel: {
        width: '100%',
        background: 'var(--dsw-alias-bg-layer-1, #ffffff)',
        border: '1px solid var(--dsw-alias-border-l2, #cfd4da)',
        borderRadius: 12,
        color: 'var(--dsw-alias-label-primary, #1a1d21)',
        fontFamily: 'inherit',
        fontSize: 12,
        overflow: 'hidden',
        marginBottom: 8,
        userSelect: 'text',
        // 高度封顶 + 竖向 flex：内容超高时只滚正文，
        // 标题行（含键位/练习/记录三个页签）永远留在视野内。
        // flexShrink:0 很关键——面板是 dock 插槽里的 flex 子项，默认会被压缩；
        // 新会话时消息区还没内容、可用高度更小，压缩后键盘就只剩一行。
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        maxHeight: 'calc(100vh - 200px)',
      },
      panelFloat: {
        position: 'fixed',
        zIndex: 40,
        maxWidth: 'calc(100vw - 16px)',
        // 与嵌入模式一致：高度封顶，标题行不随内容滚走
        maxHeight: 'calc(100vh - 48px)',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 18px 50px rgba(0,0,0,0.28)',
        pointerEvents: 'auto',
      },
      toolbarToggle: {
        appearance: 'none',
        border: '1px solid var(--dsw-alias-border-l1, #e3e6ea)',
        background: 'transparent',
        color: 'var(--dsw-alias-label-secondary, #6b7280)',
        fontSize: 11.5,
        lineHeight: 1,
        padding: '4px 8px',
        borderRadius: 6,
        cursor: 'pointer',
        fontFamily: 'inherit',
      },
      toolbarToggleOn: {
        borderColor: 'var(--dsw-alias-brand-primary, #2b6cf6)',
        color: 'var(--dsw-alias-brand-primary, #2b6cf6)',
      },
      slimBar: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        width: '100%',
        marginBottom: 8,
        padding: '4px 12px',
        background: 'var(--dsw-alias-bg-layer-1, #ffffff)',
        border: '1px solid var(--dsw-alias-border-l1, #e3e6ea)',
        borderRadius: 8,
        color: 'var(--dsw-alias-label-secondary, #6b7280)',
        fontSize: 11,
      },
      slimTitle: { fontWeight: 600, color: 'var(--dsw-alias-label-primary, #1a1d21)' },
      header: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 10px',
        borderBottom: '1px solid var(--dsw-alias-border-l1, #e3e6ea)',
        cursor: 'grab',
        touchAction: 'none',
        userSelect: 'none',
      },
      grip: { color: 'var(--dsw-alias-label-secondary, #6b7280)', fontSize: 13, lineHeight: 1, letterSpacing: 1 },
      title: { fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' },
      spacer: { flex: '1 1 auto' },
      sliderWrap: { display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, color: 'var(--dsw-alias-label-secondary, #6b7280)' },
      slider: { width: 90, accentColor: 'var(--dsw-alias-brand-primary, #2b6cf6)', cursor: 'pointer' },
      iconButton: {
        appearance: 'none', border: '1px solid transparent', background: 'transparent',
        color: 'var(--dsw-alias-label-secondary, #6b7280)', fontSize: 11.5, lineHeight: 1,
        padding: '4px 6px', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit',
      },
      iconOn: { color: 'var(--dsw-alias-brand-primary, #2b6cf6)' },
      tab: {
        appearance: 'none', border: '1px solid transparent', background: 'transparent',
        color: 'var(--dsw-alias-label-secondary, #6b7280)', fontSize: 11.5, lineHeight: 1,
        padding: '5px 10px', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit',
      },
      tabActive: {
        background: 'var(--dsw-alias-bg-layer-2, #f2f4f7)',
        borderColor: 'var(--dsw-alias-border-l1, #e3e6ea)',
        color: 'var(--dsw-alias-label-primary, #1a1d21)',
      },
      body: { padding: '10px 12px 12px', overflowY: 'auto', overflowX: 'hidden', minHeight: 0, flex: '1 1 auto', userSelect: 'text', display: 'flex', flexDirection: 'column', gap: 8 },
      // flexShrink:0 —— 键盘永远按自身行高完整显示，不被正文的滚动区压扁
      keyboard: { display: 'flex', flexDirection: 'column', flexShrink: 0 },
      key: {
        appearance: 'none', position: 'relative', padding: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--dsw-alias-bg-layer-2, #f2f4f7)',
        border: '1px solid var(--dsw-alias-border-l1, #e3e6ea)',
        borderRadius: 6, cursor: 'pointer', overflow: 'hidden',
        fontFamily: 'inherit',
        transition: 'box-shadow 120ms ease, background 120ms ease',
      },
      /**
       * 视觉语义固定成四种，互不混用——用户不该靠猜颜色来理解提示：
       *   轻填充 / 细轮廓  = 可以考虑的候选位置（不确定，不强调谁第一）
       *   清晰实线轮廓      = 纠正后确认的正确位置（这次的答案）
       *   底部小标记        = 长期需要练习的映射（打字时不抢注意力，详情在记录页）
       *   键上高亮韵母      = 提示命中时，凸显「这个韵母在这个键上」
       *
       * 长期状态不再用整圈边框色。
       * 原因：边框和提示外环挤在同一圈，红边 + 预测环同时出现时，
       * 用户分不清「哪个是我该看的」，而且长期弱点本来就该在打字时退居次要。
       */
      fillCandidate: {
        background: 'var(--dsw-alias-brand-primary-weak, rgba(43, 108, 246, 0.10))',
        boxShadow: '0 0 0 1px rgba(43, 108, 246, 0.30)',
      },
      fillCandidateStrong: {
        background: 'var(--dsw-alias-brand-primary-weak, rgba(43, 108, 246, 0.16))',
        boxShadow: '0 0 0 1.5px rgba(43, 108, 246, 0.45)',
      },
      // 纠正后确认：清晰实线轮廓。不动位置，眼睛和手记住的是固定坐标。
      ringConfirm: {
        boxShadow: '0 0 0 2.5px var(--dsw-alias-brand-primary, #2b6cf6)',
      },
      // 已经打完的音节：只确认按过，轻微即可
      ringTyped: { boxShadow: '0 0 0 1px var(--dsw-alias-border-l2, #cfd4da)' },
      ringHover: { boxShadow: '0 0 0 1px var(--dsw-alias-brand-primary, #2b6cf6)' },
      // 预测下一字：沿用「候选」语义，不再用深色强轮廓冒充确定答案
      ringPredict: { boxShadow: '0 0 0 1.5px var(--dsw-alias-border-l2, #cfd4da)' },
      ringPredictStrong: { boxShadow: '0 0 0 2px var(--dsw-alias-label-tertiary, #9aa1ab)' },
      ringPredictFaint: { boxShadow: '0 0 0 1px var(--dsw-alias-border-l1, #e3e6ea)' },
      ringPredictStrongFaint: { boxShadow: '0 0 0 1px var(--dsw-alias-border-l2, #cfd4da)' },
      ringPredictGhost: { boxShadow: '0 0 0 1px var(--dsw-alias-border-l1, #e3e6ea)', borderStyle: 'dashed' },
      ringPredictStrongGhost: { boxShadow: '0 0 0 1px var(--dsw-alias-border-l1, #e3e6ea)', borderStyle: 'dashed' },
      // F / J 定位点：把屏幕键位对应到实体键盘的手感，和真实键盘一致
      homeDot: {
        position: 'absolute', bottom: 3, left: '50%', marginLeft: -1.5,
        width: 3, height: 3, borderRadius: 1.5,
        background: 'var(--dsw-alias-label-tertiary, #9aa1ab)',
      },
      // 键上被提示命中的韵母：凸显「韵母 → 字母键」这条对应关系
      keyFinalHit: {
        fontWeight: 700,
        color: 'var(--dsw-alias-brand-primary, #2b6cf6)',
        background: 'var(--dsw-alias-brand-primary-weak, rgba(43, 108, 246, 0.14))',
        borderRadius: 3,
        padding: '0 3px',
      },
      keyLetterStrong: { color: 'var(--dsw-alias-label-primary, #1a1d21)', fontWeight: 700 },
      keyPredictChar: {
        position: 'absolute', top: 1, right: 3, fontWeight: 600,
        color: 'var(--dsw-alias-label-primary, #1a1d21)',
      },
      keyPredictCharLow: {
        position: 'absolute', bottom: 7, right: 3, fontWeight: 600,
        color: 'var(--dsw-alias-label-primary, #1a1d21)',
      },
      keyLetter: { position: 'absolute', top: 1, left: 4, fontWeight: 600, color: 'var(--dsw-alias-label-secondary, #6b7280)' },
      keyInitial: { position: 'absolute', top: 1, right: 3, color: 'var(--dsw-alias-brand-primary, #2b6cf6)' },
      keyFinal: { textAlign: 'center', color: 'var(--dsw-alias-label-primary, #1a1d21)', lineHeight: 1.1, wordBreak: 'break-word', marginTop: '0.2em' },
      heatBar: { position: 'absolute', left: 4, right: 4, bottom: 2, height: 3, borderRadius: 2 },
      hintToggle: {
        appearance: 'none', border: '1px solid transparent', background: 'transparent',
        color: 'var(--dsw-alias-label-secondary, #6b7280)', fontSize: 10.5, padding: '3px 2px',
        cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
      },
      hint: { fontSize: 10.5, lineHeight: 1.55, color: 'var(--dsw-alias-label-secondary, #6b7280)' },
      // 键盘下方的状态行：固定高度，跟随输入出现，不依赖悬停、不引起布局跳动
      statusLine: {
        fontSize: 10.5, lineHeight: '16px', height: 16, marginTop: 4, flexShrink: 0,
        textAlign: 'center', color: 'var(--dsw-alias-label-secondary, #6b7280)',
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
      },
      hintStrong: { color: 'var(--dsw-alias-label-primary, #1a1d21)' },
      hintScheme: { fontSize: 9.5, color: 'var(--dsw-alias-label-secondary, #6b7280)', opacity: 0.75, marginTop: 1 },
      schemeBar: {
        display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap',
        marginBottom: 8, fontSize: 10.5, color: 'var(--dsw-alias-label-secondary, #6b7280)',
      },
      // 自绘下拉：原生 select 的弹层由系统绘制（白底黑字）且跟随不了主题，统一换掉
      picker: { position: 'relative', display: 'inline-flex' },
      pickerButton: {
        appearance: 'none', display: 'inline-flex', alignItems: 'center', gap: 5,
        border: '1px solid transparent', background: 'transparent',
        color: 'var(--dsw-alias-label-primary, #1a1d21)', fontSize: 13, fontWeight: 600,
        padding: '3px 4px', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit',
        lineHeight: 1.2, whiteSpace: 'nowrap',
      },
      pickerButtonOpen: { background: 'var(--dsw-alias-bg-layer-2, #f2f4f7)', borderColor: 'var(--dsw-alias-border-l1, #e3e6ea)' },
      pickerButtonSmall: { fontSize: 10.5, fontWeight: 400, padding: '2px 5px' },
      pickerCaret: { fontSize: 8, opacity: 0.6, lineHeight: 1 },
      pickerList: {
        position: 'absolute', top: 'calc(100% + 4px)', left: 0, zIndex: 60,
        minWidth: '100%', display: 'flex', flexDirection: 'column', gap: 1,
        padding: 4, borderRadius: 8,
        background: 'var(--dsw-alias-bg-layer-1, #ffffff)',
        border: '1px solid var(--dsw-alias-border-l2, #cfd4da)',
        boxShadow: '0 10px 28px rgba(0,0,0,0.22)',
      },
      pickerItem: {
        appearance: 'none', display: 'flex', alignItems: 'center', gap: 6,
        border: '1px solid transparent', background: 'transparent',
        color: 'var(--dsw-alias-label-primary, #1a1d21)', fontSize: 11.5,
        padding: '5px 8px', borderRadius: 6, cursor: 'pointer',
        fontFamily: 'inherit', textAlign: 'left', whiteSpace: 'nowrap',
      },
      pickerItemOn: { color: 'var(--dsw-alias-brand-primary, #2b6cf6)', fontWeight: 600 },
      pickerCheck: { width: 10, fontSize: 9, flex: '0 0 auto' },
      schemeAction: {
        appearance: 'none', border: '1px solid var(--dsw-alias-border-l1, #e3e6ea)', background: 'transparent',
        color: 'var(--dsw-alias-label-secondary, #6b7280)', fontSize: 10, padding: '2px 7px',
        borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit',
      },
      drill: { display: 'flex', flexDirection: 'column', gap: 8 },
      poolRow: { display: 'flex', gap: 6, alignItems: 'center' },
      poolChip: {
        appearance: 'none', border: '1px solid var(--dsw-alias-border-l1, #e3e6ea)', background: 'transparent',
        color: 'var(--dsw-alias-label-secondary, #6b7280)', fontSize: 10.5, padding: '3px 8px',
        borderRadius: 999, cursor: 'pointer', fontFamily: 'inherit',
      },
      poolChipOn: {
        borderColor: 'var(--dsw-alias-brand-primary, #2b6cf6)',
        color: 'var(--dsw-alias-brand-primary, #2b6cf6)',
      },
      drillPrompt: { display: 'flex', alignItems: 'baseline', gap: 10 },
      drillHan: { fontSize: 34, fontWeight: 600, lineHeight: 1.05 },
      drillPinyin: { fontSize: 13, color: 'var(--dsw-alias-label-secondary, #6b7280)', letterSpacing: 0.4 },
      customPanel: {
        display: 'flex', flexDirection: 'column', gap: 6,
        border: '1px solid var(--dsw-alias-border-l1, #e3e6ea)', borderRadius: 8,
        padding: '8px 10px', background: 'var(--dsw-alias-bg-layer-1, #ffffff)',
      },
      customHead: { display: 'flex', alignItems: 'baseline', gap: 8 },
      customGrid: {
        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(62px, 1fr))',
        gap: 4,
      },
      customRow: { display: 'flex', alignItems: 'flex-end', gap: 6, flexWrap: 'wrap', marginTop: 2 },
      customCell: { display: 'flex', flexDirection: 'column', gap: 2 },
      customLabel: { fontSize: 9.5, color: 'var(--dsw-alias-label-secondary, #6b7280)' },
      customInput: {
        width: 30, textAlign: 'center', fontFamily: 'inherit', fontSize: 12, fontWeight: 600,
        border: '1px solid var(--dsw-alias-border-l1, #e3e6ea)', borderRadius: 5,
        background: 'var(--dsw-alias-bg-layer-2, #f2f4f7)', color: 'var(--dsw-alias-label-primary, #1a1d21)',
        padding: '2px 0',
      },
      actionPrimary: {
        borderColor: 'var(--dsw-alias-brand-primary, #2b6cf6)',
        color: 'var(--dsw-alias-brand-primary, #2b6cf6)',
      },
      actionDisabled: { opacity: 0.45, cursor: 'not-allowed' },
      pad: {
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, minHeight: 48,
        borderRadius: 8, border: '1px dashed var(--dsw-alias-border-l2, #cfd4da)',
        background: 'var(--dsw-alias-bg-layer-2, #f2f4f7)', cursor: 'text', outline: 'none',
      },
      padFocused: { borderStyle: 'solid', borderColor: 'var(--dsw-alias-brand-primary, #2b6cf6)' },
      slot: {
        width: 34, height: 34, borderRadius: 6, border: '1px solid var(--dsw-alias-border-l1, #e3e6ea)',
        background: 'var(--dsw-alias-bg-layer-1, #ffffff)', display: 'flex', alignItems: 'center',
        justifyContent: 'center', fontSize: 16, fontWeight: 600,
      },
      slotEmpty: { color: 'var(--dsw-alias-label-secondary, #6b7280)', fontWeight: 400 },
      padHint: { fontSize: 10.5, color: 'var(--dsw-alias-label-secondary, #6b7280)' },
      revealed: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--dsw-alias-label-secondary, #6b7280)' },
      chip: {
        minWidth: 28, textAlign: 'center', padding: '5px 8px', borderRadius: 6,
        border: '1px solid var(--dsw-alias-brand-primary, #2b6cf6)', color: 'var(--dsw-alias-brand-primary, #2b6cf6)',
        fontWeight: 600, fontSize: 13, letterSpacing: 1,
      },
      chipBad: { borderColor: 'var(--dsw-alias-state-error-primary, #d64545)', color: 'var(--dsw-alias-state-error-primary, #d64545)' },
      toggleRow: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 10.5, color: 'var(--dsw-alias-label-secondary, #6b7280)', cursor: 'pointer' },
      result: { fontSize: 11.5, minHeight: 17, display: 'flex', alignItems: 'center', gap: 6 },
      ok: { color: 'var(--dsw-alias-state-success-primary, #2e9e5b)' },
      bad: { color: 'var(--dsw-alias-state-error-primary, #d64545)' },
      footer: { display: 'flex', alignItems: 'center', gap: 6 },
      statsText: { flex: '1 1 auto', fontSize: 10.5, color: 'var(--dsw-alias-label-secondary, #6b7280)' },
      action: {
        appearance: 'none', border: '1px solid var(--dsw-alias-border-l1, #e3e6ea)', background: 'transparent',
        color: 'var(--dsw-alias-label-secondary, #6b7280)', fontSize: 11, padding: '4px 9px',
        borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit',
      },
      sectionTitle: { fontSize: 11.5, fontWeight: 600 },
      schemeTag: {
        fontSize: 9.5, padding: '1px 6px', borderRadius: 999,
        color: 'var(--dsw-alias-label-secondary, #6b7280)',
        background: 'var(--dsw-alias-bg-layer-2, #f2f4f7)',
        border: '1px solid var(--dsw-alias-border-l1, #e3e6ea)',
        whiteSpace: 'nowrap',
      },
      weakRow: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 11 },
      weakKey: {
        width: 24, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center',
        borderRadius: 5, background: 'var(--dsw-alias-bg-layer-2, #f2f4f7)',
        border: '1px solid var(--dsw-alias-border-l1, #e3e6ea)', fontWeight: 600, fontSize: 11,
      },
      barTrack: { flex: '1 1 auto', height: 6, borderRadius: 3, background: 'var(--dsw-alias-bg-layer-2, #f2f4f7)', overflow: 'hidden' },
      barFill: { height: '100%', borderRadius: 3 },
      weakMeta: { fontSize: 10, color: 'var(--dsw-alias-label-secondary, #6b7280)', minWidth: 88, textAlign: 'right' },
      charChip: {
        display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 7px', margin: '0 4px 4px 0',
        borderRadius: 6, border: '1px solid var(--dsw-alias-border-l1, #e3e6ea)', fontSize: 12,
      },
      charChipCode: { fontSize: 9.5, color: 'var(--dsw-alias-state-error-primary, #d64545)', letterSpacing: 0.5 },
      code: { fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace', color: 'var(--dsw-alias-brand-primary, #2b6cf6)', letterSpacing: 1 },
      echoT: { color: 'var(--dsw-alias-label-secondary, #6b7280)', minWidth: 54, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace', fontSize: 10 },
      wrongText: { fontSize: 11, color: 'var(--dsw-alias-label-primary, #1a1d21)' },
      empty: { fontSize: 11, color: 'var(--dsw-alias-label-secondary, #6b7280)', lineHeight: 1.6 },
      // 记录页下半部：最近输入 / 输入法回显 / 卡壳过程 三栏并列，省竖向空间。
      // 列宽有下限 + 允许换行：窄面板自动折成两行，不会挤成省略号。
      colsWrap: { display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'stretch', minHeight: 0 },
      col: {
        flex: '1 1 150px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3,
        padding: '7px 8px', borderRadius: 8,
        border: '1px solid var(--dsw-alias-border-l1, #e3e6ea)',
        background: 'var(--dsw-alias-bg-layer-2, #f2f4f7)',
        maxHeight: 168, overflowY: 'auto',
      },
      colHead: { fontSize: 10.5, fontWeight: 600, color: 'var(--dsw-alias-label-secondary, #6b7280)', marginBottom: 1 },
      colRow: { display: 'flex', alignItems: 'baseline', gap: 5, fontSize: 11, minWidth: 0 },
      colWord: { fontSize: 12, fontWeight: 600, flex: '0 0 auto' },
      colCode: { flex: '0 1 auto', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
      colMeta: { marginLeft: 'auto', fontSize: 9.5, color: 'var(--dsw-alias-label-secondary, #6b7280)', flex: '0 0 auto' },
      gripCorner: { position: 'absolute', right: 0, bottom: 0, width: 16, height: 16, cursor: 'nwse-resize', touchAction: 'none', zIndex: 2 },
      gripLine: { position: 'absolute', right: 3, bottom: 3, width: 8, height: 8, borderRight: '2px solid var(--dsw-alias-border-l2, #cfd4da)', borderBottom: '2px solid var(--dsw-alias-border-l2, #cfd4da)', borderRadius: 1 },
    }

    /* ================= 组件 ================= */
    function useStore(store) {
      const [, force] = React.useState(0)
      React.useEffect(function () {
        return store.subscribe(function () { force(function (n) { return n + 1 }) })
      }, [store])
      return store.state
    }

    function useFlash(store) {
      const [flash, setFlash] = React.useState(null)
      React.useEffect(function () {
        let timer = null
        let last = 0
        return store.subscribe(function () {
          const event = store.state.stats.events[0]
          if (!event || event.t === last) return
          last = event.t
          if (timer) window.clearTimeout(timer)
          setFlash({ key: event.t, event: event })
          // 只要有纠正就短暂确认；正常上屏不给强反馈，避免和下一字提示抢注意力
          const hold = event.correctedFinal ? 900 : 500
          timer = window.setTimeout(function () { setFlash(null) }, hold)
        })
      }, [store])
      return flash
    }

    function sampleText(entry, sch) {
      if (!entry) return ''
      const code = codeOf(entry.i, entry.f, sch)
      return code ? entry.h + ' ' + entry.p + ' → ' + code : entry.h + ' ' + entry.p
    }

    function Keycap(props) {
      const item = props.item
      const size = props.size
      const sch = props.sch
      const pred = props.predict || null
      // 提示命中的那个韵母（例如 P 键上的 ie），单独凸显，回答「韵母落在哪个字母」。
      const hitFinal = pred && pred.final ? pred.final : ''
      const finalText = item.f.map(function (f) {
        return f === hitFinal ? finalLabel(f) : finalLabel(f)
      }).join(' / ')

      /**
       * 四种视觉语义，按优先级从低到高叠加，互不覆盖：
       *   1. 底部小标记  = 长期需要练习（不抢注意力）
       *   2. 轻填充      = 候选位置（可以试，但不确定）
       *   3. 实线轮廓    = 纠正后确认的正确位置（这次的答案）
       *   4. 键上韵母高亮 = 命中时凸显「韵母 → 字母键」
       * 位置和尺寸永远不变，眼睛和手记住的是稳定坐标。
       */
      const style = Object.assign(
        {},
        S.key,
        { width: size.w, height: size.h },
        pred && pred.kind === 'confirm' ? S.ringConfirm : null,
        pred && pred.kind === 'candidate' ? (pred.strong ? S.fillCandidateStrong : S.fillCandidate) : null,
        pred && pred.kind === 'typed' ? S.ringTyped : null,
        pred && pred.kind === 'next' ? (pred.faint ? S.ringPredictFaint : (pred.strong ? S.ringPredictStrong : S.ringPredict)) : null,
        props.hovered && !pred ? S.ringHover : null,
      )
      const finalStyle = Object.assign(
        {},
        S.keyFinal,
        { fontSize: Math.max(9, Math.min(30, size.w * 0.24)) },
        hitFinal ? S.keyFinalHit : null,
      )
      const letterStyle = Object.assign(
        {},
        S.keyLetter,
        { fontSize: Math.max(8, Math.min(18, size.w * 0.2)) },
        pred ? S.keyLetterStrong : null,
      )
      // 长期弱点的提示降级为底部小标记，不再用整圈红/黄边框
      const dotColor = props.level === 'bad' ? HEAT_COLORS.bad
        : props.level === 'warn' ? HEAT_COLORS.warn
          : props.level === 'watch' ? HEAT_COLORS.watch : ''
      return h(
        'button',
        {
          type: 'button',
          style: style,
          onMouseEnter: props.onEnter,
          onMouseLeave: props.onLeave,
          onClick: props.onClick,
          title: item.k + ' · ' + finalText
            + (props.level === 'bad' ? ' — ' + props.t('keyStateBad')
              : props.level === 'warn' ? ' — ' + props.t('keyStateWarn')
                : props.level === 'watch' ? ' — ' + props.t('keyStateWatch') : '')
            + (item.ex[0] ? ' — ' + sampleText(item.ex[0], sch) : ''),
          'aria-label': item.k + ' ' + item.f.map(finalLabel).join(' ')
            + (props.level === 'bad' ? ' ' + props.t('keyStateBad')
              : props.level === 'warn' ? ' ' + props.t('keyStateWarn')
                : props.level === 'watch' ? ' ' + props.t('keyStateWatch') : ''),
        },
        h('span', { style: letterStyle }, item.k),
        item.s ? h('span', { style: Object.assign({}, S.keyInitial, { fontSize: Math.max(8, Math.min(18, size.w * 0.19)) }) }, item.s) : null,
        h('span', { style: finalStyle }, finalText),
        // 候选汉字固定在右上角，不随键帽内容改变位置
        pred && pred.ch
          ? h('span', {
              style: Object.assign({}, S.keyPredictChar, { fontSize: Math.max(8, size.w * 0.19) }),
            }, pred.ch)
          : null,
        // F / J 定位点，和实体键盘一致
        item.k === 'F' || item.k === 'J' ? h('span', { style: S.homeDot }) : null,
        dotColor ? h('span', { style: Object.assign({}, S.heatBar, { height: 3, background: dotColor }) }) : null,
      )
    }

    function MapTab(props) {
      const stats = props.stats
      const flash = props.flash
      const prefs = props.prefs
      const store = props.store
      const t = props.t
      const width = props.width
      const live = props.live
      const reveal = props.reveal !== false
      const [hover, setHover] = React.useState(null)
      const sch = React.useMemo(function () { return schemeOf(prefs) }, [prefs.scheme, prefs.custom])
      const keyStats = React.useMemo(
        function () { return keyStatsOf(stats, sch) },
        [stats, stats.rev, sch],
      )
      const rowsData = React.useMemo(function () { return buildKeyRows(sch) }, [sch])

      const inner = width - 24
      const gap = Math.max(3, Math.round(inner * 0.01))
      const keyW = Math.max(26, Math.min(150, (inner - 9 * gap) / 10))
      const keyH = Math.round(keyW * 0.76)
      const offset = Math.round((keyW + gap) / 2)
      const blockW = 10 * keyW + 9 * gap
      const size = { w: keyW, h: keyH }

      /* 提示分阶段，同一时刻只表达一个动作：
           - 刚上屏 → 只短暂确认**被纠正的那个韵母键**（不点亮整次提交的所有键）
           - 合成中、当前音节已完整 → 轻确认已按下的键（不泄露答案）
           - 合成中、只打了声母 → 停顿或撤销过才给少量候选
         阶段一换，上一阶段的提示立即结束，避免残留高亮和下一次提示抢注意力。 */
      const predictMap = {}
      const ui = store.state.ui
      function markPredict(key, ch, strong, kind, final) {
        if (!key) return
        const prev = predictMap[key]
        // 确认 > 候选 > 已按过 > 下一字预测
        const rank = { confirm: 4, candidate: 3, typed: 2, next: 1 }
        if (prev && (rank[prev.kind] || 0) > (rank[kind] || 0)) return
        if (prev && prev.kind === kind && prev.strong && !strong) return
        predictMap[key] = { ch: ch || '', strong: Boolean(strong), kind: kind, final: final || '' }
      }
      const hintLines = []
      if (live && live.text) {
        const seg = live.text.slice(live.text.lastIndexOf("'") + 1)
        const info = parseSyllables(seg, sch)
        // 已经打完的音节：轻确认「这两个键你按对了」。这不泄露答案，可以随时显示。
        info.syllables.forEach(function (parsed) {
          markPredict(initialKey(parsed.i, sch), '', false, 'typed', '')
          markPredict(finalKey(parsed.f, sch), '', false, 'typed', '')
        })
        if (!info.complete && seg.charAt(0)) {
          const two = seg.slice(0, 2)
          const initial = COMMON_BY_INITIAL[two] ? two : seg.charAt(0)
          const schemeId = schemeBucketId(prefs)
          // ---- 先给回忆的机会 ----
          // 连续输入时保持安静。提示跟着每一次按键出现，就变成「读答案」，
          // 练不出回忆；只有停下来想（停顿）或刚撤销过（说明卡住）才给。
          const paused = live.paused === true
          const undid = (live.shrinks || 0) > 0
          const cands = finalHintCandidates(stats, schemeId, initial, sch)
          const usedKeys = {}
          for (let i = 0; i < cands.length && hintLines.length < 2; i += 1) {
            const cand = cands[i]
            // 两个韵母落在同一个键上，只算一个提示位置
            if (usedKeys[cand.key]) continue
            const rule = (stats.rules || {})[ruleIdOf(schemeId, 'f', cand.final)] || null
            const lv = ruleLevel(rule)
            if (lv === 0) continue
            if (lv === 1 && !undid) continue
            if (!paused && !undid) continue
            usedKeys[cand.key] = true
            markPredict(cand.key, '', cand.reason === 'conf', 'candidate', cand.final)
            if (ui && typeof ui.markHintShown === 'function') {
              ui.markHintShown(ruleIdOf(schemeId, 'f', cand.final))
            }
            hintLines.push({ final: cand.final, key: cand.key, reason: cand.reason })
          }
          // 完全没有个人数据时给一个最基础的兜底（仍然只点一个，不铺开）
          if (!cands.length && (paused || undid)) {
            const candidates = COMMON_BY_INITIAL[initial] || ''
            for (let i = 0; i < candidates.length && !hintLines.length; i += 1) {
              const ch = candidates.charAt(i)
              const pinyin = pinyinOf(ch)
              const parsed = pinyin ? parsePinyin(pinyin) : null
              if (!parsed || parsed.i !== initial) continue
              markPredict(finalKey(parsed.f, sch), ch, false, 'candidate', parsed.f)
              hintLines.push({ final: parsed.f, key: finalKey(parsed.f, sch), reason: 'base' })
            }
          }
        }
      } else if (flash && flash.event) {
        // 刚上屏：只确认**被纠正的**那个韵母键，并短暂显示「ie → P」。
        // 旧实现点亮整次提交的所有键并持续 4.5 秒，会和下一字提示撞在一起。
        const corrected = flash.event.correctedFinal
        if (corrected) {
          const key = finalKey(corrected, sch)
          markPredict(key, '', true, 'confirm', corrected)
          hintLines.push({ final: corrected, key: key, reason: 'confirm' })
        }
        const nexts = predictNext(stats, prefs, stats.lastChar)
        nexts.forEach(function (item, index) {
          const parsed = parsePinyin(item.p)
          if (!parsed) return
          // 已经被确认的键不再被下一字预测覆盖
          if (predictMap[finalKey(corrected, sch)] && corrected) {
            if (finalKey(parsed.f, sch) === finalKey(corrected, sch)) return
          }
          markPredict(initialKey(parsed.i, sch), item.ch, index === 0, 'next', '')
          markPredict(finalKey(parsed.f, sch), '', false, 'next', '')
        })
      }

      // 键盘下方固定一行状态说明：不需要悬停，也不引起布局跳动
      let hintText = ''
      if (hintLines.length) {
        const confirmRow = hintLines.filter(function (r) { return r.reason === 'confirm' })[0]
        if (confirmRow) {
          hintText = t('hintConfirm').replace('{f}', finalLabel(confirmRow.final)).replace('{k}', confirmRow.key.toUpperCase())
        } else {
          hintText = t('hintCandidates') + hintLines.map(function (r) {
            return finalLabel(r.final) + ' · ' + r.key.toUpperCase()
          }).join('，')
        }
      }

      const rows = rowsData.map(function (row, rowIndex) {
        return h(
          'div',
          { key: 'row-' + rowIndex, style: { display: 'flex', gap: gap, marginTop: rowIndex ? gap : 0, marginLeft: rowIndex * offset, flexShrink: 0 } },
          row.map(function (item) {
            const key = item.k.toLowerCase()
            const keyEntry = keyStats[key] || null
            return h(Keycap, {
              key: item.k,
              item: item,
              sch: sch,
              size: size,
              hovered: hover !== null && hover.k === item.k,
              level: heatLevel(keyEntry),
              friction: frictionOf(keyEntry),
              predict: predictMap[key] || null,
              t: t,
              onEnter: function () { setHover(item) },
              onLeave: function () { setHover(function (prev) { return prev && prev.k === item.k ? null : prev }) },
              onClick: function () { setHover(function (prev) { return prev && prev.k === item.k ? null : item }) },
            })
          }),
        )
      })

      const chromeFade = {
        opacity: reveal ? 1 : 0,
        pointerEvents: reveal ? 'auto' : 'none',
        transition: 'opacity 120ms ease',
      }

      // 自定义键位编辑是覆盖式面板（方案切换在标题栏）
      if (store.state.ui.customOpen) {
        return h(CustomEditor, { store: store, prefs: prefs, t: t })
      }

      return h(
        'div',
        null,
        h('div', { style: Object.assign({}, S.keyboard, { width: blockW, margin: '0 auto' }) }, rows),
        // 固定高度的一行状态说明：位置不变、高度不跳，不靠悬停也不用猜颜色。
        // 没有提示时也占位，避免键盘上下跳动。
        h('div', { style: S.statusLine }, hintText || '\u00a0'),
        h('div', { style: chromeFade },
          h('div', { style: S.hint },
            h('div', null, h('span', { style: S.hintStrong }, initialsHintFor(sch))),
            h('div', null, zeroHintFor(sch)))),
      )
    }

    /**
     * 自定义键位编辑：以某个内置方案为模板，逐个韵母改键位。
     * 同一键上多个韵母是正常的（如 ong/iong 共键）。
     */
    function CustomEditor(props) {
      const prefs = props.prefs
      const store = props.store
      const t = props.t
      // 模板来源：已有自定义键位就用它，否则取进编辑器前选中的内置方案
      const baseId = React.useMemo(function () {
        if (prefs.custom && prefs.custom.fromId) return prefs.custom.fromId
        return prefs.scheme === 'custom' ? 'flypy' : (prefs.scheme || 'flypy')
      }, [])
      const draft = React.useMemo(function () {
        if (prefs.custom && prefs.custom.finals) return normalizeCustom(prefs.custom)
        return customFrom(baseId)
      }, [])
      const [template, setTemplate] = React.useState(baseId)
      const [finals, setFinals] = React.useState(draft.finals)
      const [initials, setInitials] = React.useState(draft.initials)
      const [zero, setZero] = React.useState(draft.zero)

      function setFinal(final, value) {
        const key = String(value || '').toLowerCase().replace(/[^a-z;]/g, '').slice(-1)
        if (!key) return
        setFinals(function (prev) {
          const next = Object.assign({}, prev)
          next[final] = key
          return next
        })
      }
      function setInitial(initial, value) {
        const key = String(value || '').toLowerCase().replace(/[^a-z]/g, '').slice(-1)
        if (!key) return
        setInitials(function (prev) {
          const next = Object.assign({}, prev)
          next[initial] = key
          return next
        })
      }
      function apply() {
        prefs.custom = {
          finals: finals, initials: initials, zero: zero,
          fromId: template, from: SCHEMES[template].name,
        }
        prefs.scheme = 'custom'
        store.state.ui.customOpen = false
        store.touch()
      }
      function cancel() {
        store.state.ui.customOpen = false
        store.touch()
      }
      function resetFrom(id) {
        const base = customFrom(id || template)
        setTemplate(id || template)
        setFinals(base.finals)
        setInitials(base.initials)
        setZero(base.zero)
      }

      const complete = isCustomComplete({ finals: finals, zero: zero })
      const used = {}
      FINAL_ORDER.forEach(function (final) {
        const key = finals[final]
        if (!key) return
        used[key] = (used[key] || 0) + 1
      })

      return h('div', { style: S.customPanel },
        h('div', { style: S.customHead },
          h('span', { style: S.sectionTitle }, t('customTitle')),
          h('span', { style: S.hint }, t('customHint'))),
        h('div', { style: S.customRow },
          h('label', { style: S.customCell },
            h('span', { style: S.customLabel }, t('customTemplate')),
            h(Picker, {
              value: template,
              options: SCHEME_IDS.map(function (id) {
                return { value: id, label: SCHEMES[id].name }
              }),
              label: t('customTemplate'),
              style: S.pickerButton,
              dropStyle: { minWidth: 128 },
              onPick: resetFrom,
            }))),
        h('div', { style: S.customGrid },
          FINAL_ORDER.map(function (final) {
            return h('label', { key: 'f-' + final, style: S.customCell },
              h('span', { style: S.customLabel }, finalLabel(final)),
              h('input', {
                type: 'text',
                inputMode: 'latin',
                maxLength: 1,
                value: finals[final] || '',
                style: S.customInput,
                'aria-label': finalLabel(final),
                onChange: function (event) { setFinal(final, event.target.value) },
              }))
          })),
        h('div', { style: S.customRow },
          INITIAL_NOTE_ORDER.map(function (initial) {
            return h('label', { key: 'i-' + initial, style: S.customCell },
              h('span', { style: S.customLabel }, initial),
              h('input', {
                type: 'text',
                inputMode: 'latin',
                maxLength: 1,
                value: initials[initial] || '',
                style: S.customInput,
                'aria-label': initial,
                onChange: function (event) { setInitial(initial, event.target.value) },
              }))
          }),
          h('label', { style: S.customCell },
            h('span', { style: S.customLabel }, t('customZero')),
            h(Picker, {
              value: zero,
              options: [
                { value: 'natural', label: t('zeroNatural') },
                { value: 'o', label: t('zeroO') },
              ],
              label: t('customZero'),
              style: S.pickerButton,
              small: true,
              dropStyle: { minWidth: 92 },
              onPick: setZero,
            }))),
        complete ? null : h('div', { style: S.bad }, t('customIncomplete')),
        h('div', { style: S.footer },
          h('span', { style: S.statsText }, t('customKeys').replace('{n}', Object.keys(used).length)),
          h('button', {
            type: 'button',
            style: S.action,
            onClick: function () { resetFrom(template) },
          }, t('customReset')),
          h('button', { type: 'button', style: S.action, onClick: cancel }, t('customCancel')),
          h('button', {
            type: 'button',
            style: Object.assign({}, S.action, complete ? S.actionPrimary : S.actionDisabled),
            disabled: !complete,
            onClick: apply,
          }, t('customApply'))),
      )
    }

    function DrillTab(props) {
      const store = props.store
      const stats = props.stats
      const prefs = props.prefs
      const t = props.t
      const sch = React.useMemo(function () { return schemeOf(prefs) }, [prefs.scheme, prefs.custom])
      const mine = React.useMemo(
        function () { return personalItems(stats, sch) },
        [stats, stats.rev, sch],
      )
      const [item, setItem] = React.useState(function () { return pickItem(stats, sch, prefs.pool, null) })
      const [buffer, setBuffer] = React.useState('')
      const [mark, setMark] = React.useState(null)
      const [revealed, setRevealed] = React.useState(false)
      const [tally, setTally] = React.useState({ ok: 0, total: 0, streak: 0 })
      const [focused, setFocused] = React.useState(false)
      const padRef = React.useRef(null)
      const timerRef = React.useRef(null)

      React.useEffect(function () {
        return function () {
          if (timerRef.current) window.clearTimeout(timerRef.current)
        }
      }, [])

      React.useEffect(function () {
        if (!prefs.autoHint || mark !== null) return undefined
        const timer = window.setTimeout(function () {
          setRevealed(true)
          bumpHint()
        }, 1200)
        return function () { window.clearTimeout(timer) }
      }, [item.code, prefs.autoHint, mark])

      function bumpHint() {
        const st = store.state.stats
        for (let i = 0; i < item.code.length; i += 1) {
          const key = item.code.charAt(i)
          const entry = st.keys[key] || (st.keys[key] = { n: 0, bad: 0, hint: 0 })
          entry.hint = (entry.hint || 0) + 1
        }
        st.rev = (st.rev || 0) + 1
        store.touch()
      }

      function advance() {
        if (timerRef.current) {
          window.clearTimeout(timerRef.current)
          timerRef.current = null
        }
        setBuffer('')
        setMark(null)
        setRevealed(false)
        setItem(function (prev) { return pickItem(store.state.stats, sch, store.state.prefs.pool, prev) })
      }

      function finish(typed) {
        const good = typed === item.code
        const st = store.state.stats
        // 答错时定位到具体哪个键错了：
        //   两位都不同 / 只有一位不同 → 只给那一位加 bad
        //   若无法判断（位数对不上等）→ 记为「本题有误」，不平摊到两个键
        // 旧实现是两位都 +bad，打错一个韵母会把声母键也算成不会，弱键率被拉偏。
        const wrongAt = []
        if (!good) {
          if (typed.length === item.code.length) {
            for (let i = 0; i < item.code.length; i += 1) {
              if (typed.charAt(i) !== item.code.charAt(i)) wrongAt.push(i)
            }
          }
        }
        for (let i = 0; i < item.code.length; i += 1) {
          const key = item.code.charAt(i)
          const entry = st.keys[key] || (st.keys[key] = normalizeKeyEntry(null))
          entry.n += 1
          // 只有能确定是这一位错时才记 bad；定位不到就不记到任何键上
          if (wrongAt.indexOf(i) >= 0) entry.bad += 1
          // 练习答对也累积熟练度——练习本来就是用来练熟的，
          // 只算真实输入的话，光练不写的人永远淡不掉提示。
          if (good) entry.ok = (entry.ok || 0) + 1
        }
        // 无法归因的错题单独计数，不进键的弱键率
        if (!good && !wrongAt.length) {
          st.unattributed = (st.unattributed || 0) + 1
        }
        st.rev = (st.rev || 0) + 1
        store.touch()
        setMark({ good: good, typed: typed, wrongAt: wrongAt })
        setTally(function (prev) {
          return { ok: prev.ok + (good ? 1 : 0), total: prev.total + 1, streak: good ? prev.streak + 1 : 0 }
        })
        timerRef.current = window.setTimeout(advance, good ? 700 : 1500)
      }

      function onKeyDown(event) {
        if (event.key === 'Backspace') {
          event.preventDefault()
          event.stopPropagation()
          setBuffer(function (value) { return value.slice(0, -1) })
          return
        }
        if (event.key === 'Enter') {
          event.preventDefault()
          event.stopPropagation()
          advance()
          return
        }
        if (event.key.length !== 1 || !/[a-zA-Z]/.test(event.key)) return
        event.preventDefault()
        event.stopPropagation()
        if (mark !== null) return
        const typed = (buffer + event.key.toLowerCase()).slice(0, 2)
        setBuffer(typed)
        if (typed.length === 2) finish(typed)
      }

      function restart() {
        if (timerRef.current) {
          window.clearTimeout(timerRef.current)
          timerRef.current = null
        }
        setItem(function () { return pickItem(store.state.stats, sch, store.state.prefs.pool, item) })
        setBuffer('')
        setMark(null)
        setRevealed(false)
        setTally({ ok: 0, total: 0, streak: 0 })
      }

      function choosePool(pool) {
        prefs.pool = pool
        store.touch()
        setItem(function () { return pickItem(store.state.stats, sch, pool, null) })
        setBuffer('')
        setMark(null)
        setRevealed(false)
      }

      const padStyle = focused ? Object.assign({}, S.pad, S.padFocused) : S.pad
      const slots = [0, 1].map(function (index) {
        const ch = buffer.charAt(index)
        return h('span', { key: 'slot-' + index, style: ch ? S.slot : Object.assign({}, S.slot, S.slotEmpty) }, ch || '·')
      })

      let resultNode = null
      if (mark !== null) {
        resultNode = h(
          'div',
          { style: S.result, role: 'status', 'aria-live': 'polite' },
          h('span', { style: mark.good ? S.ok : S.bad, 'aria-hidden': true }, mark.good ? '✓' : '✕'),
          h('span', { style: mark.good ? S.ok : S.bad },
            mark.good
              ? t('correct') + ' ' + item.code
              : t('wrong') + ' ' + item.code + '（' + item.h + ' ' + item.p + '）'),
        )
      }

      return h(
        'div',
        { style: S.drill },
        h('div', { style: S.poolRow },
          h('button', {
            type: 'button',
            style: prefs.pool === 'common' ? Object.assign({}, S.poolChip, S.poolChipOn) : S.poolChip,
            onClick: function () { choosePool('common') },
          }, t('poolCommon')),
          h('button', {
            type: 'button',
            style: prefs.pool === 'mine' ? Object.assign({}, S.poolChip, S.poolChipOn) : S.poolChip,
            onClick: function () { choosePool('mine') },
            title: mine.length ? '' : t('poolEmpty'),
          }, t('poolMine') + (mine.length ? ' ' + mine.length : '')),
        ),
        h('div', { style: S.drillPrompt },
          h('span', { style: S.drillHan }, item.h),
          h('span', { style: S.drillPinyin }, item.p),
          h('span', { style: S.drillPinyin }, t('drillTitle'))),
        h('div', {
          ref: padRef,
          style: padStyle,
          tabIndex: 0,
          role: 'application',
          'aria-label': t('drillFocus'),
          onKeyDown: onKeyDown,
          onFocus: function () { setFocused(true) },
          onBlur: function () { setFocused(false) },
          onClick: function () { if (padRef.current) padRef.current.focus() },
        }, slots, focused ? null : h('span', { style: S.padHint }, t('drillFocus'))),
        revealed || mark !== null
          ? h('div', { style: S.revealed },
              revealed && mark === null ? h('span', null, t('revealedKeys')) : null,
              h('span', { style: mark && !mark.good ? Object.assign({}, S.chip, S.chipBad) : S.chip }, item.code.charAt(0)),
              h('span', { style: mark && !mark.good ? Object.assign({}, S.chip, S.chipBad) : S.chip }, item.code.charAt(1)))
          : null,
        h('label', { style: S.toggleRow },
          h('input', {
            type: 'checkbox',
            checked: prefs.autoHint,
            style: { accentColor: 'var(--dsw-alias-brand-primary, #2b6cf6)' },
            onChange: function (event) {
              prefs.autoHint = event.target.checked
              store.touch()
            },
          }),
          h('span', null, t('autoHint'))),
        resultNode,
        h('div', { style: S.footer },
          h('span', { style: S.statsText }, t('statsLine').replace('{ok}', tally.ok).replace('{total}', tally.total).replace('{streak}', tally.streak)),
          revealed ? null : h('button', {
            type: 'button',
            style: S.action,
            onClick: function () { setRevealed(true); bumpHint() },
          }, t('reveal')),
          h('button', { type: 'button', style: S.action, onClick: advance }, t('next')),
          h('button', { type: 'button', style: S.action, onClick: restart }, t('restart'))),
      )
    }

    function StatsTab(props) {
      const stats = props.stats
      const store = props.store
      const prefs = props.prefs
      const t = props.t
      const sch = React.useMemo(function () { return schemeOf(prefs) }, [prefs.scheme, prefs.custom])
      const keyStats = React.useMemo(
        function () { return keyStatsOf(stats, sch) },
        [stats, stats.rev, sch],
      )
      // 排序用「明确错误率」，慢只作次级参考。
      // 排行榜要回答「哪个键真的不会」，不是「哪个键打得慢」。
      const ranked = Object.keys(keyStats).map(function (key) {
        const e = keyStats[key]
        return {
          key: key,
          weakness: weaknessOf(e),
          friction: frictionOf(e),
          n: e.n,
          bad: e.bad || 0,
          slow: e.slow || 0,
          fix: e.fix || 0,
        }
      }).filter(function (row) { return row.n > 0 }).sort(function (a, b) {
        const wa = a.weakness === null ? -1 : a.weakness
        const wb = b.weakness === null ? -1 : b.weakness
        if (wb !== wa) return wb - wa
        const fa = a.friction === null ? -1 : a.friction
        const fb = b.friction === null ? -1 : b.friction
        return fb - fa || b.n - a.n
      }).slice(0, 5)

      const chars = React.useMemo(function () {
        return personalItems(stats, sch).slice(0, 12)
      }, [stats, stats.rev, sch])
      const wrong = React.useMemo(function () {
        return Object.keys(stats.wrong || {}).map(function (key) {
          const parts = key.split('|')
          return { correct: parts[0] || '?', pressed: parts[1] || '?', n: stats.wrong[key] }
        }).sort(function (a, b) { return b.n - a.n }).slice(0, 5)
      }, [stats, stats.rev])
      const stalls = (stats.stalls || []).slice(0, 5)
      const events = (stats.events || []).slice(0, 5)
      const total = totalSamples(stats)
      const goal = 60
      const pct = Math.min(100, Math.round(total / goal * 100))

      function clear() {
        const st = store.state.stats
        st.chars = {}
        st.keys = {}
        st.events = []
        st.echo = []
        st.stalls = []
        st.wrong = {}
        st.bigram = {}
        st.lastChar = ''
        st.base = 420
        st.rev = (st.rev || 0) + 1
        wipeMirror()
        store.touch()
      }
      function drillThem() {
        prefs.pool = 'mine'
        prefs.tab = 'drill'
        store.touch()
      }

      // 三栏并列：最近输入 / 输入法回显 / 卡壳过程。每栏各自滚动，整页不再被撑高。
      const colRecent = h('div', { style: S.col },
        h('div', { style: S.colHead }, t('recentTitle')),
        events.length
          ? events.map(function (event, index) {
              return h('div', { key: 'ev-' + event.t + '-' + index, style: S.colRow },
                h('span', { style: S.colWord }, event.word),
                h('span', { style: Object.assign({}, S.code, S.colCode) }, (event.codes || []).filter(Boolean).join(' ')),
                h('span', { style: S.colMeta },
                  [
                    event.backs ? t('backTag').replace('{n}', event.backs) : null,
                    event.slow ? t('slow') : null,
                    event.ms ? (Math.round(event.ms / 100) / 10) + 's' : null,
                  ].filter(Boolean).join('·')))
            })
          : h('div', { style: S.empty }, t('recentNone')),
      )

      const colEcho = h('div', { style: S.col },
        h('div', { style: S.colHead }, t('echoTitle')),
        (stats.echo && stats.echo.length)
          ? stats.echo.slice(0, 8).map(function (row, index) {
              return h('div', { key: 'ec-' + row.t + '-' + index, style: S.colRow },
                h('span', { style: S.echoT }, '+' + row.t + 'ms'),
                h('span', { style: Object.assign({}, S.code, S.colCode) }, row.d))
            })
          : h('div', { style: S.empty }, t('echoNone')),
      )

      const colStall = h('div', { style: S.col },
        h('div', { style: S.colHead }, t('stallTitle')),
        stalls.length
          ? stalls.map(function (stall, index) {
              return h('div', { key: 'st-' + stall.t + '-' + index, style: S.colRow },
                h('span', { style: S.colWord }, stall.word),
                h('span', { style: Object.assign({}, S.code, S.colCode) }, (stall.seq || []).join('→')),
                h('span', { style: S.colMeta },
                  [
                    stall.backs ? t('backTag').replace('{n}', stall.backs) : null,
                    stall.shrinks ? t('tryTag').replace('{n}', stall.shrinks) : null,
                    stall.ms ? (Math.round(stall.ms / 100) / 10) + 's' : null,
                  ].filter(Boolean).join('·')))
            })
          : h('div', { style: S.empty }, t('stallNone')),
      )

      return h('div', { style: { display: 'flex', flexDirection: 'column', gap: 9 } },
        h('div', { style: { display: 'flex', alignItems: 'baseline', gap: 8 } },
          h('span', { style: S.sectionTitle }, t('progress').replace('{n}', total).replace('{goal}', goal)),
          // 记录按方案分开存：标出这一份属于哪个方案，换方案时不会看错
          h('span', { style: S.schemeTag, title: t('recordsFor') }, schemeLabelOf(prefs, t)),
          h('span', { style: Object.assign({}, S.empty, { marginLeft: 'auto', fontSize: 9.5 }) }, t('dataNote'))),
        h('div', { style: S.barTrack },
          h('div', { style: Object.assign({}, S.barFill, { width: Math.max(3, pct) + '%', background: 'var(--dsw-alias-brand-primary, #2b6cf6)' }) })),
        // 弱键与常按错键并排，同样为了省高度；窄面板自动折行
        h('div', { style: { display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-start' } },
          h('div', { style: { flex: '1 1 180px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 } },
            h('div', { style: S.sectionTitle }, t('weakTitle')),
            ranked.length
              ? ranked.map(function (row) {
                  // 有明确错误 → 按错误率画；只有慢 → 灰色，并说明「只是慢」
                  const hasErr = row.weakness !== null
                  const ratio = hasErr ? row.weakness : (row.friction === null ? 0 : row.friction)
                  const color = hasErr
                    ? (heatColorOfLevel(heatLevelOf(row.weakness, row.friction, row)) || 'var(--dsw-alias-state-idle-primary, #9aa3ad)')
                    : 'var(--dsw-alias-label-tertiary, #9aa1ab)'
                  const value = Math.round(ratio * 100)
                  const meta = hasErr
                    ? t('keyTimes').replace('{n}', row.n).replace('{bad}', row.bad)
                    : t('keySlowOnly').replace('{n}', row.n).replace('{slow}', row.slow + row.fix)
                  return h('div', { key: row.key, style: S.weakRow },
                    h('span', { style: S.weakKey }, row.key.toUpperCase()),
                    h('span', { style: S.barTrack }, h('span', { style: Object.assign({}, S.barFill, { width: Math.max(4, value) + '%', background: color }) })),
                    h('span', { style: S.weakMeta }, meta))
                })
              : h('div', { style: S.empty }, t('weakNone'))),
          h('div', { style: { flex: '1 1 180px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 } },
            h('div', { style: S.sectionTitle }, t('wrongTitle')),
            wrong.length
              ? wrong.map(function (row) {
                  return h('div', { key: 'wr-' + row.correct + row.pressed, style: S.weakRow },
                    h('span', { style: S.wrongText },
                      t('wrongRow').replace('{a}', row.correct.toUpperCase()).replace('{b}', row.pressed.toUpperCase()).replace('{n}', row.n)))
                })
              : h('div', { style: S.empty }, t('wrongNone')))),
        h('div', { style: { display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 } },
          h('span', { style: S.sectionTitle }, t('charsTitle')),
          chars.length
            ? h('button', { type: 'button', style: S.action, onClick: drillThem }, t('drillThem'))
            : null),
        chars.length
          ? h('div', { style: { maxHeight: 96, overflowY: 'auto' } }, chars.map(function (item) {
              return h('span', { key: 'ch-' + item.h, style: S.charChip },
                h('span', null, item.h),
                h('span', { style: S.charChipCode }, item.code))
            }))
          : h('div', { style: S.empty }, t('charsNone')),
        h('div', { style: S.colsWrap }, colRecent, colEcho, colStall),
        h('div', { style: { display: 'flex', justifyContent: 'flex-end' } },
          h('button', { type: 'button', style: S.action, onClick: clear }, t('clear'))),
      )
    }

    function tabButtonFn(store, prefs) {
      return function (id, label) {
        return h('button', {
          type: 'button',
          'data-nodrag': true,
          style: id === prefs.tab ? Object.assign({}, S.tab, S.tabActive) : S.tab,
          onClick: function () {
            prefs.tab = id
            store.touch()
          },
          'aria-pressed': id === prefs.tab,
        }, label)
      }
    }

    /**
     * 自绘下拉。原生 <select> 的候选项列表由操作系统绘制：白底黑字、
     * 跟随不了面板主题，未展开时也容易被宿主样式盖成白底白字。
     * 这里用按钮 + 绝对定位列表自己画，配色全部取主题变量。
     */
    function Picker(props) {
      const [open, setOpen] = React.useState(false)
      const wrapRef = React.useRef(null)
      const current = props.options.find(function (opt) { return opt.value === props.value })
      const labelText = current ? current.label : props.value

      // 点外面或按 Esc 收起
      React.useEffect(function () {
        if (!open) return undefined
        function onDown(event) {
          if (wrapRef.current && wrapRef.current.contains && wrapRef.current.contains(event.target)) return
          setOpen(false)
        }
        function onKey(event) {
          if (event.key === 'Escape') setOpen(false)
        }
        document.addEventListener('pointerdown', onDown)
        document.addEventListener('keydown', onKey)
        return function () {
          document.removeEventListener('pointerdown', onDown)
          document.removeEventListener('keydown', onKey)
        }
      }, [open])

      return h('div', { ref: wrapRef, style: S.picker, 'data-nodrag': true },
        h('button', {
          type: 'button',
          'data-nodrag': true,
          style: Object.assign({}, props.style, open ? S.pickerButtonOpen : null, props.small ? S.pickerButtonSmall : null),
          title: props.hint || props.label,
          'aria-label': props.label,
          'aria-haspopup': 'listbox',
          'aria-expanded': open,
          onPointerDown: function (event) { event.stopPropagation() },
          onClick: function (event) {
            event.stopPropagation()
            setOpen(function (prev) { return !prev })
          },
        },
          h('span', null, labelText),
          h('span', { style: S.pickerCaret, 'aria-hidden': true }, '▼')),
        open
          ? h('div', {
              style: Object.assign({}, S.pickerList, props.dropStyle),
              role: 'listbox',
              onPointerDown: function (event) { event.stopPropagation() },
            }, props.options.map(function (opt) {
              const on = opt.value === props.value
              return h('button', {
                key: opt.value,
                type: 'button',
                role: 'option',
                'aria-selected': on,
                style: Object.assign({}, S.pickerItem, on ? S.pickerItemOn : null),
                onClick: function (event) {
                  event.stopPropagation()
                  setOpen(false)
                  props.onPick(opt.value)
                },
              },
                h('span', { style: S.pickerCheck, 'aria-hidden': true }, on ? '✓' : ''),
                h('span', null, opt.label))
            }))
          : null)
    }

    function renderHeader(opts) {
      const children = []
      const prefs = opts.prefs
      const t = opts.t
      if (opts.surface === 'float') {
        children.push(h('span', {
          style: Object.assign({}, S.grip, prefs.locked ? { opacity: 0.3 } : null),
          'aria-hidden': true,
        }, '⠿'))
      }
      // 标题即方案名：下拉显示当前方案（如「小鹤双拼」），点开直接换方案；
      // 键位页因此不再需要单独的方案栏。插件名放在 title 提示里。
      children.push(h(Picker, {
        value: prefs.scheme || 'flypy',
        options: SCHEME_IDS.map(function (id) {
          return { value: id, label: SCHEMES[id].name }
        }).concat([{ value: 'custom', label: t('schemeCustom') }]),
        label: t('schemeLabel'),
        hint: t('title') + ' · ' + t('schemeLabel'),
        style: S.pickerButton,
        dropStyle: { minWidth: 128 },
        onPick: function (next) {
          prefs.scheme = next
          // 首次选「自定义…」时还没有键位表：直接打开编辑器，以当前方案为模板，
          // 否则下拉显示「自定义」而实际仍按上一个方案运行，容易误解
          if (next === 'custom' && !isCustomComplete(normalizeCustom(prefs.custom))) {
            opts.store.state.ui.customOpen = true
          }
          opts.store.touch()
        },
      }))
      if (prefs.scheme === 'custom') {
        children.push(h('button', {
          type: 'button',
          'data-nodrag': true,
          style: S.iconButton,
          onClick: function () {
            opts.store.state.ui.customOpen = true
            opts.store.touch()
          },
          title: t('customEdit'),
          'aria-label': t('customEdit'),
        }, '✎'))
      }
      children.push(opts.tabButton('map', t('tabMap')))
      children.push(opts.tabButton('drill', t('tabDrill')))
      children.push(opts.tabButton('stats', t('tabStats')))
      children.push(h('span', { style: S.spacer }))
      if (opts.surface === 'float') {
        children.push(h('label', {
          style: Object.assign({}, S.sliderWrap, { 'data-nodrag': true }),
          title: t('opacity'),
          onPointerDown: function (event) { event.stopPropagation() },
        },
          h('span', null, '◐'),
          h('input', {
            type: 'range', min: 0.35, max: 1, step: 0.05, value: prefs.opacity,
            style: Object.assign({}, S.slider, { width: 90 }),
            onPointerDown: function (event) { event.stopPropagation() },
            onChange: function (event) { opts.setOpacity(Number(event.target.value)) },
          })))
        children.push(h('button', {
          type: 'button',
          'data-nodrag': true,
          style: prefs.locked ? Object.assign({}, S.iconButton, S.iconOn) : S.iconButton,
          onClick: opts.toggleLock,
          title: prefs.locked ? t('unlock') : t('lock'),
          'aria-pressed': prefs.locked,
        }, prefs.locked ? '📍' : '📌'))
        children.push(h('button', {
          type: 'button', 'data-nodrag': true, style: S.iconButton,
          onClick: opts.toDock, title: t('toDock'), 'aria-label': t('toDock'),
        }, '🗖'))
      } else {
        children.push(h('button', {
          type: 'button', 'data-nodrag': true, style: S.iconButton,
          onClick: opts.toFloat, title: t('toFloat'), 'aria-label': t('toFloat'),
        }, '🗗'))
      }
      // 两种模式都不提供 ▾ 收起按钮：展开/收起统一走工具行的鹤开关（浮窗收起后缩为右下角鹤按钮）
      return children
    }

    /** 嵌入模式：位于 conversation.input.dock，占真实布局，宽度对齐输入框 */
    function DockShell(props) {
      const state = useStore(props.store)
      const flash = useFlash(props.store)
      const composerWRef = React.useRef(720)
      const [composerW, setComposerW] = React.useState(720)

      function measureComposer() {
        const el = findComposerEl()
        if (!el) return
        const w = composerWidthOf(el)
        if (w >= 220 && Math.abs(w - composerWRef.current) > 1) {
          composerWRef.current = w
          setComposerW(Math.round(w))
        }
      }

      React.useLayoutEffect(function () { measureComposer() })
      React.useEffect(function () {
        measureComposer()
        let observer = null
        const el = findComposerEl()
        if (el && window.ResizeObserver) {
          observer = new window.ResizeObserver(function () { measureComposer() })
          observer.observe(el)
        }
        window.addEventListener('resize', measureComposer)
        // 兜底轮询：最大化/恢复、布局过渡、输入框重挂载等任何漏网情况，0.5s 内跟上
        const timer = window.setInterval(measureComposer, 500)
        return function () {
          if (observer) observer.disconnect()
          window.removeEventListener('resize', measureComposer)
          window.clearInterval(timer)
        }
      }, [])

      const panelWidth = Math.max(280, Math.round(composerW))
      if (state.prefs.surface !== 'dock') return null
      if (!state.prefs.open) return null
      return h(DockPanel, { store: props.store, state: state, flash: flash, t: props.t, width: panelWidth })
    }

    /** 嵌入面板：内容与控制行，宽度由 DockShell 传入（对齐输入框） */
    function DockPanel(props) {
      const store = props.store
      const state = props.state
      const prefs = state.prefs
      const t = props.t
      const width = props.width || 720
      const [hovered, setHovered] = React.useState(false)
      const rootRef = React.useRef(null)

      function toFloat() {
        // 切换为浮窗时，从嵌入面板当前的位置无缝接管，避免面板"消失"到别处
        const rect = rootRef.current && rootRef.current.getBoundingClientRect
          ? rootRef.current.getBoundingClientRect()
          : null
        if (rect && rect.width) {
          prefs.x = Math.max(8, Math.round(rect.left))
          prefs.y = Math.max(8, Math.round(rect.top))
          prefs.w = Math.round(rect.width)
        }
        prefs.surface = 'float'
        store.touch()
      }

      const chromeStyle = {
        opacity: hovered ? 1 : 0,
        pointerEvents: hovered ? 'auto' : 'none',
        transition: 'opacity 120ms ease',
      }
      let body = null
      if (prefs.tab === 'drill') body = h(DrillTab, { store: store, stats: state.stats, prefs: prefs, t: t })
      else if (prefs.tab === 'stats') body = h(StatsTab, { store: store, stats: state.stats, prefs: prefs, t: t })
      else body = h(MapTab, { store: store, stats: state.stats, prefs: prefs, t: t, flash: props.flash, width: width, live: state.ui.live, reveal: hovered })

      return h('div', {
        ref: rootRef,
        style: Object.assign({}, S.panel, { width: width, margin: '0 auto 8px' }),
        role: 'region',
        'aria-label': t('title'),
        // 标记为插件自身的 UI：里面的输入框（改键位）不算用户打字
        [SELF_ATTR]: 'dock',
        onMouseEnter: function () { setHovered(true) },
        onMouseLeave: function () { setHovered(false) },
      },
        h('div', { style: Object.assign({}, S.header, chromeStyle, { cursor: 'default' }) },
          renderHeader({
            t: t, prefs: prefs, store: store, surface: 'dock',
            tabButton: tabButtonFn(store, prefs),
            minimize: function () { prefs.open = false; store.touch() },
            toFloat: toFloat,
          })),
        h('div', { style: S.body }, body))
    }

    /** 浮窗模式：可拖动、可调透明度、可固定 */
    function FloatPanel(props) {
      const store = props.store
      const state = props.state
      const prefs = state.prefs
      const t = props.t
      const boxRef = React.useRef(null)
      const dragRef = React.useRef(null)
      const posRef = React.useRef(null)
      const widthRef = React.useRef(null)
      const [pos, setPos] = React.useState(function () { return initialFloatPos(prefs) })
      const [width, setWidth] = React.useState(function () { return clampWidth(prefs.w, 8) })
      const [interacting, setInteracting] = React.useState(false)
      const [hovered, setHovered] = React.useState(false)

      if (posRef.current === null) posRef.current = pos
      if (widthRef.current === null) widthRef.current = width

      // 与嵌入模式一致的悬停显影：鼠标不在面板上时只显示三行键位
      const reveal = hovered || interacting
      const chromeStyle = {
        opacity: reveal ? 1 : 0,
        pointerEvents: reveal ? 'auto' : 'none',
        transition: 'opacity 120ms ease',
      }

      function move(x, y) {
        const next = clampPos(x, y, boxRef.current, widthRef.current)
        posRef.current = next
        setPos(next)
      }

      React.useEffect(function () {
        function onResize() {
          const next = clampPos(posRef.current.x, posRef.current.y, boxRef.current, widthRef.current)
          posRef.current = next
          setPos(next)
          const w = clampWidth(widthRef.current, next.x)
          widthRef.current = w
          setWidth(w)
        }
        window.addEventListener('resize', onResize)
        return function () { window.removeEventListener('resize', onResize) }
      }, [])

      function startDrag(event) {
        if (prefs.locked) return
        if (event.button !== 0) return
        if (event.target && typeof event.target.closest === 'function' && event.target.closest('[data-nodrag]')) return
        setInteracting(true)
        dragRef.current = { dx: event.clientX - posRef.current.x, dy: event.clientY - posRef.current.y }
        if (event.currentTarget.setPointerCapture) {
          try { event.currentTarget.setPointerCapture(event.pointerId) } catch (error) { /* ignore */ }
        }
        event.preventDefault()
      }
      function onMove(event) {
        if (!dragRef.current || dragRef.current.resize) return
        move(event.clientX - dragRef.current.dx, event.clientY - dragRef.current.dy)
      }
      function endDrag(event) {
        if (!dragRef.current || dragRef.current.resize) return
        dragRef.current = null
        setInteracting(false)
        try { event.currentTarget.releasePointerCapture(event.pointerId) } catch (error) { /* ignore */ }
        prefs.x = posRef.current.x
        prefs.y = posRef.current.y
        store.touch()
      }
      function startResize(event) {
        if (prefs.locked) return
        if (event.button !== 0) return
        setInteracting(true)
        dragRef.current = { resize: true, startX: event.clientX, startW: widthRef.current }
        if (event.currentTarget.setPointerCapture) {
          try { event.currentTarget.setPointerCapture(event.pointerId) } catch (error) { /* ignore */ }
        }
        event.preventDefault()
        event.stopPropagation()
      }
      function onResizeMove(event) {
        if (!dragRef.current || !dragRef.current.resize) return
        const next = clampWidth(dragRef.current.startW + (event.clientX - dragRef.current.startX), posRef.current.x)
        widthRef.current = next
        setWidth(next)
      }
      function endResize(event) {
        if (!dragRef.current || !dragRef.current.resize) return
        dragRef.current = null
        setInteracting(false)
        try { event.currentTarget.releasePointerCapture(event.pointerId) } catch (error) { /* ignore */ }
        prefs.w = widthRef.current
        store.touch()
      }
      function toDock() {
        prefs.surface = 'dock'
        store.touch()
      }
      function toggleLock() {
        prefs.locked = !prefs.locked
        store.touch()
      }
      function setOpacity(value) {
        prefs.opacity = value
        store.touch()
      }

      let body = null
      if (prefs.tab === 'drill') body = h(DrillTab, { store: store, stats: state.stats, prefs: prefs, t: t })
      else if (prefs.tab === 'stats') body = h(StatsTab, { store: store, stats: state.stats, prefs: prefs, t: t })
      else body = h(MapTab, { store: store, stats: state.stats, prefs: prefs, t: t, flash: props.flash, width: width, live: state.ui.live, reveal: reveal })

      return h('div', {
        ref: boxRef,
        style: Object.assign({}, S.panel, S.panelFloat, { left: pos.x, top: pos.y, width: width, opacity: prefs.opacity }),
        role: 'dialog',
        'aria-label': t('title'),
        [SELF_ATTR]: 'float',
        onMouseEnter: function () { setHovered(true) },
        onMouseLeave: function () { setHovered(false) },
      },
        h('div', {
          style: Object.assign({}, S.header, chromeStyle, { cursor: prefs.locked ? 'default' : 'grab' }),
          onPointerDown: startDrag,
          onPointerMove: onMove,
          onPointerUp: endDrag,
          onPointerCancel: endDrag,
          title: prefs.locked ? t('lock') : t('unlock'),
        },
          renderHeader({
            t: t, prefs: prefs, store: store, surface: 'float',
            tabButton: tabButtonFn(store, prefs),
            setOpacity: setOpacity,
            toggleLock: toggleLock,
            toDock: toDock,
            minimize: function () { prefs.open = false; store.touch() },
          })),
        h('div', { style: S.body }, body),
        h('div', {
          style: S.gripCorner,
          onPointerDown: startResize,
          onPointerMove: onResizeMove,
          onPointerUp: endResize,
          onPointerCancel: endResize,
          title: 'resize',
        }, h('span', { style: S.gripLine })),
      )
    }

    /** 浮窗壳：注册在 shell.overlay（可拖动的悬浮窗）；收起后不渲染，恢复用工具行的鹤开关 */
    function FloatShell(props) {
      const state = useStore(props.store)
      const flash = useFlash(props.store)
      if (state.prefs.surface !== 'float') return null
      if (!state.prefs.open) return null
      return h(FloatPanel, { store: props.store, state: state, flash: flash, t: props.t })
    }

    /** 工具行开关：位于 conversation.input.right（模型选择器之后的加法槽位） */
    function ToolbarToggle(props) {
      const state = useStore(props.store)
      const prefs = state.prefs
      const t = props.t
      const active = prefs.open
      return h('button', {
        type: 'button',
        style: active
          ? Object.assign({}, S.toolbarToggle, S.toolbarToggleOn)
          : S.toolbarToggle,
        onClick: function () {
          prefs.open = !prefs.open
          props.store.touch()
        },
        title: active ? t('kbHide') : t('kbShow'),
        'aria-pressed': active,
      }, '双拼')
    }

    function clampWidth(value, left) {
      const maxByScreen = Math.max(MIN_W, window.innerWidth - (left || 8) - 12)
      return Math.max(MIN_W, Math.min(Math.min(MAX_W, maxByScreen), Number(value) || 520))
    }

    /** 找到主输入框元素（底部可见、够宽的可编辑区域），用于宽度对齐 */
    function findComposerEl() {
      try {
        let wide = null
        const nodes = document.querySelectorAll('textarea, [contenteditable]')
        for (let i = 0; i < nodes.length; i += 1) {
          const el = nodes[i]
          if (!isEditable(el)) continue
          const rect = el.getBoundingClientRect()
          if (rect.width < 220 || rect.height < 36) continue
          if (rect.bottom < 0 || rect.top > window.innerHeight) continue
          if (!wide || rect.top > wide.top) wide = el
        }
        return wide
      } catch (error) {
        return null
      }
    }

    /** 从可编辑元素向上吸收内边距层，逼近输入框卡片（composer card）的真实外宽 */
    function composerWidthOf(el) {
      let w = el.getBoundingClientRect().width
      let node = el.parentElement
      let guard = 0
      while (node && node.getBoundingClientRect && guard < 6) {
        const rw = node.getBoundingClientRect().width
        if (rw > w && rw - w <= 48) {
          w = rw
          node = node.parentElement
          guard += 1
        } else break
      }
      return w
    }

    function clampPos(x, y, el, width) {
      const w = width || 520
      let height = 420
      if (el && el.getBoundingClientRect) {
        const rect = el.getBoundingClientRect()
        if (rect.height) height = rect.height
      }
      const maxX = Math.max(8, window.innerWidth - w - 8)
      const maxY = Math.max(8, window.innerHeight - Math.min(height, window.innerHeight - 16) - 8)
      return {
        x: Math.min(Math.max(8, x), maxX),
        y: Math.min(Math.max(8, y), maxY),
      }
    }

    function initialFloatPos(prefs) {
      const width = clampWidth(prefs.w, 8)
      if (typeof prefs.x === 'number' && typeof prefs.y === 'number') {
        return clampPos(prefs.x, prefs.y, null, width)
      }
      return {
        x: Math.max(8, window.innerWidth - width - 20),
        y: 96,
      }
    }

    return {
      inject: ['slots', 'locale'],
      // 只给测试用：直接渲染某一页，避免测试重复搭外壳
      __test: { MapTab: MapTab, DrillTab: DrillTab, Keycap: Keycap },
      apply(ctx) {
        ctx.effect(function () { return ctx.locale.register(NS, 'zh', ZH) }, 'shuangpin-reminder: zh')
        ctx.effect(function () { return ctx.locale.register(NS, 'en', EN) }, 'shuangpin-reminder: en')

        const bound = ctx.locale.bind(NS)
        function t(key) {
          let value = key
          try {
            value = bound(key)
          } catch (error) {
            value = key
          }
          return value === key ? (FALLBACK[key] || key) : value
        }

        const store = createStore()
        ctx.effect(function () { return installTypingCapture(store) }, 'shuangpin-reminder: typing capture')
        ctx.effect(function () {
          function flush() { store.save() }
          window.addEventListener('pagehide', flush)
          return function () {
            window.removeEventListener('pagehide', flush)
            store.save()
          }
        }, 'shuangpin-reminder: persistence')

        ctx.slots.inject('conversation.input.dock', function () {
          return ctx.slots.register(
            { name: 'conversation.input.dock', id: 'shuangpin-reminder', order: 2 },
            function () { return h(DockShell, { store: store, t: t }) },
          )
        })
        ctx.slots.inject('conversation.input.right', function () {
          return ctx.slots.register(
            { name: 'conversation.input.right', id: 'shuangpin-reminder-toggle', order: 5 },
            function () { return h(ToolbarToggle, { store: store, t: t }) },
          )
        })
        ctx.slots.inject('shell.overlay', function () {
          return ctx.slots.register(
            { name: 'shell.overlay', id: 'shuangpin-reminder-float', order: 4 },
            function () { return h(FloatShell, { store: store, t: t }) },
          )
        })
      },
    }
  },
})
