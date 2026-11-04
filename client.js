window.__ModuleLoader__.load({
  id: '@local/xiaohe-shuangpin-reminder',
  factory(require) {
    const React = require('react')
    const h = React.createElement
    const NS = 'xiaohe-shuangpin'
    const PREF_KEY = 'dsh.xiaohe-shuangpin.prefs.v4'
    const STAT_KEY = 'dsh.xiaohe-shuangpin.stats.v2'

    /* ================= 小鹤双拼规则（Rime double_pinyin_flypy） ================= */
    const INITIAL_KEY = { zh: 'v', ch: 'i', sh: 'u' }
    const FINAL_KEY = {
      a: 'a', o: 'o', e: 'e', i: 'i', u: 'u', v: 'v',
      ai: 'd', ei: 'w', ao: 'c', ou: 'z', an: 'j', en: 'f',
      ang: 'h', eng: 'g', er: 'r',
      ia: 'x', ie: 'p', iao: 'n', iu: 'q', ian: 'm', in: 'b',
      iang: 'l', ing: 'k', iong: 's', ong: 's',
      ua: 'x', uo: 'o', uai: 'k', ui: 'v', uan: 'r', un: 'y', uang: 'l',
      ue: 't', ve: 't',
    }
    const FINAL_LABEL = { ve: 'üe', v: 'ü' }
    const TONE = {
      'ā': 'a', 'á': 'a', 'ǎ': 'a', 'à': 'a',
      'ē': 'e', 'é': 'e', 'ě': 'e', 'è': 'e', 'ê': 'e',
      'ī': 'i', 'í': 'i', 'ǐ': 'i', 'ì': 'i',
      'ō': 'o', 'ó': 'o', 'ǒ': 'o', 'ò': 'o',
      'ū': 'u', 'ú': 'u', 'ǔ': 'u', 'ù': 'u',
      'ǖ': 'v', 'ǘ': 'v', 'ǚ': 'v', 'ǜ': 'v', 'ü': 'v',
      'ń': 'n', 'ň': 'n', 'ǹ': 'n', 'ḿ': 'm',
    }

    function finalLabel(f) {
      return FINAL_LABEL[f] || f
    }

    /**
     * initial + final → 双拼码。initial 为空表示零声母，小鹤规则：
     * 单字母韵母双写（啊 aa、鹅 ee），双字母韵母照全拼（爱 ai、安 an、欧 ou），
     * 三字母韵母用「首字母 + 韵母键」（昂 ah、鞥 eg）。
     */
    function codeOf(initial, final) {
      const fk = FINAL_KEY[final]
      if (!fk) return ''
      if (initial === '') {
        if (final.length === 2) return final
        if (final.length === 1) return final + final
        return final.charAt(0) + fk
      }
      return (INITIAL_KEY[initial] || initial) + fk
    }

    const PINYIN_INITIALS = 'bpmfdtnlgkhjqxrzcsyw'
    function parsePinyin(raw) {
      let text = String(raw || '').toLowerCase()
      let plain = ''
      for (let i = 0; i < text.length; i += 1) {
        const ch = text.charAt(i)
        plain += TONE[ch] !== undefined ? TONE[ch] : ch
      }
      plain = plain.replace(/[^a-z]/g, '')
      if (!plain) return null
      let initial = ''
      let rest = plain
      const head = plain.slice(0, 2)
      if (head === 'zh' || head === 'ch' || head === 'sh') {
        initial = head
        rest = plain.slice(2)
      } else if (PINYIN_INITIALS.indexOf(plain.charAt(0)) >= 0) {
        initial = plain.charAt(0)
        rest = plain.slice(1)
      }
      if (!rest) return null
      if (rest === 'u' && 'jqxy'.indexOf(initial) >= 0) rest = 'v'
      if (!Object.prototype.hasOwnProperty.call(FINAL_KEY, rest)) return null
      return { i: initial, f: rest }
    }

    /* ================= 常用字拼音表（GB2312 一级字表 3755 字） ================= */
    const DICT_SRC = '一yi 丁ding 七qi 万wan 丈zhang 三san 上shang 下xia 不bu 与yu 丑chou 专zhuan 且qie 世shi 丘qiu 丙bing 业ye 丛cong 东dong 丝si 丢diu 两liang 严yan 丧sang 个ge 丫ya 中zhong 丰feng 串chuan 临lin 丸wan 丹dan 为wei 主zhu 丽li 举ju 乃nai 久jiu 么me 义yi 之zhi 乌wu 乍zha 乎hu 乏fa 乐le 乒ping 乓pang 乔qiao 乖guai 乘cheng 乙yi 九jiu 乞qi 也ye 习xi 乡xiang 书shu 买mai 乱luan 乳ru 乾qian 了le 予yu 争zheng 事shi 二er 于yu 亏kui 云yun 互hu 五wu 井jing 亚ya 些xie 亡wang 亢kang 交jiao 亥hai 亦yi 产chan 亨heng 亩mu 享xiang 京jing 亭ting 亮liang 亲qin 人ren 亿yi 什shen 仁ren 仅jin 仆pu 仇chou 今jin 介jie 仍reng 从cong 仑lun 仓cang 仔zai 仕shi 他ta 仗zhang 付fu 仙xian 仟qian 代dai 令ling 以yi 仪yi 们men 仰yang 仲zhong 件jian 价jia 任ren 份fen 仿fang 企qi 伊yi 伍wu 伎ji 伏fu 伐fa 休xiu 众zhong 优you 伙huo 会hui 伞san 伟wei 传chuan 伤shang 伦lun 伪wei 伯bo 估gu 伴ban 伶ling 伸shen 伺ci 似shi 佃dian 但dan 位wei 低di 住zhu 佐zuo 佑you 体ti 何he 余yu 佛fu 作zuo 你ni 佣yong 佩pei 佬lao 佯yang 佰bai 佳jia 使shi 侄zhi 侈chi 例li 侍shi 侗dong 供gong 依yi 侠xia 侣lv 侥jiao 侦zhen 侧ce 侨qiao 侩kuai 侮wu 侯hou 侵qin 便bian 促cu 俄e 俊jun 俏qiao 俐li 俗su 俘fu 保bao 俞yu 信xin 俩lia 俭jian 修xiu 俯fu 俱ju 俺an 倍bei 倒dao 倔jue 倘tang 候hou 倚yi 借jie 倡chang 倦juan 倪ni 债zhai 值zhi 倾qing 假jia 偏pian 做zuo 停ting 健jian 偶ou 偷tou 偿chang 傀gui 傅fu 傈li 傍bang 傣dai 储chu 催cui 傲ao 傻sha 像xiang 僚liao 僧seng 僳su 僵jiang 僻pi 儒ru 儡lei 儿er 允yun 元yuan 兄xiong 充chong 兆zhao 先xian 光guang 克ke 免mian 兑dui 兔tu 党dang 兜dou 兢jing 入ru 全quan 八ba 公gong 六liu 兰lan 共gong 关guan 兴xing 兵bing 其qi 具ju 典dian 兹zi 养yang 兼jian 兽shou 冀ji 内nei 冈gang 冉ran 册ce 再zai 冒mao 冕mian 冗rong 写xie 军jun 农nong 冠guan 冤yuan 冬dong 冯feng 冰bing 冲chong 决jue 况kuang 冶ye 冷leng 冻dong 净jing 凄qi 准zhun 凉liang 凋diao 凌ling 减jian 凑cou 凛lin 凝ning 几ji 凡fan 凤feng 凭ping 凯kai 凰huang 凳deng 凶xiong 凸tu 凹ao 出chu 击ji 函han 凿zao 刀dao 刁diao 刃ren 分fen 切qie 刊kan 刑xing 划hua 列lie 刘liu 则ze 刚gang 创chuang 初chu 删shan 判pan 刨pao 利li 别bie 刮gua 到dao 制zhi 刷shua 券quan 刹sha 刺ci 刻ke 刽gui 剁duo 剂ji 剃ti 削xue 前qian 剐gua 剑jian 剔ti 剖pou 剥bo 剧ju 剩sheng 剪jian 副fu 割ge 剿jiao 劈pi 力li 劝quan 办ban 功gong 加jia 务wu 劣lie 动dong 助zhu 努nu 劫jie 励li 劲jin 劳lao 势shi 勃bo 勇yong 勉mian 勋xun 勒lei 勘kan 募mu 勤qin 勺shao 勾gou 勿wu 匀yun 包bao 匆cong 匈xiong 化hua 北bei 匙shi 匝za 匠jiang 匡kuang 匣xia 匪fei 匹pi 区qu 医yi 匿ni 十shi 千qian 升sheng 午wu 卉hui 半ban 华hua 协xie 卑bei 卒zu 卓zhuo 单dan 卖mai 南nan 博bo 卜bo 卞bian 占zhan 卡ka 卢lu 卤lu 卧wo 卫wei 卯mao 印yin 危wei 即ji 却que 卵luan 卷juan 卸xie 卿qing 厂chang 厄e 厅ting 历li 厉li 压ya 厌yan 厕ce 厘li 厚hou 原yuan 厢xiang 厦sha 厨chu 厩jiu 去qu 县xian 叁san 参can 又you 叉cha 及ji 友you 双shuang 反fan 发fa 叔shu 取qu 受shou 变bian 叙xu 叛pan 叠die 口kou 古gu 句ju 另ling 只zhi 叫jiao 召zhao 叭ba 叮ding 可ke 台tai 史shi 右you 叶ye 号hao 司si 叹tan 叼diao 吁xu 吃chi 各ge 合he 吉ji 吊diao 同tong 名ming 后hou 吏li 吐tu 向xiang 吓xia 吕lv 吗ma 君jun 吝lin 吞tun 吟yin 吠fei 否fou 吧ba 吨dun 吩fen 含han 听ting 吭keng 吮shun 启qi 吱zhi 吴wu 吵chao 吸xi 吹chui 吻wen 吼hou 吾wu 呀ya 呆dai 呈cheng 告gao 呐na 呕ou 员yuan 呛qiang 呜wu 呢ne 周zhou 味wei 呵he 呸pei 呻shen 呼hu 命ming 咀ju 咆pao 咋za 和he 咎jiu 咏yong 咐fu 咒zhou 咕gu 咖ka 咙long 咨zi 咬yao 咯ge 咱zan 咳ke 咸xian 咽yan 哀ai 品pin 哄hong 哆duo 哇wa 哈ha 哉zai 响xiang 哎ai 哑ya 哗hua 哟yo 哥ge 哦o 哨shao 哩li 哪na 哭ku 哮xiao 哲zhe 哺bu 哼heng 唁yan 唆suo 唇chun 唉ai 唐tang 唤huan 唬hu 售shou 唯wei 唱chang 唾tuo 啃ken 啄zhuo 商shang 啊a 啡fei 啤pi 啥sha 啦la 啪pa 啮nie 啸xiao 啼ti 喀ka 喂wei 善shan 喇la 喉hou 喊han 喘chuan 喜xi 喝he 喧xuan 喳zha 喷pen 喻yu 嗅xiu 嗓sang 嗜shi 嗡weng 嗣si 嗽sou 嘉jia 嘎ga 嘘xu 嘛ma 嘱zhu 嘲chao 嘴zui 嘶si 嘻xi 嘿hei 噎ye 器qi 噪zao 噬shi 噶ga 嚎hao 嚏ti 嚣xiao 嚷rang 嚼jue 囊nang 囚qiu 四si 回hui 因yin 团tuan 囤dun 园yuan 困kun 囱cong 围wei 固gu 国guo 图tu 圃pu 圆yuan 圈quan 土tu 圣sheng 在zai 圭gui 地di 场chang 圾ji 址zhi 均jun 坊fang 坍tan 坎kan 坏huai 坐zuo 坑keng 块kuai 坚jian 坛tan 坝ba 坞wu 坟fen 坠zhui 坡po 坤kun 坦tan 坪ping 坯pi 坷ke 垂chui 垃la 垄long 型xing 垒lei 垛duo 垢gou 垣yuan 垦ken 垫dian 垮kua 埂geng 埃ai 埋mai 城cheng 埔pu 域yu 埠bu 培pei 基ji 堂tang 堆dui 堑qian 堕duo 堡bao 堤di 堪kan 堰yan 堵du 塌ta 塑su 塔ta 塘tang 塞sai 填tian 境jing 墅shu 墒shang 墓mu 墙qiang 增zeng 墟xu 墨mo 墩dun 壁bi 壕hao 壤rang 士shi 壬ren 壮zhuang 声sheng 壳ke 壶hu 壹yi 处chu 备bei 复fu 夏xia 夕xi 外wai 多duo 夜ye 够gou 大da 天tian 太tai 夫fu 央yang 夯hang 失shi 头tou 夷yi 夸kua 夹jia 夺duo 奄yan 奇qi 奈nai 奉feng 奋fen 奎kui 奏zou 契qi 奔ben 奖jiang 套tao 奠dian 奢she 奥ao 女nv 奴nu 奶nai 奸jian 她ta 好hao 如ru 妄wang 妆zhuang 妇fu 妈ma 妊ren 妒du 妓ji 妖yao 妙miao 妥tuo 妨fang 妮ni 妹mei 妻qi 姆mu 始shi 姐jie 姑gu 姓xing 委wei 姚yao 姜jiang 姥lao 姨yi 姬ji 姻yin 姿zi 威wei 娃wa 娄lou 娇jiao 娘niang 娜na 娟juan 娠shen 娥e 娩mian 娱yu 娶qu 婆po 婉wan 婚hun 婪lan 婴ying 婶shen 婿xu 媒mei 媚mei 媳xi 嫁jia 嫂sao 嫉ji 嫌xian 嫡di 嫩nen 子zi 孔kong 孕yun 字zi 存cun 孙sun 孜zi 孝xiao 孟meng 季ji 孤gu 学xue 孩hai 孪luan 孰shu 孵fu 孺ru 孽nie 宁ning 它ta 宅zhai 宇yu 守shou 安an 宋song 完wan 宏hong 宗zong 官guan 宙zhou 定ding 宛wan 宜yi 宝bao 实shi 宠chong 审shen 客ke 宣xuan 室shi 宦huan 宪xian 宫gong 宰zai 害hai 宴yan 宵xiao 家jia 容rong 宽kuan 宾bin 宿su 寂ji 寄ji 寅yin 密mi 寇kou 富fu 寐mei 寒han 寓yu 寝qin 寞mo 察cha 寡gua 寥liao 寨zhai 寸cun 对dui 寺si 寻xun 导dao 寿shou 封feng 射she 将jiang 尉wei 尊zun 小xiao 少shao 尔er 尖jian 尘chen 尚shang 尝chang 尤you 尧yao 就jiu 尸shi 尹yin 尺chi 尼ni 尽jin 尾wei 尿niao 局ju 屁pi 层ceng 居ju 屈qu 屉ti 届jie 屋wu 屎shi 屏ping 屑xie 展zhan 属shu 屠tu 屡lv 履lv 屯tun 山shan 屹yi 屿yu 岁sui 岂qi 岔cha 岗gang 岛dao 岩yan 岭ling 岳yue 岸an 岿kui 峙zhi 峡xia 峦luan 峨e 峪yu 峭qiao 峰feng 峻jun 崇chong 崎qi 崔cui 崖ya 崩beng 崭zhan 嵌qian 巍wei 川chuan 州zhou 巡xun 巢chao 工gong 左zuo 巧qiao 巨ju 巩gong 巫wu 差cha 己ji 已yi 巳si 巴ba 巷xiang 巾jin 币bi 市shi 布bu 帅shuai 帆fan 师shi 希xi 帐zhang 帕pa 帖tie 帘lian 帚zhou 帛bo 帜zhi 帝di 带dai 帧zhen 席xi 帮bang 常chang 帽mao 幂mi 幅fu 幌huang 幕mu 幢chuang 干gan 平ping 年nian 并bing 幸xing 幻huan 幼you 幽you 广guang 庄zhuang 庆qing 庇bi 床chuang 序xu 庐lu 库ku 应ying 底di 店dian 庙miao 庚geng 府fu 庞pang 废fei 度du 座zuo 庭ting 庶shu 康kang 庸yong 廉lian 廊lang 廓kuo 廖liao 延yan 廷ting 建jian 开kai 异yi 弃qi 弄nong 弊bi 式shi 弓gong 引yin 弗fu 弘hong 弛chi 弟di 张zhang 弥mi 弦xian 弧hu 弯wan 弱ruo 弹dan 强qiang 归gui 当dang 录lu 彝yi 形xing 彤tong 彦yan 彩cai 彪biao 彬bin 彭peng 彰zhang 影ying 役yi 彻che 彼bi 往wang 征zheng 径jing 待dai 很hen 徊huai 律lv 徐xu 徒tu 得de 徘pai 御yu 循xun 微wei 德de 徽hui 心xin 必bi 忆yi 忌ji 忍ren 志zhi 忘wang 忙mang 忠zhong 忧you 快kuai 忱chen 念nian 忻xin 忽hu 忿fen 怀huai 态tai 怂song 怎zen 怒nu 怔zheng 怕pa 怖bu 怜lian 思si 怠dai 急ji 性xing 怨yuan 怪guai 怯qie 总zong 恃shi 恋lian 恍huang 恐kong 恒heng 恕shu 恢hui 恤xu 恨hen 恩en 恫dong 恬tian 恭gong 息xi 恰qia 恳ken 恶e 恼nao 恿yong 悄qiao 悉xi 悍han 悔hui 悟wu 悠you 患huan 悦yue 您nin 悬xuan 悯min 悲bei 悸ji 悼dao 情qing 惊jing 惋wan 惑huo 惕ti 惜xi 惟wei 惠hui 惦dian 惧ju 惨can 惩cheng 惫bei 惭can 惮dan 惯guan 惰duo 想xiang 惶huang 惹re 惺xing 愁chou 愈yu 愉yu 意yi 愚yu 感gan 愤fen 愧kui 愿yuan 慈ci 慌huang 慎shen 慑she 慕mu 慢man 慧hui 慨kai 慰wei 慷kang 憋bie 憎zeng 憨han 憾han 懂dong 懈xie 懊ao 懒lan 懦nuo 戈ge 戊wu 戌xu 戍shu 戎rong 戏xi 成cheng 我wo 戒jie 或huo 战zhan 戚qi 截jie 戮lu 戳chuo 戴dai 户hu 房fang 所suo 扁bian 扇shan 手shou 才cai 扎zha 扑pu 扒ba 打da 扔reng 托tuo 扛kang 扣kou 扦qian 执zhi 扩kuo 扫sao 扬yang 扭niu 扮ban 扯che 扰rao 扳ban 扶fu 批pi 扼e 找zhao 承cheng 技ji 抄chao 抉jue 把ba 抑yi 抒shu 抓zhua 投tou 抖dou 抗kang 折zhe 抚fu 抛pao 抠kou 抡lun 抢qiang 护hu 报bao 抨peng 披pi 抬tai 抱bao 抵di 抹mo 押ya 抽chou 抿min 拂fu 拄zhu 担dan 拆chai 拇mu 拈nian 拉la 拌ban 拍pai 拎lin 拐guai 拒ju 拓tuo 拔ba 拖tuo 拘ju 拙zhuo 招zhao 拜bai 拟ni 拢long 拣jian 拥yong 拦lan 拧ning 拨bo 择ze 括kuo 拭shi 拯zheng 拱gong 拳quan 拴shuan 拷kao 拼pin 拽zhuai 拾shi 拿na 持chi 挂gua 指zhi 按an 挎kua 挑tiao 挖wa 挚zhi 挛luan 挝wo 挞ta 挟xie 挠nao 挡dang 挣zheng 挤ji 挥hui 挨ai 挪nuo 挫cuo 振zhen 挺ting 挽wan 捂wu 捅tong 捆kun 捉zhuo 捌ba 捍han 捎shao 捏nie 捐juan 捕bu 捞lao 损sun 捡jian 换huan 捣dao 捧peng 据ju 捶chui 捷jie 捻nian 掀xian 掂dian 掇duo 授shou 掉diao 掌zhang 掏tao 掐qia 排pai 掖ye 掘jue 掠lve 探tan 掣che 接jie 控kong 推tui 掩yan 措cuo 掳lu 掷zhi 掸dan 掺can 揉rou 揍zou 描miao 提ti 插cha 揖yi 握wo 揣chuai 揩kai 揪jiu 揭jie 援yuan 揽lan 搀chan 搁ge 搂lou 搅jiao 搏bo 搐chu 搓cuo 搔sao 搜sou 搞gao 搪tang 搬ban 搭da 携xie 搽cha 摄she 摆bai 摇yao 摈bin 摊tan 摔shuai 摘zhai 摧cui 摩mo 摸mo 摹mo 撂liao 撅jue 撇pie 撑cheng 撒sa 撕si 撞zhuang 撤che 撩liao 撬qiao 播bo 撮cuo 撰zhuan 撵nian 撼han 擂lei 擅shan 操cao 擎qing 擒qin 擞sou 擦ca 攀pan 攒zan 攘rang 攫jue 支zhi 收shou 改gai 攻gong 放fang 政zheng 故gu 效xiao 敌di 敏min 救jiu 敖ao 教jiao 敛lian 敝bi 敞chang 敢gan 散san 敦dun 敬jing 数shu 敲qiao 整zheng 敷fu 文wen 斋zhai 斌bin 斑ban 斗dou 料liao 斜xie 斟zhen 斡wo 斤jin 斥chi 斧fu 斩zhan 断duan 斯si 新xin 方fang 施shi 旁pang 旅lv 旋xuan 族zu 旗qi 无wu 既ji 日ri 旦dan 旧jiu 旨zhi 早zao 旬xun 旭xu 旱han 时shi 旷kuang 旺wang 昂ang 昆kun 昌chang 明ming 昏hun 易yi 昔xi 星xing 映ying 春chun 昧mei 昨zuo 昭zhao 是shi 昼zhou 显xian 晃huang 晋jin 晌shang 晒shai 晓xiao 晕yun 晚wan 晤wu 晦hui 晨chen 普pu 景jing 晰xi 晴qing 晶jing 智zhi 晾liang 暂zan 暇xia 暑shu 暖nuan 暗an 暮mu 暴bao 曙shu 曝pu 曰yue 曲qu 曳ye 更geng 曹cao 曼man 曾ceng 替ti 最zui 月yue 有you 朋peng 服fu 朔shuo 朗lang 望wang 朝chao 期qi 木mu 未wei 末mo 本ben 札zha 术shu 朱zhu 朴pu 朵duo 机ji 朽xiu 杀sha 杂za 权quan 杆gan 杉shan 李li 杏xing 材cai 村cun 杖zhang 杜du 束shu 杠gang 条tiao 来lai 杨yang 杭hang 杯bei 杰jie 松song 板ban 极ji 构gou 枉wang 析xi 枕zhen 林lin 枚mei 果guo 枝zhi 枢shu 枣zao 枪qiang 枫feng 枯ku 架jia 枷jia 柄bing 柏bai 某mou 柑gan 柒qi 染ran 柔rou 柜gui 柞zha 柠ning 查cha 柬jian 柯ke 柱zhu 柳liu 柴chai 柿shi 栅zha 标biao 栈zhan 栋dong 栏lan 树shu 栓shuan 栖qi 栗li 校xiao 株zhu 样yang 核he 根gen 格ge 栽zai 桂gui 桃tao 桅wei 框kuang 案an 桌zhuo 桐tong 桑sang 桓huan 桔ju 档dang 桥qiao 桨jiang 桩zhuang 桶tong 梁liang 梅mei 梆bang 梗geng 梢shao 梦meng 梧wu 梨li 梭suo 梯ti 械xie 梳shu 检jian 棉mian 棋qi 棍gun 棒bang 棕zong 棘ji 棚peng 棠tang 森sen 棱leng 棵ke 棺guan 椅yi 植zhi 椎chui 椒jiao 椭tuo 椰ye 椽chuan 椿chun 楔xie 楚chu 楞leng 楷kai 楼lou 概gai 榆yu 榔lang 榜bang 榨zha 榴liu 榷que 槐huai 槛kan 槽cao 樊fan 樟zhang 模mo 横heng 樱ying 橇qiao 橙cheng 橡xiang 橱chu 檀tan 檄xi 檬meng 欠qian 次ci 欢huan 欣xin 欧ou 欲yu 欺qi 款kuan 歇xie 歉qian 歌ge 止zhi 正zheng 此ci 步bu 武wu 歧qi 歪wai 歹dai 死si 歼jian 殃yang 殆dai 殉xun 殊shu 残can 殖zhi 殴ou 段duan 殷yin 殿dian 毁hui 毅yi 毋wu 母mu 每mei 毒du 比bi 毕bi 毖bi 毗pi 毙bi 毛mao 毡zhan 毫hao 毯tan 氏shi 民min 氓mang 气qi 氖nai 氛fen 氟fu 氢qing 氦hai 氧yang 氨an 氮dan 氯lv 氰qing 水shui 永yong 汀ting 汁zhi 求qiu 汇hui 汉han 汐xi 汕shan 汗han 汛xun 汝ru 汞gong 江jiang 池chi 污wu 汤tang 汪wang 汰tai 汲ji 汹xiong 汽qi 汾fen 沁qin 沂yi 沃wo 沈shen 沉chen 沏qi 沙sha 沛pei 沟gou 没mei 沤ou 沥li 沦lun 沧cang 沪hu 沫mo 沮ju 河he 沸fei 油you 治zhi 沼zhao 沽gu 沾zhan 沿yan 泄xie 泅qiu 泉quan 泊po 泌mi 法fa 泛fan 泞ning 泡pao 波bo 泣qi 泥ni 注zhu 泪lei 泰tai 泳yong 泵beng 泻xie 泼po 泽ze 洁jie 洋yang 洒sa 洗xi 洛luo 洞dong 津jin 洪hong 洱er 洲zhou 活huo 洼wa 洽qia 派pai 流liu 浅qian 浆jiang 浇jiao 浊zhuo 测ce 济ji 浑hun 浓nong 浙zhe 浚jun 浦pu 浩hao 浪lang 浮fu 浴yu 海hai 浸jin 涂tu 涅nie 消xiao 涉she 涌yong 涎xian 涕ti 涛tao 涝lao 涟lian 涡wo 涣huan 涤di 润run 涧jian 涨zhang 涩se 涪fu 涯ya 液ye 涵han 涸he 淀dian 淄zi 淆xiao 淋lin 淌tang 淑shu 淖nao 淘tao 淡dan 淤yu 淫yin 淬cui 淮huai 深shen 淳chun 混hun 淹yan 添tian 清qing 渊yuan 渍zi 渐jian 渔yu 渗shen 渝yu 渠qu 渡du 渣zha 渤bo 温wen 渭wei 港gang 渴ke 游you 渺miao 湃pai 湍tuan 湖hu 湘xiang 湛zhan 湾wan 湿shi 溃kui 溅jian 溉gai 源yuan 溜liu 溢yi 溪xi 溯su 溶rong 溺ni 滁chu 滇dian 滋zi 滑hua 滓zi 滔tao 滚gun 滞zhi 满man 滤lv 滥lan 滦luan 滨bin 滩tan 滴di 漂piao 漆qi 漏lou 漓li 演yan 漠mo 漫man 漱shu 漳zhang 漾yang 潍wei 潘pan 潜qian 潞lu 潦lao 潭tan 潮chao 澄cheng 澈che 澎peng 澜lan 澡zao 澳ao 激ji 濒bin 瀑pu 灌guan 火huo 灭mie 灯deng 灰hui 灵ling 灶zao 灸jiu 灼zhuo 灾zai 灿can 炉lu 炊chui 炎yan 炒chao 炔que 炕kang 炙zhi 炬ju 炭tan 炮pao 炯jiong 炳bing 炸zha 点dian 炼lian 炽chi 烁shuo 烂lan 烃ting 烈lie 烘hong 烙lao 烛zhu 烟yan 烤kao 烦fan 烧shao 烩hui 烫tang 烬jin 热re 烯xi 烷wan 烹peng 烽feng 焉yan 焊han 焕huan 焙bei 焚fen 焦jiao 焰yan 然ran 煌huang 煎jian 煞sha 煤mei 照zhao 煮zhu 煽shan 熄xi 熊xiong 熏xun 熔rong 熙xi 熟shu 熬ao 燃ran 燎liao 燕yan 燥zao 爆bao 爪zhao 爬pa 爱ai 爵jue 父fu 爷ye 爸ba 爹die 爽shuang 片pian 版ban 牌pai 牙ya 牛niu 牟mou 牡mu 牢lao 牧mu 物wu 牲sheng 牵qian 特te 牺xi 犀xi 犁li 犊du 犬quan 犯fan 状zhuang 犹you 狂kuang 狄di 狈bei 狐hu 狗gou 狙ju 狞ning 狠hen 狡jiao 独du 狭xia 狮shi 狰zheng 狱yu 狸li 狼lang 猎lie 猖chang 猛meng 猜cai 猩xing 猪zhu 猫mao 献xian 猴hou 猾hua 猿yuan 獭ta 玄xuan 率lv 玉yu 王wang 玖jiu 玛ma 玩wan 玫mei 环huan 现xian 玲ling 玻bo 珊shan 珍zhen 珐fa 珠zhu 班ban 球qiu 琅lang 理li 琉liu 琐suo 琢zuo 琳lin 琴qin 琵pi 琶pa 琼qiong 瑚hu 瑞rui 瑟se 瑰gui 瑶yao 璃li 瓜gua 瓢piao 瓣ban 瓤rang 瓦wa 瓮weng 瓶ping 瓷ci 甄zhen 甘gan 甚shen 甜tian 生sheng 甥sheng 用yong 甩shuai 甫fu 甭beng 田tian 由you 甲jia 申shen 电dian 男nan 甸dian 画hua 畅chang 界jie 畏wei 畔pan 留liu 畜chu 略lve 畦qi 番fan 畴chou 畸ji 疆jiang 疏shu 疑yi 疗liao 疙ge 疚jiu 疟nve 疡yang 疤ba 疥jie 疫yi 疮chuang 疯feng 疲pi 疵ci 疹zhen 疼teng 疽ju 疾ji 病bing 症zheng 痈yong 痉jing 痊quan 痒yang 痔zhi 痕hen 痘dou 痛tong 痞pi 痢li 痪huan 痰tan 痴chi 痹bi 瘁cui 瘟wen 瘤liu 瘦shou 瘩da 瘪bie 瘫tan 瘴zhang 瘸que 癌ai 癣xuan 癸gui 登deng 白bai 百bai 皂zao 的de 皆jie 皇huang 皋gao 皑ai 皖wan 皮pi 皱zhou 皿min 盂yu 盅zhong 盆pen 盈ying 益yi 盎ang 盏zhan 盐yan 监jian 盒he 盔kui 盖gai 盗dao 盘pan 盛sheng 盟meng 目mu 盯ding 盲mang 直zhi 相xiang 盼pan 盾dun 省sheng 眉mei 看kan 真zhen 眠mian 眨zha 眩xuan 眯mi 眶kuang 眷juan 眺tiao 眼yan 着zhe 睁zheng 睛jing 睡shui 督du 睦mu 睫jie 睬cai 睹du 瞄miao 瞅chou 瞎xia 瞒man 瞥pie 瞧qiao 瞩zhu 瞪deng 瞬shun 瞳tong 瞻zhan 矗chu 矛mao 矢shi 矣yi 知zhi 矩ju 矫jiao 短duan 矮ai 石shi 矽xi 矾fan 矿kuang 码ma 砂sha 砌qi 砍kan 砒pi 研yan 砖zhuan 砚yan 砧zhen 砰peng 破po 砷shen 砸za 砾li 础chu 硅gui 硒xi 硕shuo 硝xiao 硫liu 硬ying 确que 硷jian 硼peng 碉diao 碌lu 碍ai 碎sui 碑bei 碗wan 碘dian 碟die 碧bi 碰peng 碱jian 碳tan 碴cha 碾nian 磁ci 磅bang 磊lei 磋cuo 磐pan 磕ke 磨mo 磷lin 磺huang 礁jiao 示shi 礼li 社she 祁qi 祈qi 祖zu 祝zhu 神shen 祟sui 祥xiang 票piao 祭ji 祷dao 祸huo 禁jin 禄lu 福fu 禹yu 离li 禽qin 禾he 秀xiu 私si 秃tu 秆gan 秉bing 秋qiu 种zhong 科ke 秒miao 秘mi 租zu 秤cheng 秦qin 秧yang 秩zhi 积ji 称cheng 秸jie 移yi 秽hui 稀xi 程cheng 稍shao 税shui 稗bai 稚zhi 稠chou 稳wen 稻dao 稼jia 稽ji 稿gao 穆mu 穗sui 穴xue 究jiu 穷qiong 空kong 穿chuan 突tu 窃qie 窄zhai 窍qiao 窑yao 窒zhi 窖jiao 窗chuang 窘jiong 窜cuan 窝wo 窟ku 窥kui 窿long 立li 竖shu 站zhan 竞jing 竟jing 章zhang 竣jun 童tong 竭jie 端duan 竹zhu 竿gan 笆ba 笋sun 笑xiao 笔bi 笛di 符fu 笨ben 第di 笺jian 笼long 等deng 筋jin 筏fa 筐kuang 筑zhu 筒tong 答da 策ce 筛shai 筷kuai 筹chou 签qian 简jian 箍gu 箔bo 箕ji 算suan 管guan 箩luo 箭jian 箱xiang 篆zhuan 篇pian 篓lou 篙gao 篡cuan 篮lan 篱li 篷peng 簇cu 簧huang 簿bu 籍ji 米mi 类lei 籽zi 粉fen 粒li 粕po 粗cu 粘zhan 粟su 粤yue 粥zhou 粪fen 粮liang 粱liang 粳jing 粹cui 精jing 糊hu 糕gao 糖tang 糙cao 糜mi 糟zao 糠kang 糯nuo 系xi 紊wen 素su 索suo 紧jin 紫zi 累lei 絮xu 繁fan 纂zuan 纠jiu 红hong 纤xian 约yue 级ji 纪ji 纫ren 纬wei 纯chun 纱sha 纲gang 纳na 纵zong 纶lun 纷fen 纸zhi 纹wen 纺fang 纽niu 线xian 练lian 组zu 绅shen 细xi 织zhi 终zhong 绊ban 绍shao 绎yi 经jing 绑bang 绒rong 结jie 绕rao 绘hui 给gei 绚xuan 络luo 绝jue 绞jiao 统tong 绢juan 绣xiu 绥sui 绦tao 继ji 绩ji 绪xu 续xu 绰chuo 绳sheng 维wei 绵mian 绷beng 绸chou 综zong 绽zhan 绿lv 缀zhui 缄jian 缅mian 缆lan 缉ji 缎duan 缓huan 缔di 缕lv 编bian 缘yuan 缚fu 缝feng 缠chan 缨ying 缩suo 缮shan 缴jiao 缸gang 缺que 罐guan 网wang 罕han 罗luo 罚fa 罢ba 罩zhao 罪zui 置zhi 署shu 羊yang 羌qiang 美mei 羔gao 羚ling 羞xiu 羡xian 群qun 羹geng 羽yu 翁weng 翅chi 翌yi 翔xiang 翘qiao 翟di 翠cui 翰han 翱ao 翻fan 翼yi 耀yao 老lao 考kao 者zhe 而er 耍shua 耐nai 耕geng 耗hao 耘yun 耙ba 耪pang 耳er 耶ye 耸song 耻chi 耽dan 耿geng 聂nie 聊liao 聋long 职zhi 联lian 聘pin 聚ju 聪cong 肃su 肄yi 肆si 肇zhao 肉rou 肋le 肌ji 肖xiao 肘zhou 肚du 肛gang 肝gan 肠chang 股gu 肢zhi 肤fu 肥fei 肩jian 肪fang 肮ang 肯ken 育yu 肺fei 肾shen 肿zhong 胀zhang 胁xie 胃wei 胆dan 背bei 胎tai 胖pang 胚pei 胜sheng 胞bao 胡hu 胯kua 胰yi 胳ge 胶jiao 胸xiong 胺an 能neng 脂zhi 脆cui 脉mai 脊ji 脏zang 脐qi 脑nao 脓nong 脖bo 脚jiao 脯pu 脱tuo 脸lian 脾pi 腆tian 腊la 腋ye 腐fu 腑fu 腔qiang 腕wan 腥xing 腮sai 腰yao 腹fu 腺xian 腻ni 腾teng 腿tui 膀bang 膊bo 膏gao 膘biao 膛tang 膜mo 膝xi 膨peng 膳shan 臀tun 臂bi 臃yong 臆yi 臣chen 自zi 臭chou 至zhi 致zhi 臻zhen 臼jiu 舀yao 舅jiu 舆yu 舌she 舍she 舒shu 舔tian 舜shun 舞wu 舟zhou 航hang 般ban 舰jian 舱cang 舵duo 舶bo 舷xian 船chuan 艇ting 艘sou 良liang 艰jian 色se 艳yan 艺yi 艾ai 节jie 芋yu 芍shao 芒mang 芜wu 芝zhi 芥jie 芦lu 芬fen 芭ba 芯xin 花hua 芳fang 芹qin 芽ya 苇wei 苍cang 苏su 苑yuan 苔tai 苗miao 苛ke 苞bao 苟gou 若ruo 苦ku 苫shan 苯ben 英ying 苹ping 茁zhuo 茂mao 范fan 茄jia 茅mao 茎jing 茧jian 茨ci 茫mang 茬cha 茵yin 茶cha 茸rong 茹ru 荆jing 草cao 荐jian 荒huang 荔li 荚jia 荡dang 荣rong 荤hun 荧ying 荫yin 药yao 荷he 莆pu 莉li 莎sha 莫mo 莱lai 莲lian 获huo 莹ying 莽mang 菇gu 菊ju 菌jun 菏he 菜cai 菠bo 菩pu 菱ling 菲fei 萄tao 萌meng 萍ping 萎wei 萝luo 萤ying 营ying 萧xiao 萨sa 落luo 著zhu 葛ge 葡pu 董dong 葫hu 葬zang 葱cong 葵kui 蒂di 蒋jiang 蒙meng 蒜suan 蒲pu 蒸zheng 蓄xu 蓉rong 蓑suo 蓖bi 蓝lan 蓟ji 蓬peng 蔑mie 蔓man 蔗zhe 蔚wei 蔡cai 蔫nian 蔬shu 蔷qiang 蔼ai 蔽bi 蕉jiao 蕊rui 蕴yun 蕾lei 薄bao 薛xue 薪xin 薯shu 藉ji 藏cang 藐miao 藕ou 藤teng 藩fan 藻zao 蘑mo 蘸zhan 虎hu 虏lu 虐nve 虑lv 虚xu 虞yu 虫chong 虱shi 虹hong 虽sui 虾xia 蚀shi 蚁yi 蚂ma 蚊wen 蚌bang 蚕can 蚜ya 蚤zao 蛀zhu 蛆qu 蛇she 蛊gu 蛋dan 蛔hui 蛙wa 蛛zhu 蛤ha 蛮man 蛰zhe 蛹yong 蛾e 蜀shu 蜂feng 蜒yan 蜕tui 蜗wo 蜘zhi 蜜mi 蜡la 蝇ying 蝉chan 蝎xie 蝗huang 蝴hu 蝶die 融rong 螟ming 螺luo 蟹xie 蠕ru 蠢chun 血xue 衅xin 行xing 衍yan 衔xian 街jie 衙ya 衡heng 衣yi 补bu 表biao 衫shan 衬chen 衰shuai 衷zhong 袁yuan 袄ao 袋dai 袍pao 袒tan 袖xiu 袜wa 被bei 袭xi 袱fu 裁cai 裂lie 装zhuang 裔yi 裕yu 裙qun 裤ku 裳shang 裴pei 裸luo 裹guo 褂gua 褐he 褒bao 褥ru 褪tui 襄xiang 襟jin 西xi 要yao 覆fu 见jian 观guan 规gui 觅mi 视shi 览lan 觉jue 角jiao 解jie 触chu 言yan 詹zhan 誉yu 誊teng 誓shi 警jing 譬pi 计ji 订ding 讣fu 认ren 讥ji 讨tao 让rang 讫qi 训xun 议yi 讯xun 记ji 讲jiang 讳hui 讶ya 许xu 讹e 论lun 讼song 讽feng 设she 访fang 诀jue 证zheng 评ping 诅zu 识shi 诈zha 诉su 诊zhen 诌zhou 词ci 译yi 试shi 诗shi 诚cheng 诛zhu 话hua 诞dan 诡gui 询xun 诣yi 该gai 详xiang 诧cha 诫jie 诬wu 语yu 误wu 诱you 诲hui 说shuo 诵song 请qing 诸zhu 诺nuo 读du 诽fei 课ke 谁shui 调diao 谅liang 谆zhun 谈tan 谊yi 谋mou 谍die 谎huang 谐xie 谓wei 谗chan 谚yan 谜mi 谢xie 谣yao 谤bang 谦qian 谨jin 谩man 谬miu 谭tan 谰lan 谱pu 谴qian 谷gu 豁huo 豆dou 豌wan 象xiang 豢huan 豪hao 豫yu 豹bao 豺chai 貉hao 貌mao 贝bei 贞zhen 负fu 贡gong 财cai 责ze 贤xian 败bai 账zhang 货huo 质zhi 贩fan 贪tan 贫pin 贬bian 购gou 贮zhu 贯guan 贰er 贱jian 贴tie 贵gui 贷dai 贸mao 费fei 贺he 贼zei 贾jia 贿hui 赁lin 赂lu 赃zang 资zi 赊she 赋fu 赌du 赎shu 赏shang 赐ci 赔pei 赖lai 赘zhui 赚zhuan 赛sai 赞zan 赠zeng 赡shan 赢ying 赣gan 赤chi 赦she 赫he 走zou 赴fu 赵zhao 赶gan 起qi 趁chen 超chao 越yue 趋qu 趟tang 趣qu 足zu 趴pa 趾zhi 跃yue 跋ba 跌die 跑pao 距ju 跟gen 跨kua 跪gui 路lu 跳tiao 践jian 跺duo 踊yong 踌chou 踏ta 踞ju 踢ti 踩cai 踪zong 蹄ti 蹈dao 蹋ta 蹦beng 蹬deng 蹭ceng 蹲dun 蹿cuan 躁zao 躇chu 身shen 躬gong 躯qu 躲duo 躺tang 车che 轧ya 轨gui 轩xuan 转zhuan 轮lun 软ruan 轰hong 轴zhou 轻qing 载zai 轿jiao 较jiao 辅fu 辆liang 辈bei 辉hui 辊gun 辐fu 辑ji 输shu 辕yuan 辖xia 辗nian 辙zhe 辛xin 辜gu 辞ci 辟pi 辣la 辨bian 辩bian 辫bian 辰chen 辱ru 边bian 辽liao 达da 迁qian 迂yu 迄qi 迅xun 过guo 迈mai 迎ying 运yun 近jin 返fan 还hai 这zhe 进jin 远yuan 违wei 连lian 迟chi 迢tiao 迪di 迫po 迭die 述shu 迷mi 迸beng 迹ji 追zhui 退tui 送song 适shi 逃tao 逆ni 选xuan 逊xun 透tou 逐zhu 递di 途tu 逗dou 通tong 逛guang 逝shi 逞cheng 速su 造zao 逢feng 逮dai 逸yi 逻luo 逼bi 逾yu 遁dun 遂sui 遇yu 遍bian 遏e 道dao 遗yi 遣qian 遥yao 遭zao 遮zhe 遵zun 避bi 邀yao 邑yi 邓deng 邢xing 那na 邦bang 邪xie 邮you 邯han 邱qiu 邵shao 邹zou 邻lin 郁yu 郊jiao 郎lang 郑zheng 郝hao 郡jun 郧yun 部bu 郭guo 郴chen 郸dan 都dou 鄂e 鄙bi 酉you 酋qiu 酌zhuo 配pei 酒jiu 酗xu 酚fen 酝yun 酞tai 酣han 酥su 酪lao 酬chou 酮tong 酱jiang 酵jiao 酶mei 酷ku 酸suan 酿niang 醇chun 醉zui 醋cu 醒xing 醚mi 醛quan 采cai 釉you 释shi 里li 重zhong 野ye 量liang 金jin 釜fu 鉴jian 针zhen 钉ding 钎qian 钒fan 钓diao 钙gai 钝dun 钞chao 钟zhong 钠na 钡bei 钢gang 钥yao 钦qin 钧jun 钨wu 钩gou 钮niu 钱qian 钳qian 钵bo 钻zuan 钾jia 铀you 铁tie 铂bo 铃ling 铅qian 铆mao 铜tong 铝lv 铡zha 铣xi 铬ge 铭ming 铰jiao 铱yi 铲chan 银yin 铸zhu 铺pu 链lian 销xiao 锁suo 锄chu 锅guo 锈xiu 锋feng 锌xin 锐rui 锑ti 锗zhe 错cuo 锚mao 锡xi 锣luo 锤chui 锥zhui 锦jin 锨xian 锭ding 键jian 锯ju 锰meng 锹qiao 锻duan 镀du 镁mei 镇zhen 镊nie 镍nie 镐gao 镑bang 镜jing 镣liao 镭lei 镰lian 镶xiang 长zhang 门men 闪shan 闭bi 问wen 闯chuang 闰run 闲xian 间jian 闷men 闸zha 闹nao 闺gui 闻wen 闽min 阀fa 阁ge 阂he 阅yue 阉yan 阎yan 阐chan 阑lan 阔kuo 阜fu 队dui 阮ruan 防fang 阳yang 阴yin 阵zhen 阶jie 阻zu 阿a 陀tuo 附fu 际ji 陆lu 陇long 陈chen 陋lou 陌mo 降jiang 限xian 陕shan 陛bi 陡dou 院yuan 除chu 陨yun 险xian 陪pei 陵ling 陶tao 陷xian 隅yu 隆long 隋sui 随sui 隐yin 隔ge 隘ai 隙xi 障zhang 隧sui 隶li 难nan 雀que 雁yan 雄xiong 雅ya 集ji 雇gu 雌ci 雍yong 雏chu 雕diao 雨yu 雪xue 零ling 雷lei 雹bao 雾wu 需xu 霄xiao 震zhen 霉mei 霍huo 霓ni 霖lin 霜shuang 霞xia 露lu 霸ba 霹pi 青qing 靖jing 静jing 靛dian 非fei 靠kao 靡mi 面mian 革ge 靳jin 靴xue 靶ba 鞋xie 鞍an 鞘qiao 鞠ju 鞭bian 韦wei 韧ren 韩han 韭jiu 音yin 韵yun 韶shao 页ye 顶ding 顷qing 项xiang 顺shun 须xu 顽wan 顾gu 顿dun 颁ban 颂song 预yu 颅lu 领ling 颇po 颈jing 颊jia 颐yi 频pin 颓tui 颖ying 颗ke 题ti 颜yan 额e 颠dian 颤chan 颧quan 风feng 飘piao 飞fei 食shi 餐can 饥ji 饭fan 饮yin 饯jian 饰shi 饱bao 饲si 饵er 饶rao 饺jiao 饼bing 饿e 馁nei 馅xian 馆guan 馈kui 馋chan 馏liu 馒man 首shou 香xiang 马ma 驭yu 驮tuo 驯xun 驰chi 驱qu 驳bo 驴lv 驶shi 驹ju 驻zhu 驼tuo 驾jia 骂ma 骄jiao 骆luo 骇hai 骋cheng 验yan 骏jun 骑qi 骗pian 骚sao 骡luo 骤zhou 骨gu 骸hai 髓sui 高gao 鬃zong 鬼gui 魁kui 魂hun 魄po 魏wei 魔mo 鱼yu 鲁lu 鲍bao 鲜xian 鲤li 鲸jing 鳃sai 鳖bie 鳞lin 鸟niao 鸡ji 鸣ming 鸥ou 鸦ya 鸭ya 鸯yang 鸳yuan 鸵tuo 鸽ge 鸿hong 鹃juan 鹅e 鹊que 鹏peng 鹤he 鹰ying 鹿lu 麓lu 麦mai 麻ma 黄huang 黍shu 黎li 黑hei 黔qian 默mo 鼎ding 鼓gu 鼠shu 鼻bi 齐qi 齿chi 龄ling 龋qu 龙long 龚gong 龟gui'
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

    function codeOfChar(ch) {
      const pinyin = pinyinOf(ch)
      if (!pinyin) return ''
      const parsed = parsePinyin(pinyin)
      return parsed ? codeOf(parsed.i, parsed.f) : ''
    }

    /* ================= 键位表 ================= */
    const KEY_ROWS = [
      [
        { k: 'Q', f: ['iu'], ex: [{ h: '求', p: 'qiú', i: 'q', f: 'iu' }] },
        { k: 'W', f: ['ei'], ex: [{ h: '杯', p: 'bēi', i: 'b', f: 'ei' }] },
        { k: 'E', f: ['e'], ex: [{ h: '饿', p: 'è', i: '', f: 'e' }] },
        { k: 'R', f: ['uan'], ex: [{ h: '转', p: 'zhuǎn', i: 'zh', f: 'uan' }] },
        { k: 'T', f: ['ue'], ex: [{ h: '学', p: 'xué', i: 'x', f: 'ue' }] },
        { k: 'Y', f: ['un'], ex: [{ h: '云', p: 'yún', i: 'y', f: 'un' }] },
        { k: 'U', f: ['u'], s: 'sh', ex: [{ h: '是', p: 'shì', i: 'sh', f: 'i' }, { h: '书', p: 'shū', i: 'sh', f: 'u' }] },
        { k: 'I', f: ['i'], s: 'ch', ex: [{ h: '吃', p: 'chī', i: 'ch', f: 'i' }] },
        { k: 'O', f: ['uo', 'o'], ex: [{ h: '多', p: 'duō', i: 'd', f: 'uo' }, { h: '哦', p: 'ó', i: '', f: 'o' }] },
        { k: 'P', f: ['ie'], ex: [{ h: '写', p: 'xiě', i: 'x', f: 'ie' }] },
      ],
      [
        { k: 'A', f: ['a'], ex: [{ h: '大', p: 'dà', i: 'd', f: 'a' }] },
        { k: 'S', f: ['ong', 'iong'], ex: [{ h: '中', p: 'zhōng', i: 'zh', f: 'ong' }, { h: '穷', p: 'qióng', i: 'q', f: 'iong' }] },
        { k: 'D', f: ['ai'], ex: [{ h: '买', p: 'mǎi', i: 'm', f: 'ai' }] },
        { k: 'F', f: ['en'], ex: [{ h: '人', p: 'rén', i: 'r', f: 'en' }] },
        { k: 'G', f: ['eng'], ex: [{ h: '能', p: 'néng', i: 'n', f: 'eng' }] },
        { k: 'H', f: ['ang'], ex: [{ h: '上', p: 'shàng', i: 'sh', f: 'ang' }] },
        { k: 'J', f: ['an'], ex: [{ h: '看', p: 'kàn', i: 'k', f: 'an' }] },
        { k: 'K', f: ['ing', 'uai'], ex: [{ h: '平', p: 'píng', i: 'p', f: 'ing' }, { h: '快', p: 'kuài', i: 'k', f: 'uai' }] },
        { k: 'L', f: ['iang', 'uang'], ex: [{ h: '想', p: 'xiǎng', i: 'x', f: 'iang' }, { h: '双', p: 'shuāng', i: 'sh', f: 'uang' }] },
      ],
      [
        { k: 'Z', f: ['ou'], ex: [{ h: '走', p: 'zǒu', i: 'z', f: 'ou' }] },
        { k: 'X', f: ['ia', 'ua'], ex: [{ h: '下', p: 'xià', i: 'x', f: 'ia' }, { h: '花', p: 'huā', i: 'h', f: 'ua' }] },
        { k: 'C', f: ['ao'], ex: [{ h: '好', p: 'hǎo', i: 'h', f: 'ao' }] },
        { k: 'V', f: ['ui', 'v'], s: 'zh', ex: [{ h: '中', p: 'zhōng', i: 'zh', f: 'ong' }, { h: '会', p: 'huì', i: 'h', f: 'ui' }] },
        { k: 'B', f: ['in'], ex: [{ h: '心', p: 'xīn', i: 'x', f: 'in' }] },
        { k: 'N', f: ['iao'], ex: [{ h: '小', p: 'xiǎo', i: 'x', f: 'iao' }] },
        { k: 'M', f: ['ian'], ex: [{ h: '天', p: 'tiān', i: 't', f: 'ian' }] },
      ],
    ]

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
    const DRILL = DRILL_RAW.map(function (row) {
      return { h: row[0], p: row[1], i: row[2], f: row[3], code: codeOf(row[2], row[3]) }
    }).filter(function (item) { return item.code.length === 2 })

    /* ================= 文案 ================= */
    const ZH = {
      title: '小鹤',
      tabMap: '键位',
      tabDrill: '练习',
      tabStats: '记录',
      open: '打开小鹤双拼',
      minimize: '收起',
      opacity: '透明度',
      lock: '固定面板（内容可选中）',
      unlock: '解除固定（按住标题栏拖动）',
      anchorTitle: '重新对齐输入框（上方、等宽）',
      toFloat: '切换为浮窗（可拖动）',
      toDock: '嵌入到输入框上方',
      expand: '展开',
      kbShow: '展开双拼键盘',
      kbHide: '收起双拼键盘',
      last: '刚才',
      composing: '正在打',
      noSample: '还没有记录 — 正常打字就会自动收集',
      hints: '声母 / 韵母提示',
      initialsHint: '声母：zh = v · ch = i · sh = u',
      zeroHint: '零声母：单字母双写（啊 aa、鹅 ee），双字母照全拼（爱 ai、安 an、欧 ou），ang/eng 用 ah、eg；ü 写 v（女 nv）',
      drillTitle: '按两个键',
      drillFocus: '点这里再按键',
      correct: '正确',
      wrong: '应为',
      next: '下一个',
      restart: '重来',
      reveal: '看一下',
      revealedKeys: '这两个键',
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
      wrongTitle: '常按错的键',
      wrongRow: '该按 {a}，实按 {b} ×{n}',
      wrongNone: '还没有检测到按键混淆。',
      stallTitle: '卡壳过程（盲试 → 退格）',
      stallNone: '还没有卡壳记录。',
      backTag: '退{n}',
      tryTag: '盲试{n}',
      clear: '清空',
      slow: '慢',
      fast: '顺',
      keyTimes: '{n} 次 · 卡 {bad} 次',
      dataNote: '只存在本机',
    }
    const EN = {
      title: 'Xiaohe',
      tabMap: 'Keys',
      tabDrill: 'Drill',
      tabStats: 'Log',
      open: 'Open Xiaohe Shuangpin',
      minimize: 'Minimize',
      opacity: 'Opacity',
      lock: 'Pin panel (text selectable)',
      unlock: 'Unpin (drag by the title bar)',
      anchorTitle: 'Re-align to the composer (above, same width)',
      toFloat: 'Switch to floating window',
      toDock: 'Embed above the composer',
      expand: 'Expand',
      kbShow: 'Show the Shuangpin keyboard',
      kbHide: 'Hide the Shuangpin keyboard',
      last: 'Just now',
      composing: 'Typing',
      noSample: 'No samples yet — type normally to collect',
      hints: 'Initial / final hints',
      initialsHint: 'Initials: zh = v, ch = i, sh = u',
      zeroHint: 'No initial: a→aa, e→ee, spell two-letter finals out (ai, an, ou), ang/eng → ah, eg; ü is v (nü→nv)',
      drillTitle: 'Press two keys',
      drillFocus: 'Click here, then type',
      correct: 'Correct',
      wrong: 'Expected',
      next: 'Next',
      restart: 'Restart',
      reveal: 'Show keys',
      revealedKeys: 'These two keys',
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
      wrongTitle: 'Most-confused keys',
      wrongRow: 'Meant {a}, pressed {b} ×{n}',
      wrongNone: 'No key confusion detected yet.',
      stallTitle: 'Stall traces (blind tries → backspace)',
      stallNone: 'No stall records yet.',
      backTag: '⌫{n}',
      tryTag: 'tries {n}',
      clear: 'Clear',
      slow: 'slow',
      fast: 'smooth',
      keyTimes: '{n} times · {bad} stalls',
      dataNote: 'local only',
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
       把偏好和统计镜像到 cookie（cookie 不区分端口），换端口首次启动时恢复 ---------- */
    const MIRROR_BASE = 'dsh.xiaohe.mirror.'
    let mirrorChunks = 0

    function writeMirror(payload) {
      try {
        const encoded = encodeURIComponent(JSON.stringify(payload))
        const chunks = []
        for (let i = 0; i < encoded.length; i += 3600) chunks.push(encoded.slice(i, i + 3600))
        if (chunks.length > 40) return
        for (let i = chunks.length; i < mirrorChunks; i += 1) {
          document.cookie = MIRROR_BASE + i + '=; Max-Age=0; path=/; SameSite=Lax'
        }
        mirrorChunks = chunks.length
        chunks.forEach(function (chunk, index) {
          document.cookie = MIRROR_BASE + index + '=' + chunk + '; Max-Age=31536000; path=/; SameSite=Lax'
        })
      } catch (error) { /* ignore */ }
    }

    function readMirror() {
      try {
        const raw = String(document.cookie || '')
        const parts = {}
        raw.split(';').forEach(function (piece) {
          const eq = piece.indexOf('=')
          if (eq < 0) return
          const name = piece.slice(0, eq).trim()
          if (name.indexOf(MIRROR_BASE) !== 0) return
          const index = Number(name.slice(MIRROR_BASE.length))
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
        for (let i = 0; i < Math.max(mirrorChunks, 40); i += 1) {
          document.cookie = MIRROR_BASE + i + '=; Max-Age=0; path=/; SameSite=Lax'
        }
        mirrorChunks = 0
      } catch (error) { /* ignore */ }
    }

    function slimForMirror(stats) {
      const chars = {}
      const names = Object.keys(stats.chars || {})
      names.sort(function (a, b) { return (stats.chars[b].at || 0) - (stats.chars[a].at || 0) })
      names.slice(0, 300).forEach(function (ch) { chars[ch] = stats.chars[ch] })
      const bigram = {}
      Object.keys(stats.bigram || {})
        .sort(function (a, b) { return (stats.bigram[b] || 0) - (stats.bigram[a] || 0) })
        .slice(0, 200).forEach(function (key) { bigram[key] = stats.bigram[key] })
      const wrong = {}
      Object.keys(stats.wrong || {})
        .sort(function (a, b) { return (stats.wrong[b] || 0) - (stats.wrong[a] || 0) })
        .slice(0, 30).forEach(function (key) { wrong[key] = stats.wrong[key] })
      return {
        v: stats.v,
        rev: stats.rev,
        base: stats.base,
        chars: chars,
        keys: stats.keys || {},
        events: (stats.events || []).slice(0, 12),
        echo: (stats.echo || []).slice(0, 12),
        stalls: (stats.stalls || []).slice(0, 10),
        wrong: wrong,
        bigram: bigram,
        lastChar: stats.lastChar || '',
      }
    }

    const DEFAULT_PREFS = {
      open: false, surface: 'dock', x: null, y: null, w: 520, opacity: 0.95, locked: false,
      tab: 'map', autoHint: true, hints: false, pool: 'common',
    }
    const MIN_W = 340
    const MAX_W = 1720

    function normalizeStats(raw) {
      const out = {
        v: 2, rev: 0, chars: {}, keys: {}, events: [], echo: [],
        stalls: [], wrong: {}, bigram: {}, lastChar: '', base: 420,
      }
      if (!raw || typeof raw !== 'object') return out
      if (raw.chars && typeof raw.chars === 'object') out.chars = raw.chars
      if (raw.keys && typeof raw.keys === 'object') out.keys = raw.keys
      if (Array.isArray(raw.events)) out.events = raw.events.slice(0, 30)
      if (Array.isArray(raw.echo)) out.echo = raw.echo.slice(0, 30)
      if (Array.isArray(raw.stalls)) out.stalls = raw.stalls.slice(0, 20)
      if (raw.wrong && typeof raw.wrong === 'object') out.wrong = raw.wrong
      if (raw.bigram && typeof raw.bigram === 'object') out.bigram = raw.bigram
      if (typeof raw.lastChar === 'string') out.lastChar = raw.lastChar
      if (typeof raw.base === 'number' && raw.base > 0) out.base = raw.base
      return out
    }

    function createStore() {
      let storedPrefs = loadJSON(PREF_KEY, null)
      let storedStats = loadJSON(STAT_KEY, null)
      if (!storedStats) {
        const mirror = readMirror()
        if (mirror && mirror.stats && typeof mirror.stats === 'object') {
          saveJSON(STAT_KEY, mirror.stats)
          storedStats = mirror.stats
        }
      }
      const prefs = Object.assign({}, DEFAULT_PREFS, storedPrefs || {})
      const state = {
        prefs: prefs,
        stats: normalizeStats(storedStats),
        ui: { live: null, anchor: null },
      }
      const listeners = new Set()
      let saveTimer = null
      function save() {
        saveJSON(PREF_KEY, state.prefs)
        saveJSON(STAT_KEY, state.stats)
        writeMirror({ stats: slimForMirror(state.stats) })
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

    /** 预编辑串里最后一个能解析成拼音音节的片段（多音节/带 ' 分隔时取最后一段） */
    function longestSuffixPinyin(value) {
      const text = String(value || '').toLowerCase()
      const lastSeg = text.slice(text.lastIndexOf("'") + 1)
      for (let start = 0; start < lastSeg.length; start += 1) {
        const parsed = parsePinyin(lastSeg.slice(start))
        if (parsed) return parsed
      }
      return null
    }

    /**
     * 从预编辑轨迹里推断「按键混淆」：
     * 轨迹中一旦出现变短（退格），被删掉的后缀就是按错的键；
     * 用「退格前的状态」解析出当时按到的韵母键，和最终上屏音节的正确键对比。
     * 仅在输入法预编辑暴露拼音时可用（码类预编辑解析不出拼音，只留轨迹）。
     */
    function confusionPairs(trace, finalValue) {
      const out = []
      if (!finalValue) return out
      const finalParsed = longestSuffixPinyin(finalValue)
      if (!finalParsed) return out
      const correctKey = FINAL_KEY[finalParsed.f]
      for (let i = 0; i + 1 < trace.length; i += 1) {
        const before = trace[i]
        const after = trace[i + 1]
        if (after.length >= before.length || !/^[a-z']+$/.test(before)) continue
        const candidate = after + before.slice(after.length)
        const parsed = longestSuffixPinyin(candidate)
        if (!parsed || parsed.i !== finalParsed.i) continue
        const pressed = FINAL_KEY[parsed.f]
        if (pressed && pressed !== correctKey) out.push({ correct: correctKey, pressed: pressed })
      }
      return out
    }

    /** 字级二元统计：上一个字 → 下一个最可能打的字 */
    function predictNext(stats, fromChar) {
      if (!fromChar) return []
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
        return { ch: item.ch, p: pinyin, code: parsed ? codeOf(parsed.i, parsed.f) : '' }
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

    /** 把预编辑串按拼音音节贪心切分；complete=false 表示末尾是不完整的音节 */
    function parseSyllables(value) {
      const text = String(value || '').toLowerCase()
      const seg = text.slice(text.lastIndexOf("'") + 1)
      const syllables = []
      let start = 0
      while (start < seg.length) {
        let matched = null
        for (let end = seg.length; end > start; end -= 1) {
          const parsed = parsePinyin(seg.slice(start, end))
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
      }
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
      const codes = []
      for (let i = 0; i < chars.length; i += 1) {
        const ch = chars[i]
        const code = codeOfChar(ch)
        codes.push(code.length === 2 ? code : null)
        if (code.length !== 2) continue
        const entry = st.chars[ch] || (st.chars[ch] = { n: 0, ms: 0, bad: 0, at: 0 })
        entry.n += 1
        entry.ms += unit
        entry.at = Date.now()
        if (slow) entry.bad += 1
      }
      st.events.unshift({
        t: Date.now(), word: chars.slice(0, 12).join(''), codes: codes,
        ms: Math.round(ms), slow: slow, backs: backs || 0,
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

    /** 每个键的 { n, bad }：真实输入按字累积 + 练习按次累积 */
    function keyStatsOf(stats) {
      const map = {}
      function bump(key, n, bad) {
        const entry = map[key] || (map[key] = { n: 0, bad: 0 })
        entry.n += n
        entry.bad += bad
      }
      const chars = stats.chars || {}
      for (const ch in chars) {
        const entry = chars[ch]
        const code = codeOfChar(ch)
        if (code.length !== 2) continue
        bump(code.charAt(0), entry.n, entry.bad)
        bump(code.charAt(1), entry.n, entry.bad)
      }
      const keys = stats.keys || {}
      for (const key in keys) bump(key, keys[key].n, keys[key].bad)
      return map
    }

    function weaknessOf(entry) {
      if (!entry || !entry.n || entry.n < MIN_SAMPLE) return null
      return Math.max(0, Math.min(1, entry.bad / entry.n))
    }

    const HEAT_COLORS = {
      warn: 'var(--dsw-alias-state-warn-primary)',
      bad: 'var(--dsw-alias-state-error-primary)',
    }
    /** null = 稳（不做任何标记），warn = 不稳（黄条），bad = 常卡（红条+红边） */
    function heatLevel(weakness) {
      if (weakness === null || weakness < 0.25) return null
      return weakness < 0.45 ? 'warn' : 'bad'
    }
    function heatColor(weakness) {
      const level = heatLevel(weakness)
      return level ? HEAT_COLORS[level] : null
    }

    function totalSamples(stats) {
      let n = 0
      const chars = stats.chars || {}
      for (const ch in chars) n += chars[ch].n || 0
      return n
    }

    function personalItems(stats) {
      const items = []
      const chars = stats.chars || {}
      for (const ch in chars) {
        const entry = chars[ch]
        if (!entry || entry.n < MIN_SAMPLE || !entry.bad) continue
        const pinyin = pinyinOf(ch)
        if (!pinyin) continue
        const parsed = parsePinyin(pinyin)
        if (!parsed) continue
        const code = codeOf(parsed.i, parsed.f)
        if (code.length !== 2) continue
        items.push({ h: ch, p: pinyin, i: parsed.i, f: parsed.f, code: code, bad: entry.bad, n: entry.n })
      }
      items.sort(function (a, b) { return (b.bad - a.bad) || (b.n - a.n) })
      return items.slice(0, 40)
    }

    function poolItems(stats, pool) {
      if (pool === 'mine') {
        const mine = personalItems(stats)
        return mine.length ? mine : DRILL
      }
      return DRILL
    }

    function pickItem(stats, pool, exclude) {
      const map = keyStatsOf(stats)
      const list = poolItems(stats, pool)
      let best = null
      let bestScore = -1
      for (let i = 0; i < list.length; i += 1) {
        const item = list[i]
        if (exclude && item.code === exclude.code && list.length > 1) continue
        const w1 = weaknessOf(map[item.code.charAt(0)])
        const w2 = weaknessOf(map[item.code.charAt(1)])
        const base = ((w1 === null ? 0.4 : w1) + (w2 === null ? 0.4 : w2)) / 2
        const score = base + Math.random() * 0.45
        if (score > bestScore) {
          bestScore = score
          best = item
        }
      }
      return best || list[0] || DRILL[0]
    }

    /* ================= 输入捕获 ================= */
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

    function installTypingCapture(store) {
      let composing = null
      let compStart = 0
      let lastCommitAt = 0
      let chainTime = -1e9
      const ui = store.state.ui

      function onStart(event) {
        if (!isEditable(event.target)) return
        composing = { at: window.performance.now(), backs: 0, el: event.target, trace: [], shrinks: 0, lastData: '' }
        compStart = composing.at
        ui.live = { text: '', at: Date.now(), backs: 0 }
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
        ui.live = { text: text, at: Date.now(), backs: composing.backs }
        pushEcho(store, window.performance.now() - compStart, text)
        store.notify()
      }
      function onKeyDown(event) {
        if (composing && event.key === 'Backspace') composing.backs += 1
      }
      function onEnd(event) {
        if (!composing) return
        if (!isEditable(event.target)) { composing = null; return }
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
        const confusions = confusionPairs(trace, finalPreedit)
        recordCommit(store, text, elapsed, backs, {
          chained: chained,
          trace: trace,
          shrinks: shrinks,
          confusions: confusions,
        })
      }
      function onInput(event) {
        if (!isEditable(event.target)) return
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
        background: 'var(--dsw-alias-bg-layer-1)',
        border: '1px solid var(--dsw-alias-border-l2)',
        borderRadius: 12,
        color: 'var(--dsw-alias-label-primary)',
        fontFamily: 'inherit',
        fontSize: 12,
        overflow: 'hidden',
        marginBottom: 8,
        userSelect: 'text',
      },
      panelFloat: {
        position: 'fixed',
        zIndex: 40,
        maxWidth: 'calc(100vw - 16px)',
        maxHeight: 'calc(100vh - 24px)',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 18px 50px rgba(0,0,0,0.28)',
        pointerEvents: 'auto',
      },
      toolbarToggle: {
        appearance: 'none',
        border: '1px solid var(--dsw-alias-border-l1)',
        background: 'transparent',
        color: 'var(--dsw-alias-label-secondary)',
        fontSize: 11.5,
        lineHeight: 1,
        padding: '4px 8px',
        borderRadius: 6,
        cursor: 'pointer',
        fontFamily: 'inherit',
      },
      toolbarToggleOn: {
        borderColor: 'var(--dsw-alias-brand-primary)',
        color: 'var(--dsw-alias-brand-primary)',
      },
      slimBar: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        width: '100%',
        marginBottom: 8,
        padding: '4px 12px',
        background: 'var(--dsw-alias-bg-layer-1)',
        border: '1px solid var(--dsw-alias-border-l1)',
        borderRadius: 8,
        color: 'var(--dsw-alias-label-secondary)',
        fontSize: 11,
      },
      slimTitle: { fontWeight: 600, color: 'var(--dsw-alias-label-primary)' },
      header: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 10px',
        borderBottom: '1px solid var(--dsw-alias-border-l1)',
        cursor: 'grab',
        touchAction: 'none',
        userSelect: 'none',
      },
      grip: { color: 'var(--dsw-alias-label-secondary)', fontSize: 13, lineHeight: 1, letterSpacing: 1 },
      title: { fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' },
      spacer: { flex: '1 1 auto' },
      sliderWrap: { display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, color: 'var(--dsw-alias-label-secondary)' },
      slider: { width: 90, accentColor: 'var(--dsw-alias-brand-primary)', cursor: 'pointer' },
      iconButton: {
        appearance: 'none', border: '1px solid transparent', background: 'transparent',
        color: 'var(--dsw-alias-label-secondary)', fontSize: 11.5, lineHeight: 1,
        padding: '4px 6px', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit',
      },
      iconOn: { color: 'var(--dsw-alias-brand-primary)' },
      headerRecent: { display: 'inline-flex', alignItems: 'baseline', gap: 5, fontSize: 11 },
      headerRecentLabel: { fontSize: 9.5, color: 'var(--dsw-alias-label-secondary)' },
      headerRecentWord: { fontSize: 13, fontWeight: 600 },
      tab: {
        appearance: 'none', border: '1px solid transparent', background: 'transparent',
        color: 'var(--dsw-alias-label-secondary)', fontSize: 11.5, lineHeight: 1,
        padding: '5px 10px', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit',
      },
      tabActive: {
        background: 'var(--dsw-alias-bg-layer-2)',
        borderColor: 'var(--dsw-alias-border-l1)',
        color: 'var(--dsw-alias-label-primary)',
      },
      body: { padding: '10px 12px 12px', overflowY: 'auto', overflowX: 'hidden', minHeight: 0, userSelect: 'text', display: 'flex', flexDirection: 'column', gap: 8 },
      keyboard: { display: 'flex', flexDirection: 'column' },
      key: {
        appearance: 'none', position: 'relative', padding: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--dsw-alias-bg-layer-2)',
        border: '1px solid var(--dsw-alias-border-l1)',
        borderRadius: 6, cursor: 'pointer', overflow: 'hidden',
        fontFamily: 'inherit',
        transition: 'box-shadow 120ms ease, transform 120ms ease',
      },
      keyHot: {
        borderColor: 'var(--dsw-alias-brand-primary)',
        boxShadow: 'inset 0 0 0 1.5px var(--dsw-alias-brand-primary), 0 0 0 2px var(--dsw-alias-brand-primary)',
        transform: 'translateY(-1px)',
      },
      keyHover: { borderColor: 'var(--dsw-alias-brand-primary)' },
      keyBad: { borderColor: 'var(--dsw-alias-state-error-primary)' },
      keyPredict: {
        borderColor: 'var(--dsw-alias-label-primary)',
        boxShadow: 'inset 0 0 0 1px var(--dsw-alias-label-primary)',
      },
      keyPredictStrong: {
        borderColor: 'var(--dsw-alias-label-primary)',
        boxShadow: '0 0 0 2px var(--dsw-alias-label-primary), inset 0 0 0 1px var(--dsw-alias-label-primary)',
        transform: 'translateY(-1px)',
      },
      keyPredictChar: {
        position: 'absolute', top: 1, right: 3, fontWeight: 600,
        color: 'var(--dsw-alias-label-primary)',
      },
      keyPredictCharLow: {
        position: 'absolute', bottom: 7, right: 3, fontWeight: 600,
        color: 'var(--dsw-alias-label-primary)',
      },
      keyLetter: { position: 'absolute', top: 1, left: 4, fontWeight: 600, color: 'var(--dsw-alias-label-secondary)' },
      keyInitial: { position: 'absolute', top: 1, right: 3, color: 'var(--dsw-alias-brand-primary)' },
      keyFinal: { textAlign: 'center', color: 'var(--dsw-alias-label-primary)', lineHeight: 1.1, wordBreak: 'break-word', marginTop: '0.2em' },
      heatBar: { position: 'absolute', left: 4, right: 4, bottom: 2, height: 3, borderRadius: 2 },
      hintToggle: {
        appearance: 'none', border: '1px solid transparent', background: 'transparent',
        color: 'var(--dsw-alias-label-secondary)', fontSize: 10.5, padding: '3px 2px',
        cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
      },
      hint: { fontSize: 10.5, lineHeight: 1.55, color: 'var(--dsw-alias-label-secondary)' },
      hintStrong: { color: 'var(--dsw-alias-label-primary)' },
      drill: { display: 'flex', flexDirection: 'column', gap: 8 },
      poolRow: { display: 'flex', gap: 6, alignItems: 'center' },
      poolChip: {
        appearance: 'none', border: '1px solid var(--dsw-alias-border-l1)', background: 'transparent',
        color: 'var(--dsw-alias-label-secondary)', fontSize: 10.5, padding: '3px 8px',
        borderRadius: 999, cursor: 'pointer', fontFamily: 'inherit',
      },
      poolChipOn: {
        borderColor: 'var(--dsw-alias-brand-primary)',
        color: 'var(--dsw-alias-brand-primary)',
      },
      drillPrompt: { display: 'flex', alignItems: 'baseline', gap: 10 },
      drillHan: { fontSize: 34, fontWeight: 600, lineHeight: 1.05 },
      drillPinyin: { fontSize: 13, color: 'var(--dsw-alias-label-secondary)', letterSpacing: 0.4 },
      pad: {
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, minHeight: 48,
        borderRadius: 8, border: '1px dashed var(--dsw-alias-border-l2)',
        background: 'var(--dsw-alias-bg-layer-2)', cursor: 'text', outline: 'none',
      },
      padFocused: { borderStyle: 'solid', borderColor: 'var(--dsw-alias-brand-primary)' },
      slot: {
        width: 34, height: 34, borderRadius: 6, border: '1px solid var(--dsw-alias-border-l1)',
        background: 'var(--dsw-alias-bg-layer-1)', display: 'flex', alignItems: 'center',
        justifyContent: 'center', fontSize: 16, fontWeight: 600,
      },
      slotEmpty: { color: 'var(--dsw-alias-label-secondary)', fontWeight: 400 },
      padHint: { fontSize: 10.5, color: 'var(--dsw-alias-label-secondary)' },
      revealed: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--dsw-alias-label-secondary)' },
      chip: {
        minWidth: 28, textAlign: 'center', padding: '5px 8px', borderRadius: 6,
        border: '1px solid var(--dsw-alias-brand-primary)', color: 'var(--dsw-alias-brand-primary)',
        fontWeight: 600, fontSize: 13, letterSpacing: 1,
      },
      chipBad: { borderColor: 'var(--dsw-alias-state-error-primary)', color: 'var(--dsw-alias-state-error-primary)' },
      toggleRow: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 10.5, color: 'var(--dsw-alias-label-secondary)', cursor: 'pointer' },
      result: { fontSize: 11.5, minHeight: 17, display: 'flex', alignItems: 'center', gap: 6 },
      ok: { color: 'var(--dsw-alias-state-success-primary)' },
      bad: { color: 'var(--dsw-alias-state-error-primary)' },
      footer: { display: 'flex', alignItems: 'center', gap: 6 },
      statsText: { flex: '1 1 auto', fontSize: 10.5, color: 'var(--dsw-alias-label-secondary)' },
      action: {
        appearance: 'none', border: '1px solid var(--dsw-alias-border-l1)', background: 'transparent',
        color: 'var(--dsw-alias-label-secondary)', fontSize: 11, padding: '4px 9px',
        borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit',
      },
      sectionTitle: { fontSize: 11.5, fontWeight: 600 },
      weakRow: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 11 },
      weakKey: {
        width: 24, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center',
        borderRadius: 5, background: 'var(--dsw-alias-bg-layer-2)',
        border: '1px solid var(--dsw-alias-border-l1)', fontWeight: 600, fontSize: 11,
      },
      barTrack: { flex: '1 1 auto', height: 6, borderRadius: 3, background: 'var(--dsw-alias-bg-layer-2)', overflow: 'hidden' },
      barFill: { height: '100%', borderRadius: 3 },
      weakMeta: { fontSize: 10, color: 'var(--dsw-alias-label-secondary)', minWidth: 88, textAlign: 'right' },
      charChip: {
        display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 7px', margin: '0 4px 4px 0',
        borderRadius: 6, border: '1px solid var(--dsw-alias-border-l1)', fontSize: 12,
      },
      charChipCode: { fontSize: 9.5, color: 'var(--dsw-alias-state-error-primary)', letterSpacing: 0.5 },
      eventRow: { display: 'flex', alignItems: 'baseline', gap: 8, fontSize: 11.5 },
      eventWord: { fontSize: 13, fontWeight: 600, minWidth: 40 },
      code: { fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace', color: 'var(--dsw-alias-brand-primary)', letterSpacing: 1 },
      eventMeta: { marginLeft: 'auto', fontSize: 10, color: 'var(--dsw-alias-label-secondary)' },
      echoRow: { display: 'flex', alignItems: 'baseline', gap: 8, fontSize: 10.5 },
      echoT: { color: 'var(--dsw-alias-label-secondary)', minWidth: 62, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace' },
      wrongText: { fontSize: 11, color: 'var(--dsw-alias-label-primary)' },
      empty: { fontSize: 11, color: 'var(--dsw-alias-label-secondary)', lineHeight: 1.6 },
      gripCorner: { position: 'absolute', right: 0, bottom: 0, width: 16, height: 16, cursor: 'nwse-resize', touchAction: 'none', zIndex: 2 },
      gripLine: { position: 'absolute', right: 3, bottom: 3, width: 8, height: 8, borderRight: '2px solid var(--dsw-alias-border-l2)', borderBottom: '2px solid var(--dsw-alias-border-l2)', borderRadius: 1 },
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
          timer = window.setTimeout(function () { setFlash(null) }, 4500)
        })
      }, [store])
      return flash
    }

    function sampleText(entry) {
      const code = codeOf(entry.i, entry.f)
      return code ? entry.h + ' ' + entry.p + ' → ' + code : entry.h + ' ' + entry.p
    }

    function Keycap(props) {
      const item = props.item
      const size = props.size
      const style = Object.assign(
        {},
        S.key,
        { width: size.w, height: size.h },
        props.hot ? S.keyHot : (props.hovered ? S.keyHover : null),
        props.level === 'bad' ? S.keyBad : null,
        props.predict ? (props.predict.strong ? S.keyPredictStrong : S.keyPredict) : null,
      )
      const finalStyle = Object.assign(
        {},
        S.keyFinal,
        { fontSize: Math.max(9, Math.min(30, size.w * 0.24)) },
        props.level === 'bad' ? { color: 'var(--dsw-alias-state-error-primary)', fontWeight: 600 } : null,
      )
      return h(
        'button',
        {
          type: 'button',
          style: style,
          onMouseEnter: props.onEnter,
          onMouseLeave: props.onLeave,
          onClick: props.onClick,
          title: item.k + ' · ' + item.f.map(finalLabel).join(' / ') + ' — ' + sampleText(item.ex[0]),
          'aria-label': item.k + ' ' + item.f.map(finalLabel).join(' '),
        },
        h('span', { style: Object.assign({}, S.keyLetter, { fontSize: Math.max(8, Math.min(18, size.w * 0.2)) }) }, item.k),
        item.s ? h('span', { style: Object.assign({}, S.keyInitial, { fontSize: Math.max(8, Math.min(18, size.w * 0.19)) }) }, item.s) : null,
        h('span', { style: finalStyle }, item.f.map(finalLabel).join(' / ')),
        props.predict && props.predict.ch
          ? h('span', {
              style: Object.assign(
                {},
                item.s ? S.keyPredictCharLow : S.keyPredictChar,
                { fontSize: Math.max(8, size.w * 0.19) },
              ),
            }, props.predict.ch)
          : null,
        props.level
          ? h('span', {
              style: Object.assign(
                {},
                S.heatBar,
                props.level === 'bad'
                  ? { height: 4, background: HEAT_COLORS.bad }
                  : { background: HEAT_COLORS.warn },
              ),
            })
          : null,
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
      const keyStats = React.useMemo(function () { return keyStatsOf(stats) }, [stats, stats.rev])
      const hotKeys = {}
      if (flash && flash.event && flash.event.codes) {
        flash.event.codes.forEach(function (code) {
          if (!code) return
          hotKeys[code.charAt(0)] = true
          hotKeys[code.charAt(1)] = true
        })
      }

      const inner = width - 24
      const gap = Math.max(3, Math.round(inner * 0.01))
      const keyW = Math.max(26, Math.min(150, (inner - 9 * gap) / 10))
      const keyH = Math.round(keyW * 0.76)
      const offset = Math.round((keyW + gap) / 2)
      const blockW = 10 * keyW + 9 * gap
      const size = { w: keyW, h: keyH }

      /* 框选提示：
         - 合成中、末尾音节不完整（只打了声母）→ 框选该声母常用字的韵母键，并标出候选字
         - 合成中、音节已完整 → 轻框已按下的键（确认）
         - 平时（刚上屏）→ 框选「下一个字」的预测键（个人历史优先，常用接续兜底） */
      const predictMap = {}
      function markPredict(key, ch, strong) {
        if (!key) return
        if (!predictMap[key] || strong) predictMap[key] = { ch: ch || '', strong: strong }
      }
      if (live && live.text) {
        const seg = live.text.slice(live.text.lastIndexOf("'") + 1)
        const info = parseSyllables(seg)
        info.syllables.forEach(function (parsed) {
          markPredict(INITIAL_KEY[parsed.i] || parsed.i, '', false)
          markPredict(FINAL_KEY[parsed.f], '', false)
        })
        if (!info.complete && seg.charAt(0)) {
          const two = seg.slice(0, 2)
          const initial = COMMON_BY_INITIAL[two] ? two : seg.charAt(0)
          const candidates = COMMON_BY_INITIAL[initial] || ''
          let count = 0
          for (let i = 0; i < candidates.length && count < 5; i += 1) {
            const ch = candidates.charAt(i)
            const pinyin = pinyinOf(ch)
            const parsed = pinyin ? parsePinyin(pinyin) : null
            if (!parsed || parsed.i !== initial) continue
            markPredict(FINAL_KEY[parsed.f], ch, count === 0)
            count += 1
          }
        }
      } else {
        predictNext(stats, stats.lastChar).forEach(function (item, index) {
          const parsed = parsePinyin(item.p)
          if (!parsed) return
          markPredict(INITIAL_KEY[parsed.i] || parsed.i, item.ch, index === 0)
          markPredict(FINAL_KEY[parsed.f], '', false)
        })
      }

      const rows = KEY_ROWS.map(function (row, rowIndex) {
        return h(
          'div',
          { key: 'row-' + rowIndex, style: { display: 'flex', gap: gap, marginTop: rowIndex ? gap : 0, marginLeft: rowIndex * offset } },
          row.map(function (item) {
            const key = item.k.toLowerCase()
            const weakness = weaknessOf(keyStats[key])
            return h(Keycap, {
              key: item.k,
              item: item,
              size: size,
              hot: hotKeys[key] === true,
              hovered: hover !== null && hover.k === item.k,
              level: heatLevel(weakness),
              predict: predictMap[key] || null,
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

      return h(
        'div',
        null,
        h('div', { style: Object.assign({}, S.keyboard, { width: blockW, margin: '0 auto' }) }, rows),
        h('div', { style: chromeFade },
          h('div', { style: S.hint },
            h('div', null, h('span', { style: S.hintStrong }, t('initialsHint'))),
            h('div', null, t('zeroHint')))),
      )
    }

    function DrillTab(props) {
      const store = props.store
      const stats = props.stats
      const prefs = props.prefs
      const t = props.t
      const mine = React.useMemo(function () { return personalItems(stats) }, [stats, stats.rev])
      const [item, setItem] = React.useState(function () { return pickItem(stats, prefs.pool, null) })
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
        setItem(function (prev) { return pickItem(store.state.stats, store.state.prefs.pool, prev) })
      }

      function finish(typed) {
        const good = typed === item.code
        const st = store.state.stats
        for (let i = 0; i < item.code.length; i += 1) {
          const key = item.code.charAt(i)
          const entry = st.keys[key] || (st.keys[key] = { n: 0, bad: 0, hint: 0 })
          entry.n += 1
          if (!good) entry.bad += 1
        }
        st.rev = (st.rev || 0) + 1
        store.touch()
        setMark({ good: good, typed: typed })
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
        setItem(function () { return pickItem(store.state.stats, store.state.prefs.pool, item) })
        setBuffer('')
        setMark(null)
        setRevealed(false)
        setTally({ ok: 0, total: 0, streak: 0 })
      }

      function choosePool(pool) {
        prefs.pool = pool
        store.touch()
        setItem(function () { return pickItem(store.state.stats, pool, null) })
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
            style: { accentColor: 'var(--dsw-alias-brand-primary)' },
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
      const keyStats = React.useMemo(function () { return keyStatsOf(stats) }, [stats, stats.rev])
      const ranked = Object.keys(keyStats).map(function (key) {
        return { key: key, weakness: weaknessOf(keyStats[key]), n: keyStats[key].n, bad: keyStats[key].bad }
      }).filter(function (row) { return row.n > 0 }).sort(function (a, b) {
        return (b.weakness === null ? 0 : b.weakness) - (a.weakness === null ? 0 : a.weakness) || b.n - a.n
      }).slice(0, 5)

      const chars = React.useMemo(function () {
        return personalItems(stats).slice(0, 12)
      }, [stats, stats.rev])
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

      return h('div', { style: { display: 'flex', flexDirection: 'column', gap: 9 } },
        h('div', { style: { display: 'flex', alignItems: 'baseline', gap: 8 } },
          h('span', { style: S.sectionTitle }, t('progress').replace('{n}', total).replace('{goal}', goal)),
          h('span', { style: Object.assign({}, S.empty, { marginLeft: 'auto', fontSize: 9.5 }) }, t('dataNote'))),
        h('div', { style: S.barTrack },
          h('div', { style: Object.assign({}, S.barFill, { width: Math.max(3, pct) + '%', background: 'var(--dsw-alias-brand-primary)' }) })),
        h('div', { style: S.sectionTitle }, t('weakTitle')),
        ranked.length
          ? ranked.map(function (row) {
              const color = heatColor(row.weakness) || 'var(--dsw-alias-state-idle-primary)'
              const value = Math.round((row.weakness === null ? 0 : row.weakness) * 100)
              return h('div', { key: row.key, style: S.weakRow },
                h('span', { style: S.weakKey }, row.key.toUpperCase()),
                h('span', { style: S.barTrack }, h('span', { style: Object.assign({}, S.barFill, { width: Math.max(4, value) + '%', background: color }) })),
                h('span', { style: S.weakMeta }, t('keyTimes').replace('{n}', row.n).replace('{bad}', row.bad)))
            })
          : h('div', { style: S.empty }, t('weakNone')),
        h('div', { style: { display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 } },
          h('span', { style: S.sectionTitle }, t('charsTitle')),
          chars.length
            ? h('button', { type: 'button', style: S.action, onClick: drillThem }, t('drillThem'))
            : null),
        chars.length
          ? h('div', null, chars.map(function (item) {
              return h('span', { key: 'ch-' + item.h, style: S.charChip },
                h('span', null, item.h),
                h('span', { style: S.charChipCode }, item.code))
            }))
          : h('div', { style: S.empty }, t('charsNone')),
        h('div', { style: Object.assign({}, S.sectionTitle, { marginTop: 2 }) }, t('recentTitle')),
        events.length
          ? events.map(function (event, index) {
              return h('div', { key: 'ev-' + event.t + '-' + index, style: S.eventRow },
                h('span', { style: S.eventWord }, event.word),
                h('span', { style: S.code }, (event.codes || []).filter(Boolean).join(' ')),
                h('span', { style: S.eventMeta },
                  (event.backs ? t('backTag').replace('{n}', event.backs) + ' · ' : '') +
                  (event.slow ? t('slow') + ' · ' : '') + (event.ms ? (Math.round(event.ms / 100) / 10) + 's' : '')))
            })
          : h('div', { style: S.empty }, t('recentNone')),
        wrong.length
          ? h('div', { style: Object.assign({}, S.sectionTitle, { marginTop: 2 }) }, t('wrongTitle'))
          : null,
        wrong.length
          ? wrong.map(function (row) {
              return h('div', { key: 'wr-' + row.correct + row.pressed, style: S.weakRow },
                h('span', { style: S.wrongText },
                  t('wrongRow').replace('{a}', row.correct.toUpperCase()).replace('{b}', row.pressed.toUpperCase()).replace('{n}', row.n)))
            })
          : null,
        stalls.length
          ? h('div', { style: Object.assign({}, S.sectionTitle, { marginTop: 2 }) }, t('stallTitle'))
          : null,
        stalls.length
          ? stalls.map(function (stall, index) {
              return h('div', { key: 'st-' + stall.t + '-' + index, style: S.eventRow },
                h('span', { style: S.eventWord }, stall.word),
                h('span', { style: S.code }, (stall.seq || []).join('→')),
                h('span', { style: S.eventMeta },
                  [
                    stall.backs ? t('backTag').replace('{n}', stall.backs) : null,
                    stall.shrinks ? t('tryTag').replace('{n}', stall.shrinks) : null,
                    stall.ms ? (Math.round(stall.ms / 100) / 10) + 's' : null,
                  ].filter(Boolean).join(' · ')))
            })
          : null,
        (stats.echo && stats.echo.length)
          ? h('div', null,
              h('div', { style: Object.assign({}, S.sectionTitle, { marginBottom: 4 }) }, t('echoTitle')),
              stats.echo.slice(0, 10).map(function (row, index) {
                return h('div', { key: 'ec-' + row.t + '-' + index, style: S.echoRow },
                  h('span', { style: S.echoT }, '+' + row.t + 'ms'),
                  h('span', { style: S.code }, row.d))
              }))
          : null,
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
      children.push(h('span', { style: S.title }, t('title')))
      children.push(opts.tabButton('map', t('tabMap')))
      children.push(opts.tabButton('drill', t('tabDrill')))
      children.push(opts.tabButton('stats', t('tabStats')))
      if (opts.recentNode) children.push(opts.recentNode)
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
      const recent = state.stats.events && state.stats.events[0]
      const recentNode = recent && width >= 460
        ? h('span', { style: S.headerRecent, title: t('last') },
            h('span', { style: S.headerRecentLabel }, t('last')),
            h('span', { style: S.headerRecentWord }, Array.from(recent.word).slice(0, 4).join('')),
            h('span', { style: S.code }, (recent.codes || []).filter(Boolean).slice(0, 2).join(' ')),
            recent.slow ? h('span', { style: Object.assign({}, S.headerRecentLabel, { color: 'var(--dsw-alias-state-error-primary)' }) }, t('slow')) : null)
        : null

      let body = null
      if (prefs.tab === 'drill') body = h(DrillTab, { store: store, stats: state.stats, prefs: prefs, t: t })
      else if (prefs.tab === 'stats') body = h(StatsTab, { store: store, stats: state.stats, prefs: prefs, t: t })
      else body = h(MapTab, { store: store, stats: state.stats, prefs: prefs, t: t, flash: props.flash, width: width, live: state.ui.live, reveal: hovered })

      return h('div', {
        ref: rootRef,
        style: Object.assign({}, S.panel, { width: width, margin: '0 auto 8px' }),
        role: 'region',
        'aria-label': t('title'),
        onMouseEnter: function () { setHovered(true) },
        onMouseLeave: function () { setHovered(false) },
      },
        h('div', { style: Object.assign({}, S.header, chromeStyle, { cursor: 'default' }) },
          renderHeader({
            t: t, prefs: prefs, store: store, surface: 'dock', recentNode: recentNode,
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

      const recent = state.stats.events && state.stats.events[0]
      const recentNode = recent
        ? h('span', { style: S.headerRecent, title: t('last') },
            h('span', { style: S.headerRecentLabel }, t('last')),
            h('span', { style: S.headerRecentWord }, Array.from(recent.word).slice(0, 4).join('')),
            h('span', { style: S.code }, (recent.codes || []).filter(Boolean).slice(0, 2).join(' ')),
            recent.slow ? h('span', { style: Object.assign({}, S.headerRecentLabel, { color: 'var(--dsw-alias-state-error-primary)' }) }, t('slow')) : null)
        : null

      let body = null
      if (prefs.tab === 'drill') body = h(DrillTab, { store: store, stats: state.stats, prefs: prefs, t: t })
      else if (prefs.tab === 'stats') body = h(StatsTab, { store: store, stats: state.stats, prefs: prefs, t: t })
      else body = h(MapTab, { store: store, stats: state.stats, prefs: prefs, t: t, flash: props.flash, width: width, live: state.ui.live, reveal: reveal })

      return h('div', {
        ref: boxRef,
        style: Object.assign({}, S.panel, S.panelFloat, { left: pos.x, top: pos.y, width: width, opacity: prefs.opacity }),
        role: 'dialog',
        'aria-label': t('title'),
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
            t: t, prefs: prefs, store: store, surface: 'float', recentNode: recentNode,
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
      }, '鹤')
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
      apply(ctx) {
        ctx.effect(function () { return ctx.locale.register(NS, 'zh', ZH) }, 'xiaohe-shuangpin: zh')
        ctx.effect(function () { return ctx.locale.register(NS, 'en', EN) }, 'xiaohe-shuangpin: en')

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
        ctx.effect(function () { return installTypingCapture(store) }, 'xiaohe-shuangpin: typing capture')
        ctx.effect(function () {
          function flush() { store.save() }
          window.addEventListener('pagehide', flush)
          return function () {
            window.removeEventListener('pagehide', flush)
            store.save()
          }
        }, 'xiaohe-shuangpin: persistence')

        ctx.slots.inject('conversation.input.dock', function () {
          return ctx.slots.register(
            { name: 'conversation.input.dock', id: 'xiaohe-shuangpin', order: 2 },
            function () { return h(DockShell, { store: store, t: t }) },
          )
        })
        ctx.slots.inject('conversation.input.right', function () {
          return ctx.slots.register(
            { name: 'conversation.input.right', id: 'xiaohe-shuangpin-toggle', order: 5 },
            function () { return h(ToolbarToggle, { store: store, t: t }) },
          )
        })
        ctx.slots.inject('shell.overlay', function () {
          return ctx.slots.register(
            { name: 'shell.overlay', id: 'xiaohe-shuangpin-float', order: 4 },
            function () { return h(FloatShell, { store: store, t: t }) },
          )
        })
      },
    }
  },
})
